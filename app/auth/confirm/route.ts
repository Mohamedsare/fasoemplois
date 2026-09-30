import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Retour des liens e-mail (token_hash) et des connexions OAuth / PKCE (code), ex. Google.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const rawNext = searchParams.get("suivant") ?? nextFromRedirectTo(searchParams.get("redirect_to"), origin);
  const explicitNext = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;

  // Refus ou erreur côté fournisseur (ex. l'utilisateur annule sur l'écran Google)
  if (searchParams.get("error")) {
    console.error("[auth/confirm] erreur fournisseur :", searchParams.get("error"), searchParams.get("error_description"));
    return NextResponse.redirect(new URL("/connexion?erreur=oauth", origin));
  }

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    // Cause fréquente : retour sur un autre domaine que celui du départ (cookie PKCE absent)
    if (error) console.error("[auth/confirm] échange du code impossible :", error.message);
    ok = !error;
  }

  if (!ok) {
    return NextResponse.redirect(new URL(`/connexion?erreur=${code ? "oauth" : "lien-invalide"}`, origin));
  }

  const next = explicitNext ?? "/cv";

  return NextResponse.redirect(new URL(next, origin));
}

/**
 * Les modèles d'e-mail transmettent `redirect_to={{ .RedirectTo }}` (URL complète fournie par
 * Supabase, ex. https://votrecv.site/auth/confirm?suivant=/cv/…). On n'en garde que la
 * destination interne, et seulement si l'URL pointe vers ce site.
 */
function nextFromRedirectTo(redirectTo: string | null, origin: string) {
  if (!redirectTo) return null;
  try {
    const url = new URL(redirectTo, origin);
    const host = (h: string) => h.replace(/^www\./, "");
    if (host(url.hostname) !== host(new URL(origin).hostname)) return null;
    const suivant = url.searchParams.get("suivant");
    if (suivant) return suivant;
    return url.pathname !== "/" && url.pathname !== "/auth/confirm" ? url.pathname + url.search : null;
  } catch {
    return null;
  }
}
