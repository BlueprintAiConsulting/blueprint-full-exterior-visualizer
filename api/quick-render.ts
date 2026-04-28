import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ai, validateImagePayload, withTimeout } from './_utils.js';

type TextureStyleKey = 'horizontal-lap' | 'dutch-lap' | 'board-batten' | 'shake';
interface QuickZoneData {
  name: string;
  lineName: string;
  colorName: string;
  colorHex: string;
  hue: string;
  style?: 'horizontal' | 'vertical';
  textureStyle?: TextureStyleKey;
}

const TEXTURE_PROFILE_DESCRIPTIONS: Record<TextureStyleKey, string> = {
  'horizontal-lap':
    'traditional horizontal lap clapboard siding — planks run parallel to ground with a slight bottom reveal on each course',
  'dutch-lap':
    'Dutch lap (dutchlap) horizontal siding — each plank has a distinctive concave scoop routed at the top edge creating a shadow line',
  'board-batten':
    'vertical board-and-batten siding — wide vertical boards separated by narrow battens running continuously from foundation to eave',
  shake:
    'staggered cedar perfection shingle siding — squared-edge cedar shingles in overlapping horizontal rows with visible individual shingle units',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64, mimeType, zones } = req.body as {
    imageBase64: string;
    mimeType: string;
    zones: QuickZoneData[];
  };

  if (!imageBase64 || !zones?.length) {
    return res.status(400).json({ error: 'Missing imageBase64 or zones.' });
  }

  try {
    validateImagePayload(imageBase64, mimeType);
    const hasShutters = zones.some(z => z.name.toLowerCase().includes('shutter'));
    const hasTrim = zones.some(z => z.name.toLowerCase().includes('trim'));
    const hasGarage = zones.some(z => z.name.toLowerCase().includes('garage'));

    const exclusions = ['windows', 'doors', 'gutters', 'roof', 'sky', 'trees', 'shadows', 'lawn'];
    if (!hasShutters) exclusions.push('shutters');
    if (!hasTrim) exclusions.push('trim');
    if (!hasGarage) exclusions.push('garage doors');

    const hasVerticalZones = zones.some(z => z.style === 'vertical');

    let prompt = `You are a strict, precise material-replacement engine mapping new textures onto a residential home.\n\nApply ONLY these changes:\n`;
    zones.forEach(z => {
      const profileDesc =
        z.textureStyle && TEXTURE_PROFILE_DESCRIPTIONS[z.textureStyle]
          ? ` [PROFILE: ${TEXTURE_PROFILE_DESCRIPTIONS[z.textureStyle]}]`
          : z.style === 'vertical'
            ? ` [VERTICAL STYLE: render as tall vertical boards running floor-to-eave, not horizontal laps]`
            : '';
      prompt += `• ${z.name}: ${z.lineName} "${z.colorName}" — ${z.hue} (hex ref: ${z.colorHex})${profileDesc}\n`;
    });
    prompt += `\nCRITICAL RULES:
1. PRESERVATION: You MUST strictly map the new siding to the existing house geometry. DO NOT alter the structural layout, camera perspective, or aspect ratio.
2. NEGATIVE CONSTRAINTS: DO NOT add, remove, or modify ${exclusions.join(', ')}. Leave them 100% untouched.
3. RENOVATION SURFACES: If the house exterior contains brick, stone, masonry, stucco, or EIFS/synthetic stucco walls, treat them as viable siding surfaces for this renovation visualization — apply the selected siding product naturally over those wall areas as if new siding is being installed. Only preserve these materials on decorative accents, chimneys, or foundation bases that are clearly not part of the main wall cladding.
4. SCALE: The siding board width must accurately match the scale of the house in the photograph.${hasVerticalZones ? '\n5. VERTICAL SIDING: For zones marked [VERTICAL STYLE], render siding as distinct vertical boards (and narrow battens if Board & Batten style) running from top to bottom of each wall section. Do NOT render horizontal laps on these zones.' : ''}
${hasVerticalZones ? '6' : '5'}. LIGHTING: Keep the exact same sunlight, shadows, and lighting direction as the original photo.
${hasVerticalZones ? '7' : '6'}. PHOTOREALISM: The result must be pristine and professional. No AI artifacts, melting edges, or blurriness.`;

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
      'quick-render',
    );

    let resultImage: string | null = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        resultImage = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!resultImage) {
      return res.status(500).json({ error: 'AI model did not return an image. Please try again.' });
    }

    res.json({ resultImage });
  } catch (err: any) {
    console.error('[quick-render] error:', err?.message);
    const msg = (err?.message || '').toLowerCase();
    let errorMessage = 'Quick render failed. Please try again.';
    if (msg.includes('quota')) errorMessage = 'API quota exceeded.';
    else if (msg.includes('safety')) errorMessage = 'Image flagged by safety filters.';
    else if (err?.message) errorMessage = `Generation failed: ${err.message}`;
    res.status(500).json({ error: errorMessage });
  }
}
