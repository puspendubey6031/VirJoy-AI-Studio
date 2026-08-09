/**
 * OpenRouter text-generation provider.
 *
 * Supports: script generation, video planning, idea generation (text operations).
 * Does NOT support: image, video-clip, or voice generation.
 *
 * Requires OPENROUTER_API_KEY environment variable.
 * When the key is absent the caller should simply exclude this provider from
 * the chain — it is never a fatal application error.
 */

export interface OpenRouterTextOptions {
  systemPrompt: string;
  userPrompt: string;
  /** OpenRouter model slug. Defaults to a free/reliable model. */
  model?: string;
  timeoutMs?: number;
}

export interface OpenRouterTextResult {
  content: string;
  modelUsed: string;
}

// Free, high-availability model on OpenRouter (no per-token cost)
const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

/**
 * Call OpenRouter chat-completions and return the assistant message text.
 * Throws on any error so the fallback engine can continue to the next provider.
 */
export async function generateTextWithOpenRouter(
  options: OpenRouterTextOptions
): Promise<OpenRouterTextResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured — provider skipped');
  }

  const model = options.model ?? DEFAULT_MODEL;
  const controller = new AbortController();
  const timerId = setTimeout(
    () => controller.abort(new Error(`OpenRouter timed out after ${options.timeoutMs ?? 25_000}ms`)),
    options.timeoutMs ?? 25_000
  );

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://virjoy.ai',
        'X-Title': 'VirJoy AI'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: options.userPrompt }
        ],
        temperature: 0.7
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`OpenRouter HTTP ${res.status}: ${body.substring(0, 200)}`);
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';
    if (!content) throw new Error('OpenRouter returned empty content');

    return { content, modelUsed: model };
  } finally {
    clearTimeout(timerId);
  }
}

/** Returns true when OPENROUTER_API_KEY is present. */
export function isOpenRouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}
