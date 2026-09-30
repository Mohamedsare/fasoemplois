import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "./env";

const PROTECTED_PREFIXES = ["/espace", "/admin", "/paiement"];

const OAUTH_CODE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateSession(request: NextRequest) {
  // Filet de sécurité : si Supabase renvoie le retour OAuth (?code=… ou ?error=…) sur une autre
  // page que /auth/confirm (ex. l'accueil, quand l'URL de retour n'est pas dans la liste autorisée),
  // on le redirige vers /auth/confirm au lieu de perdre la connexion.
  const { pathname: path, searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const isOAuthReturn =
    (code && OAUTH_CODE.test(code)) || (searchParams.get("error") && searchParams.get("error_description"));
  if (path !== "/auth/confirm" && isOAuthReturn) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/confirm";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers ?? {}).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // Ne rien exécuter entre createServerClient et getClaims : cela rafraîchit la session.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  if (!isLoggedIn && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = `?suivant=${encodeURIComponent(pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  return response;
}
