import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ai, validateImagePayload, withTimeout } from './_utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64, mimeType } = req.body as {
    imageBase64: string;
    mimeType: string;
  };

  if (!imageBase64) {
    return res.status(400).json({ error: 'Missing imageBase64.' });
  }

  try {
    validateImagePayload(imageBase64, mimeType);

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } },
            {
              text: `You are an expert roofing analyst. Analyze this house photograph and identify every DISTINCT roof plane or roofing zone that a homeowner might want to apply a DIFFERENT shingle color or material to.

SECTION IDENTIFICATION RULES:
- Identify ALL colorable ROOFING zones:
  * PRIMARY ROOF: the main, largest roof plane visible.
  * SECONDARY PLANES: hip returns, gable-end roofs, side wings — if clearly a separate plane from the primary.
  * DORMERS: any dormer roofs visible, grouped as one zone unless dramatically different sizes.
  * GARAGE ROOF: if the garage has a separate, distinct roof plane.
  * PORCH ROOF / PORTICO: if present and separate from the main roofline.
- OPTIONAL ACCENT ZONES (return in "optionalSections"):
  * GUTTERS: if metal gutters are visible along eaves.
  * RIDGE VENTS / RIDGE CAPS: if a separate ridge cap color is visible.
- NEVER include: siding, windows, doors, landscaping, sky, foundation, driveways, people, vehicles.
- Each zone must be architecturally DISTINCT — on a different plane or clearly separate.
- Order sections by prominence (largest roof plane first).

SECTION NAMING - use ONLY these canonical names:
  Primary Roof, Secondary Roof, Dormer Roof, Garage Roof, Porch Roof, Portico Roof
  (For optional accents: Gutters, Ridge Cap)
  (If none fit, use a concise 2-3 word descriptive name.)

For each maskTarget: describe the zone's exact location and boundaries on the roof.

CRITICAL PRE-FLIGHT CHECK: determine if the image contains a residential house with a visible roof.

Return ONLY valid JSON - no markdown, no code fences, matching this schema:
{
  "isResidentialHouse": boolean,
  "sections": [{ "name": "canonical name", "maskTarget": "precise description" }],
  "optionalSections": [{ "name": "accent name", "maskTarget": "precise description" }]
}`,
            },
          ],
        },
      }),
      30_000,
      'roof-detect-sections',
    );

    const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = rawText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let parsed: any;
    try {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) throw new Error('No JSON object found');
      parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    } catch {
      console.error('[roof-detect-sections] JSON parse error. Raw:', rawText.slice(0, 300));
      return res.status(500).json({ error: 'AI returned an invalid format. Please try a clearer image.' });
    }

    if (parsed.isResidentialHouse === false) {
      return res.status(400).json({
        error:
          'PREFLIGHT_FAILURE: The uploaded image does not appear to contain a residential roof. Please upload a clear exterior photo showing the roof.',
      });
    }

    res.json({ sections: parsed.sections || [], optionalSections: parsed.optionalSections || [] });
  } catch (err: any) {
    console.error('[roof-detect-sections] error:', err?.message);
    res.status(500).json({ error: err?.message || 'Roof section detection failed.' });
  }
}
