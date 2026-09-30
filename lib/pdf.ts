import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";

// ---------------------------------------------------------------------------
// Jeton d'accès à la page d'impression (valable 2 minutes, lié à un CV)
// ---------------------------------------------------------------------------
function secret() {
  const s = process.env.PDF_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("PDF_SECRET ou SUPABASE_SERVICE_ROLE_KEY requis pour générer les PDF");
  return s;
}

const sign = (cvId: string, exp: number) => createHmac("sha256", secret()).update(`cv-pdf:${cvId}:${exp}`).digest("base64url");

export function createPrintToken(cvId: string, ttlSeconds = 120) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return `${exp}.${sign(cvId, exp)}`;
}

export function verifyPrintToken(cvId: string, token: string | undefined | null) {
  if (!token) return false;
  const [expRaw, signature] = token.split(".");
  const exp = Number(expRaw);
  if (!Number.isInteger(exp) || exp < Date.now() / 1000 || !signature) return false;
  const expected = Buffer.from(sign(cvId, exp));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

// ---------------------------------------------------------------------------
// Navigateur headless : Chromium serverless sur Vercel, Chrome/Edge installé en local
// ---------------------------------------------------------------------------
const LOCAL_BROWSERS = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

export async function launchBrowser() {
  const puppeteer = (await import("puppeteer-core")).default;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
      executablePath: await chromium.executablePath(),
      headless: "shell",
    });
  }
  const executablePath = LOCAL_BROWSERS.find((p) => p && existsSync(p));
  if (!executablePath) throw new Error("Aucun Chrome local trouvé : définissez CHROME_PATH");
  return puppeteer.launch({ executablePath, headless: true });
}

/** Nom de fichier propre : « CV-Awa-Ouedraogo.pdf ». */
export function pdfFileName(fullName: string, title: string) {
  const base = (fullName || title || "CV")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `CV-${base || "Votre-CV"}.pdf`;
}
