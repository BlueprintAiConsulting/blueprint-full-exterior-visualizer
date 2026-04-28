import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ai, validateImagePayload, withTimeout } from './_utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64, mimeType: srcMimeType, sections } = req.body as {
    imageBase64: string;
    mimeType?: string;
    sections: {
      id: string;
      name: string;
      maskTarget: string;
      maskData: string | null;
      selectedProduct: { tier: string; line: string; materialType: string };
      selectedColor: { name: string; hex: string; hue: string };
    }[];
  };

  if (!imageBase64 || !sections?.length) {
    return res.status(400).json({ error: 'Missing imageBase64 or sections.' });
  }

  try {
    validateImagePayload(imageBase64, srcMimeType);
    const parts: any[] = [
      { inlineData: { data: imageBase64, mimeType: srcMimeType || 'image/jpeg' } },
    ];

    let promptText = `You are an expert architectural roofing visualizer. Modify ONLY the roof in this house image according to these section specifications:`;

    sections.forEach((section, index) => {
      if (section.maskData) {
        const maskBase64 = section.maskData.includes(',')
          ? section.maskData.split(',')[1]
          : section.maskData;
        parts.push({ inlineData: { data: maskBase64, mimeType: 'image/jpeg' } });
        promptText += `\n\nROOF SECTION ${index + 1} (${section.name}):
- Target Area: Defined by mask image #${index + 1} (white = target roof area).
- Product: ${section.selectedProduct.line} — ${section.selectedProduct.materialType}
- Color: ${section.selectedColor.name} — ${section.selectedColor.hue} (Hex: ${section.selectedColor.hex})`;
      }
    });

    promptText += `\n\nCRITICAL INSTRUCTIONS:
1. HARD BOUNDARIES: The white masks define ABSOLUTE constraints. New shingles MUST NOT bleed outside the mask onto siding, windows, or sky.
2. GEOMETRIC PRESERVATION: Preserve the exact roof pitch, ridge lines, hip lines, valleys, and flashing. You are a material-replacement engine, NOT a creative generator.
3. NEGATIVE CONSTRAINTS: DO NOT alter siding, windows, doors, trim, landscaping, sky, or any non-roof element.
4. TEXTURE: Render realistic shingle granule texture with visible course lines appropriate to the product type.
5. LIGHTING: Preserve the original photo's sunlight direction and shadow map exactly.
6. PHOTOREALISM: The result must be pristine — no AI artifacts, melting edges, or blurriness.`;

    parts.push({ text: promptText });

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts },
      }),
      120_000,
      'roof-generate',
    );

    let resultImage: string | null = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        resultImage = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!resultImage) {
      return res.status(500).json({ error: 'Failed to generate roofing visualization.' });
    }

    res.json({ resultImage });
  } catch (err: any) {
    console.error('[roof-generate] error:', err?.message);
    const msg = (err?.message || '').toLowerCase();
    let errorMessage = 'Roof generation failed. Please try again.';
    if (msg.includes('quota')) errorMessage = 'API quota exceeded.';
    else if (msg.includes('safety')) errorMessage = 'Image flagged by safety filters.';
    else if (err?.message) errorMessage = `Generation failed: ${err.message}`;
    res.status(500).json({ error: errorMessage });
  }
}
