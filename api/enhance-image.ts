import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ai, validateImagePayload } from './_utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64, mimeType = 'image/jpeg' } = req.body as {
    imageBase64: string;
    mimeType?: string;
  };

  if (!imageBase64) {
    res.status(400).json({ error: 'imageBase64 is required' });
    return;
  }

  try {
    validateImagePayload(imageBase64, mimeType);

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            {
              text: `You are an image preparation specialist for a residential siding visualizer tool. Transform this home exterior photo to be OPTIMAL for AI-powered siding replacement.

REMOVE these elements completely (fill with realistic background):
- All parked vehicles: cars, trucks, SUVs, motorcycles — in driveway, street, or yard
- All people and pets
- Large tree limbs or dense foliage covering more than 15% of the visible siding area
- Construction equipment, ladders, or temporary objects in front of/on the house

STRICTLY PRESERVE unchanged:
- Exact roofline shape, pitch, and silhouette
- All windows: exact size, placement, style, trim, glass
- All doors: front, garage, side — exact style and placement
- All trim: corner boards, fascia, soffits, window casings, shutters
- Foundation, porch, steps, railings, columns
- Exact house proportions and overall dimensions
- Brick, stone, or masonry accents

OPTIMIZE:
- Brightness: siding clearly visible, not overexposed or underlit
- Contrast: slightly increased to emphasize material texture
- Colors: accurate, neutral — no artistic filters, no HDR, no over-saturation
- Sharpness: crisp enough to show siding texture details

Output a single photorealistic, clean, well-lit home exterior photo preserving the exact architecture, optimized for AI siding material visualization.`,
            },
          ],
        },
      ],
      config: { responseModalities: ['IMAGE', 'TEXT'], temperature: 0.2 },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    let enhancedBase64: string | null = null;
    let outMime = 'image/png';

    for (const part of parts) {
      if ((part as { inlineData?: { data?: string; mimeType?: string } }).inlineData?.data) {
        const id = (part as { inlineData: { data: string; mimeType?: string } }).inlineData;
        enhancedBase64 = id.data;
        outMime = id.mimeType ?? 'image/png';
        break;
      }
    }

    if (!enhancedBase64) {
      res.status(500).json({ error: 'Gemini did not return an enhanced image. Try a different photo.' });
      return;
    }

    res.json({ enhancedImageBase64: enhancedBase64, mimeType: outMime });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('enhance-image error:', msg);
    res.status(500).json({ error: msg });
  }
}
