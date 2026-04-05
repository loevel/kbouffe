/**
 * Email AI utilities — Workers AI integration for email templates
 * Handles: Generate, Improve, Translate, Variants
 */

export interface AIGenerateRequest {
    category: "restaurant" | "supplier" | "client";
    topic: string;
    tone?: "professional" | "friendly" | "casual";
}

export interface AIGenerateResponse {
    subject: string;
    body: string;
    variables: string[];
}

export interface AIImproveRequest {
    subject: string;
    body: string;
    category: "restaurant" | "supplier" | "client";
}

export interface AIImproveResponse {
    suggestions: {
        type: "tone" | "clarity" | "length" | "engagement";
        current: string;
        suggested: string;
        reason: string;
    }[];
    improvedSubject?: string;
    improvedBody?: string;
}

export interface AITranslateRequest {
    subject: string;
    body: string;
    fromLang: "en" | "fr";
    toLang: "en" | "fr";
}

export interface AIVariantsResponse {
    variants: {
        tone: "conservative" | "aggressive" | "neutral";
        subject: string;
        body: string;
    }[];
}

const CATEGORY_CONTEXT = {
    restaurant: {
        audience: "restaurant owners and staff",
        focus: "menu updates, promotions, operations, compliance",
        tone: "professional but friendly",
    },
    supplier: {
        audience: "food suppliers and distributors",
        focus: "orders, payments, supply chain, partnerships",
        tone: "professional",
    },
    client: {
        audience: "food customers and clients",
        focus: "orders, deliveries, promotions, loyalty",
        tone: "friendly and engaging",
    },
};

/**
 * Generate email template from scratch using AI
 */
export async function generateTemplate(
    ai: any, // Cloudflare Workers AI
    req: AIGenerateRequest
): Promise<AIGenerateResponse> {
    const context = CATEGORY_CONTEXT[req.category];

    const prompt = `You are an expert email copywriter for a food ordering platform in Cameroon called KBouffe.

Generate a professional email template for: ${req.topic}

Audience: ${context.audience}
Focus: ${context.focus}
Tone: ${context.tone}
Language: French

Requirements:
- Subject line: compelling, clear, 5-10 words
- Body: well-structured HTML, 150-300 words
- Include natural placeholder variables using {{variable_name}} syntax
- Variables should be relevant to the context (e.g., {{restaurant_name}}, {{client_name}})
- Use proper French grammar and vocabulary
- Make it mobile-friendly with proper HTML structure

Return ONLY valid JSON in this format (no markdown, no extra text):
{
  "subject": "Subject line here",
  "body": "<html email body with variables>",
  "variables": ["{{variable1}}", "{{variable2}}"]
}`;

    try {
        const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1500,
        } as any);

        const text = (response as any).response || "";
        const parsed = JSON.parse(text);
        return {
            subject: parsed.subject || "Email Subject",
            body: parsed.body || "<p>Email body</p>",
            variables: Array.isArray(parsed.variables) ? parsed.variables : [],
        };
    } catch {
        return {
            subject: `Re: ${req.topic}`,
            body: `<p>Bonjour,</p><p>Merci pour votre intérêt à ${req.topic}.</p><p>Cordialement,<br/>L'équipe KBouffe</p>`,
            variables: [],
        };
    }
}

/**
 * Improve existing template with AI suggestions
 */
export async function improveTemplate(
    ai: any,
    req: AIImproveRequest
): Promise<AIImproveResponse> {
    const context = CATEGORY_CONTEXT[req.category];

    const prompt = `You are an expert email marketing consultant.

Analyze this email template and suggest improvements:

Subject: ${req.subject}
Body: ${req.body}

For audience: ${context.audience}
Context: ${context.focus}

Provide suggestions in these areas:
1. Tone - Is it appropriate for the audience?
2. Clarity - Is the message clear?
3. Length - Is it concise enough?
4. Engagement - Will it drive action?

Also provide the improved version.

Important: Preserve all {{variable}} placeholders exactly as they appear.

Return ONLY valid JSON (no markdown):
{
  "suggestions": [
    {
      "type": "tone|clarity|length|engagement",
      "current": "what's currently wrong",
      "suggested": "what should change",
      "reason": "why this matters"
    }
  ],
  "improvedSubject": "improved subject with {{variables}} preserved",
  "improvedBody": "<improved body with {{variables}} preserved>"
}`;

    try {
        const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2000,
        } as any);

        const text = (response as any).response || "";
        const parsed = JSON.parse(text);
        return {
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
            improvedSubject: parsed.improvedSubject,
            improvedBody: parsed.improvedBody,
        };
    } catch {
        return {
            suggestions: [
                {
                    type: "tone",
                    current: "unknown",
                    suggested: "Consider reviewing tone for better engagement",
                    reason: "To improve open rates",
                },
            ],
        };
    }
}

/**
 * Translate email template while preserving variables
 */
export async function translateTemplate(
    ai: any,
    req: AITranslateRequest
): Promise<{ subject: string; body: string }> {
    const langLabel = {
        en: "English",
        fr: "French",
    };

    const prompt = `You are a professional translator specializing in email marketing for the food industry in Cameroon.

Translate this email from ${langLabel[req.fromLang]} to ${langLabel[req.toLang]}:

Subject: ${req.subject}
Body: ${req.body}

CRITICAL: Preserve ALL {{variable}} placeholders exactly as they appear - do NOT translate them.

Return ONLY valid JSON (no markdown):
{
  "subject": "translated subject with {{variables}} preserved",
  "body": "translated body HTML with {{variables}} preserved"
}`;

    try {
        const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1500,
        } as any);

        const text = (response as any).response || "";
        const parsed = JSON.parse(text);
        return {
            subject: parsed.subject || req.subject,
            body: parsed.body || req.body,
        };
    } catch {
        return {
            subject: req.subject,
            body: req.body,
        };
    }
}

/**
 * Generate 3 template variants for A/B testing
 */
export async function generateVariants(
    ai: any,
    subject: string,
    body: string,
    category: "restaurant" | "supplier" | "client"
): Promise<AIVariantsResponse> {
    const context = CATEGORY_CONTEXT[category];

    const prompt = `You are an expert email marketer specializing in A/B testing.

Generate 3 variants of this email for A/B testing:

Subject: ${subject}
Body: ${body}

Create variants with these tones:
1. Conservative - professional, risk-averse, trust-focused
2. Aggressive - bold, action-oriented, urgency-focused
3. Neutral - balanced, straightforward, value-focused

Context: ${context.focus}
Audience: ${context.audience}

CRITICAL: Preserve ALL {{variable}} placeholders exactly as they appear.

Return ONLY valid JSON (no markdown):
{
  "variants": [
    {
      "tone": "conservative|aggressive|neutral",
      "subject": "subject line with {{variables}} preserved",
      "body": "html body with {{variables}} preserved"
    }
  ]
}`;

    try {
        const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2500,
        } as any);

        const text = (response as any).response || "";
        const parsed = JSON.parse(text);
        return {
            variants: Array.isArray(parsed.variants)
                ? parsed.variants.slice(0, 3)
                : [
                      { tone: "neutral" as const, subject, body },
                  ],
        };
    } catch {
        return {
            variants: [{ tone: "neutral" as const, subject, body }],
        };
    }
}
