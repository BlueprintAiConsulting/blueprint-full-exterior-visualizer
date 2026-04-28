import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ai, validateImagePayload, withTimeout } from './_utils.js';

interface SectionData {
  id: string;
  name: string;
  maskData: string | null;
  selectedLine: { tier: string; line: string; material: string };
  selectedColor: { name: string; hex: string; hue: string };
  maskTarget: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64, sections, lightingCondition, mimeType: srcMimeType } = req.body as {
    imageBase64: string;
    sections: SectionData[];
    lightingCondition: string;
    mimeType?: string;
  };

  if (!imageBase64 || !sections?.length) {
    return res.status(400).json({ error: 'Missing required fields: imageBase64, sections.' });
  }

  try {
    validateImagePayload(imageBase64, srcMimeType);
    const parts: any[] = [
      { inlineData: { data: imageBase64, mimeType: srcMimeType || 'image/jpeg' } },
    ];

    let promptText = `You are an expert architectural visualizer. Modify this house image according to the following section specifications:`;

    sections.forEach((section, index) => {
      if (section.maskData) {
        const maskBase64 = section.maskData.includes(',')
          ? section.maskData.split(',')[1]
          : section.maskData;
        parts.push({ inlineData: { data: maskBase64, mimeType: 'image/jpeg' } });
        promptText += `\n\nSECTION ${index + 1} (${section.name}):
- Target Area: Defined by the provided mask image #${index + 1} (where white is the target).
- Material: ${section.selectedLine.line} ${section.selectedLine.material}
- Color: ${section.selectedColor.name} — ${section.selectedColor.hue} (Hex reference: ${section.selectedColor.hex})`;
      }
    });

    promptText += `\n\nCRITICAL INSTRUCTIONS:
1. HARD BOUNDARIES: Treat the provided white masks as ABSOLUTE constraints. The new siding MUST NOT bleed over the masked boundaries into unmasked areas.
2. GEOMETRIC PRESERVATION: You are functioning as a precise material-replacement engine, NOT a creative image generator. You MUST preserve the exact geometric structure, structural lines, perspective, lighting direction, and surrounding environment of the source image.
3. NEGATIVE CONSTRAINTS: DO NOT TOUCH or alter roof shingles, window glass, door glass, gutters, downspouts, landscaping, driveways, or sky unless explicitly covered by a white mask. Shutters, trim boards, corner boards, soffits, fascia, doors, garage doors, brick, stone, masonry, stucco, and EIFS surfaces MAY all be altered if covered by a white mask.
4. LIGHTING INTEGRITY: Apply a ${(lightingCondition || 'daylight').toLowerCase()} lighting condition to the siding, but respect the original shadow map of the house.
5. SCALE: Ensure the siding laps/boards are correctly scaled relative to the distance of the house.
6. PHOTOREALISM: The applied siding must look like a high-end architectural photo, avoiding any blurry "AI generation" artifacts.`;

    parts.push({ text: promptText });

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts },
      }),
      120_000,
      'generate',
    );

    let resultImage: string | null = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        resultImage = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!resultImage) {
      return res.status(500).json({ error: 'Failed to generate the visualized image. Please try again.' });
    }

    res.json({ resultImage });
  } catch (err: any) {
    console.error('[generate] error:', err?.message);
    const msg = (err?.message || '').toLowerCase();
    let errorMessage = 'Something went wrong while processing the image. Please try again.';
    if (msg.includes('quota')) errorMessage = 'API quota exceeded. Please try again later.';
    else if (msg.includes('not found')) errorMessage = 'AI model not found.';
    else if (msg.includes('safety')) errorMessage = 'The image was flagged by safety filters.';
    else if (err?.message) errorMessage = `Generation failed: ${err.message}`;
    res.status(500).json({ error: errorMessage });
  }
}
