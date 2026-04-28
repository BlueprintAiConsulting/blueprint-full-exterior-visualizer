import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ai, validateImagePayload, withTimeout } from './_utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64, mimeType } = req.body as {
    imageBase64: string;
    mimeType: string;
  };

  if (!imageBase64) {
    return res.status(400).json({ error: 'Missing required field: imageBase64.' });
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
              text: `You are an expert architectural analyst specializing in residential exterior design. Analyze this house photograph and identify every DISTINCT exterior zone that a homeowner might want to apply a DIFFERENT siding color or material to.

SECTION IDENTIFICATION RULES:
- Identify ALL colorable SIDING exterior zones:
  * SIDING surfaces: horizontal lap siding, vertical board siding, vinyl panels, fiber cement, wood clapboard, composite siding, AND any brick, stone, masonry, or stucco walls (common renovation targets).
  * GARAGE DOOR: if present and colorable, include as its own zone.
- OPTIONAL ACCENT ZONES (return separately in "optionalSections"):
  * TRIM & ACCENTS: trim boards, corner boards, window trim, door trim, frieze boards — group all matching trim as one zone.
  * SHUTTERS: decorative or functional shutters — group all matching shutters on the house as one unified zone.
- NEVER include: roof shingles/tiles, skylights, window glass panes, door glass, front door, entry door, side doors, gutters and downspouts, soffit, fascia, chimneys, foundation/concrete base, driveway, landscaping, sky, people, or vehicles.
- Each zone must be architecturally DISTINCT: on a different plane, separated by a physical break, or clearly a different element type.
- Return ALL distinct zones you identify — there is no maximum. If one continuous siding surface exists, return only 1.
- Order sections by prominence (largest/most visible siding first).

SECTION NAMING - use ONLY these canonical names:
  Main Body, Upper Gable, Lower Gable, Dormer, Garage Bay, Porch Surround, Second Story, First Story, Side Wing, Accent Band, Garage Door
  (For optional accents: Shutters, Trim, Corner Boards)
  (If none fit, use a concise 2-3 word descriptive name.)

For each maskTarget: describe the zone's exact location and boundaries, referencing neighboring elements as exclusion anchors.

CRITICAL PRE-FLIGHT CHECK: First, determine if the image actually contains a residential house or building.

Return ONLY valid JSON - no markdown, no code fences, no explanation, matching this exact schema:
{
  "isResidentialHouse": boolean,
  "sections": [
    {
      "name": "canonical name",
      "maskTarget": "precise segmentation instruction for this zone"
    }
  ],
  "optionalSections": [
    {
      "name": "canonical accent name (Shutters, Trim, Corner Boards)",
      "maskTarget": "precise segmentation instruction for this accent zone"
    }
  ]
}`,
            },
          ],
        },
      }),
      30_000,
      'detect-sections',
    );

    const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = rawText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let parsed: {
      isResidentialHouse: boolean;
      sections: { name: string; maskTarget: string }[];
      optionalSections?: { name: string; maskTarget: string }[];
    };

    try {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) throw new Error('No JSON object found');
      parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    } catch {
      console.error('[detect-sections] JSON parse error. Raw:', rawText.slice(0, 300));
      return res.status(500).json({ error: 'AI returned an invalid format. Please try a clearer image.' });
    }

    if (parsed.isResidentialHouse === false) {
      return res.status(400).json({
        error:
          'PREFLIGHT_FAILURE: The uploaded image does not appear to be a residential house or building suitable for siding. Please upload a clear exterior photo.',
      });
    }

    const EXCLUDED_NAMES = ['front door', 'entry door', 'side door', 'door'];
    const OPTIONAL_NAMES = ['shutters', 'trim', 'corner boards'];

    parsed.sections = (parsed.sections || []).filter(
      s => !EXCLUDED_NAMES.some(ex => s.name.toLowerCase().includes(ex)),
    );

    const primarySections = parsed.sections.filter(
      s => !OPTIONAL_NAMES.some(opt => s.name.toLowerCase().includes(opt)),
    );
    const accentFromSections = parsed.sections.filter(s =>
      OPTIONAL_NAMES.some(opt => s.name.toLowerCase().includes(opt)),
    );

    const rawOptional = parsed.optionalSections || [];
    const filteredOptional = rawOptional.filter(
      (s: any) => !EXCLUDED_NAMES.some(ex => s.name.toLowerCase().includes(ex)),
    );
    const allOptional = [...accentFromSections, ...filteredOptional];
    const seenOpt = new Set<string>();
    const uniqueOptional = allOptional.filter(s => {
      const key = s.name.toLowerCase();
      if (seenOpt.has(key)) return false;
      seenOpt.add(key);
      return true;
    });

    res.json({ sections: primarySections, optionalSections: uniqueOptional });
  } catch (err: any) {
    console.error('[detect-sections] error:', err?.message);
    res.status(500).json({ error: err?.message || 'Section detection failed.' });
  }
}
