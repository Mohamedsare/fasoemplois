import "server-only";

/**
 * Appel à l'API OpenAI (Chat Completions, réponse JSON).
 * Variables : OPENAI_API_KEY (obligatoire), OPENAI_MODEL (facultatif).
 *
 * Par défaut : GPT-6.1 Sol, modèle récent et puissant d'OpenAI, environ 5 fois moins cher que
 * GPT-6 Astra (2 $ / 10 $ par million de jetons, septembre 2026).
 * C'est un modèle à raisonnement : pas de `temperature`, un budget `max_completion_tokens`
 * qui inclut la réflexion, et un effort de raisonnement réglable.
 */
const DEFAULT_MODEL = "gpt-6.1-sol";

export type ReasoningEffort = "low" | "medium" | "high";

/** Modèles à raisonnement (familles o*, gpt-5*, gpt-6*) : paramètres différents des modèles classiques. */
function isReasoningModel(model: string) {
  return /^(o\d|gpt-5|gpt-6)/.test(model);
}

export class AiError extends Error {
  constructor(
    message: string,
    readonly code: "not_configured" | "timeout" | "provider" | "invalid_output",
  ) {
    super(message);
  }
}

export const isAiConfigured = () => Boolean(process.env.OPENAI_API_KEY);

/** Consignes communes : style, marché local et honnêteté (rien d'inventé). */
export const CV_SYSTEM_PROMPT = `Tu es un conseiller carrière expert du marché de l'emploi au Burkina Faso et en Afrique de l'Ouest francophone.
Tu aides des candidats à rédiger un CV professionnel en français : phrases courtes, verbes d'action, style sobre, sans fautes.
Règles impératives :
- N'invente JAMAIS d'employeur, de diplôme, d'école, de date, de chiffre ni de résultat. Utilise uniquement les informations fournies.
- Si un chiffre rendrait une réalisation plus convaincante mais n'est pas fourni, écris « [à préciser] » à sa place.
- Pas d'emojis, pas de superlatifs creux (« passionné », « dynamique » en boucle), pas de première personne excessive.
- Réponds uniquement avec un objet JSON valide respectant le format demandé.`;

export async function askJson<T>(
  userPrompt: string,
  options: { maxTokens?: number; temperature?: number; effort?: ReasoningEffort } = {},
): Promise<T> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new AiError("Assistant IA non configuré", "not_configured");

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const reasoning = isReasoningModel(model);
  const outputTokens = options.maxTokens ?? 1200;

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        ...(reasoning
          ? {
              // La réflexion consomme aussi des jetons : budget large pour ne pas tronquer la réponse
              reasoning_effort: options.effort ?? "low",
              max_completion_tokens: outputTokens + 6000,
            }
          : { temperature: options.temperature ?? 0.4, max_completion_tokens: outputTokens }),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: CV_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
      // Sous la limite de 60 s de la page (maxDuration)
      signal: AbortSignal.timeout(55_000),
    });
  } catch (e) {
    if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError"))
      throw new AiError("L'assistant a mis trop de temps à répondre", "timeout");
    throw new AiError("Assistant injoignable", "provider");
  }

  if (!res.ok) {
    // Le détail reste dans les logs serveur (clé invalide, quota OpenAI, modèle inconnu…)
    console.error("[ai] OpenAI", res.status, (await res.text()).slice(0, 500));
    throw new AiError("L'assistant IA est momentanément indisponible", "provider");
  }

  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content;
  try {
    return JSON.parse(content ?? "") as T;
  } catch {
    throw new AiError("Réponse de l'assistant illisible", "invalid_output");
  }
}
