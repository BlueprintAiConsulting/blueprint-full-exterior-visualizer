import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ai, validateImagePayload, withTimeout } from './_utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64, mimeType, zones } = req.body as {
    imageBase64: string;
    mimeType: string;
    zones: {
      name: string;
      productName: string;
      colorName: string;
      colorHex: string;
      hue: string;
      materialType: string;
    }[];
  };

  if (!imageBase64 || !zones?.length) {
    return res.status(400).json({ error: 'Missing imageBase64 or zones.' });
  }

  try {
    validateImagePayload(imageBase64, mimeType);

    let prompt = `You are a strict, precise roofing material-replacement engine. Replace ONLY the roof shingles and specified accent zones on this residential home.\n\nApply ONLY these changes:\n`;
    zones.forEach(z => {
      prompt += `• ${z.name}: ${z.productName} "${z.colorName}" — ${z.hue} (hex ref: ${z.colorHex}) [${z.materialType}]\n`;
    });
    prompt += `\nCRITICAL RULES:
1. PRESERVATION: You MUST strictly map the new roofing materials to the existing roof geometry. DO NOT alter the roof pitch, camera perspective, structural layout, or aspect ratio.
2. NEGATIVE CONSTRAINTS: DO NOT add, remove, or modify siding, windows, doors, landscaping, sky, foundation, driveways. Leave them 100% untouched.
3. ROOF-ONLY: Apply shingle changes ONLY to visible roof surfaces. Gutter changes apply ONLY to gutter/fascia areas along eaves and rakes.
4. TEXTURE: Each shingle must show realistic granule texture and shadow lines between courses appropriate to the material type specified.
5. LIGHTING: Keep the exact same sunlight direction, shadows, and lighting as the original photo.
6. PHOTOREALISM: The result must look like a premium architectural photograph. No AI artifacts, melting edges, or blurriness.`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            { inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } },
            { text: prompt },
          ],
        },
      }),
      90_000,
      'roof-quick-render',
    );

    let resultImage: string | null = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        resultImage = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!resultImage) {
      return res.status(500).json({ error: 'AI did not return an image. Please try again.' });
    }

    res.json({ resultImage });
  } catch (err: any) {
    console.error('[roof-quick-render] error:', err?.message);
    const msg = (err?.message || '').toLowerCase();
    let errorMessage = 'Roof quick render failed. Please try again.';
    if (msg.includes('quota')) errorMessage = 'API quota exceeded.';
    else if (msg.includes('safety')) errorMessage = 'Image flagged by safety filters.';
    else if (err?.message) errorMessage = `Generation failed: ${err.message}`;
    res.status(500).json({ error: errorMessage });
  }
}
