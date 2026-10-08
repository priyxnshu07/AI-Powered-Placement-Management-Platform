const { z } = require('zod');

/**
 * The contract every IMatchingEngine must return. LLM output is untrusted
 * input: it is parsed against this schema, and anything that does not fit
 * is rejected so the caller falls back to the deterministic engine instead
 * of writing garbage (score: 7, confidence: "very high") to the database.
 */
const matchResultSchema = z.object({
  score: z.number().min(0).max(1),
  reason: z.string().trim().min(1).max(500),
  confidence: z.enum(['high', 'medium', 'low']),
});

function parseMatchResult(candidate) {
  const result = matchResultSchema.safeParse(candidate);
  if (!result.success) return null;
  return { ...result.data, score: Math.round(result.data.score * 100) / 100 };
}

// JSON Schema handed to Gemini so the model is constrained to this shape.
const matchResultJsonSchema = {
  type: 'object',
  properties: {
    score: { type: 'number', minimum: 0, maximum: 1 },
    reason: { type: 'string' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
  required: ['score', 'reason', 'confidence'],
};

module.exports = { matchResultSchema, parseMatchResult, matchResultJsonSchema };
