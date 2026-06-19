import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';
import cors from 'cors';
import PDFDocument from 'pdfkit';

const app = express();
app.set('trust proxy', true);

app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));

// Lazy init for Gemini API client to ensure Secret Manager environment is populated
let _ai: GoogleGenAI | null = null;
function getAI() {
  if (!_ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Set it in Secret Manager.");
    }
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _ai;
}

// Lazy init for Gmail transporter
let _gmailTransport: nodemailer.Transporter | null = null;
let _gmailInitialized = false;
function getGmailTransport() {
  if (!_gmailInitialized) {
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      _gmailTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
    }
    _gmailInitialized = true;
  }
  return _gmailTransport;
}

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[API REQUEST] ${req.method} ${req.url}`);
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[API RESPONSE] ${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Rate limiters
const generationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment before trying again.' }
});

const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests.' }
});

// Utility: timeout wrapper
const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)),
  ]);

// Image validation helper
function validateImagePayload(base64: string, mime: string = '') {
  if (!base64) throw new Error('Missing imageBase64 payload');
  const rawBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  if (rawBase64.length < 100) throw new Error('imageBase64 payload is too small to be a valid image');
  
  let activeMime = mime;
  if (!activeMime && base64.startsWith('data:image/')) {
    activeMime = base64.substring(5, base64.indexOf(';'));
  }
  
  const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (activeMime && !validMimes.includes(activeMime.toLowerCase())) {
    throw new Error(`Invalid image MIME type: ${activeMime}. Must be jpeg, png, webp, or heic.`);
  }

  const roughSizeBytes = rawBase64.length * 0.75;
  if (roughSizeBytes > 20 * 1024 * 1024) throw new Error('Image exceeds 20MB safety limit');
}

// ---------------------------------------------------------------------------
// ENDPOINTS
// ---------------------------------------------------------------------------

// POST /api/auto-mask
app.post('/api/auto-mask', generationLimiter, async (req, res) => {
  const { imageBase64, mimeType, maskTarget } = req.body as { imageBase64: string; mimeType: string; maskTarget: string };
  if (!imageBase64 || !maskTarget) {
    return res.status(400).json({ error: 'Missing required fields: imageBase64, maskTarget.' });
  }
  try {
    validateImagePayload(imageBase64, mimeType);
    const targetLower = maskTarget.toLowerCase();
    const allExclusions = ['roof', 'windows', 'window frames', 'shutters', 'doors', 'garage doors', 'trim', 'gutters', 'downspouts', 'fascia', 'soffits', 'foundation', 'concrete', 'sky', 'grass', 'trees', 'plants', 'people', 'vehicles', 'shadows'];
    const activeExclusions = allExclusions.filter(e => !targetLower.includes(e));

    const response = await withTimeout(getAI().models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType: mimeType || 'image/png' } },
          {
            text: `Create a pixel-perfect, high-contrast binary segmentation mask (black and white only) for the following target: "${maskTarget}".
              
CRITICAL RULES:
1. The ${maskTarget} MUST be PURE WHITE (#FFFFFF).
2. EVERYTHING ELSE MUST be PURE BLACK (#000000).
3. EXCLUDE: ${activeExclusions.join(', ')}.
4. SHARP EDGES: Ensure the mask has crisp, sharp boundaries. NO BLUR, NO GRADIENTS, NO GRAYSCALE.
5. ACCURACY: Carefully follow the architectural lines of the house.
6. OUTPUT: Return only a flat, 2D black and white silhouette mask image.`,
          },
        ],
      },
    }), 90_000, 'auto-mask');

    let maskBase64 = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        maskBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
    if (!maskBase64) return res.status(500).json({ error: 'Failed to generate mask. Please try again.' });
    res.json({ maskBase64 });
  } catch (err: any) {
    console.error('[auto-mask] error:', err?.message);
    res.status(500).json({ error: err?.message || 'Auto mask generation failed.' });
  }
});

// POST /api/quick-render
type TextureStyleKey = 'horizontal-lap' | 'dutch-lap' | 'board-batten' | 'shake';
interface QuickZoneData { name: string; lineName: string; colorName: string; colorHex: string; hue: string; style?: 'horizontal' | 'vertical'; textureStyle?: TextureStyleKey; }

const TEXTURE_PROFILE_DESCRIPTIONS: Record<TextureStyleKey, string> = {
  'horizontal-lap':  'traditional horizontal lap clapboard siding. Planks must run perfectly parallel to the ground with a slight physical overlap. Each course should have a subtle bottom drop-shadow to give a sense of depth, thickness, and realistic material overlap, strictly following the wall perspective lines.',
  'dutch-lap':       'Dutch lap (dutchlap) horizontal siding. Render each plank with a distinctive concave scoop/curve routed at the top edge. This scoop must create a strong, clean horizontal shadow line immediately beneath each course, casting a realistic drop shadow that highlights the material\'s architectural relief.',
  'board-batten':    'vertical board-and-batten siding. Render wide vertical planks running continuously from the foundation/base to the roofline/eave. Planks must be separated by narrow, raised battens that project outwards slightly. The battens must cast subtle, crisp vertical shadows matching the main sunlight direction, giving a 3D textured appearance rather than a flat striped pattern.',
  'shake':           'staggered cedar shingle (shake) siding. Render overlapping rows of rustic, individually-cut wooden shingles with varied widths. The shingles must have visible vertical seams and slightly uneven bottom edges, casting individual, staggered shadow lines below each course. Individual shingle units must show soft woodgrain texture with natural, realistic imperfections.',
};

app.post('/api/quick-render', generationLimiter, async (req, res) => {
  const { imageBase64, mimeType, zones } = req.body as { imageBase64: string; mimeType: string; zones: QuickZoneData[] };
  if (!imageBase64 || !zones?.length) return res.status(400).json({ error: 'Missing imageBase64 or zones.' });

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
      const profileDesc = z.textureStyle && TEXTURE_PROFILE_DESCRIPTIONS[z.textureStyle]
        ? ` [PROFILE: ${TEXTURE_PROFILE_DESCRIPTIONS[z.textureStyle]}]`
        : z.style === 'vertical'
          ? ` [VERTICAL STYLE: render as tall vertical boards running floor-to-eave, not horizontal laps]`
          : '';
      prompt += `• ${z.name}: ${z.lineName} "${z.colorName}" — ${z.hue} (hex ref: ${z.colorHex})${profileDesc}\n`;
    });
    prompt += `\nCRITICAL RULES:
1. PRESERVATION: You MUST strictly map the new siding to the existing house geometry. DO NOT alter the structural layout, camera perspective, or aspect ratio.
2. NEGATIVE CONSTRAINTS: DO NOT add, remove, or modify ${exclusions.join(', ')}. Leave them 100% untouched.
3. DECORATIVE BRICK & STONE PRESERVATION: You MUST strictly preserve all decorative stone, brick wainscoting, brick veneer, stone facades, stone columns, masonry accents, and chimneys. DO NOT lay siding over these decorative elements. Leave them 100% untouched. Only apply siding to areas that are currently siding (lap, board-and-batten, shake, panels) or plain stucco/plaster walls.
4. SCALE: The siding board width must accurately match the scale of the house in the photograph.${hasVerticalZones ? '\n5. VERTICAL SIDING: For zones marked [VERTICAL STYLE], render siding as distinct vertical boards (and narrow battens if Board & Batten style) running from top to bottom of each wall section. Do NOT render horizontal laps on these zones.' : ''}
5. TEXTURAL INTEGRITY: The siding textures must have high resolution and clear tactile detail. Ensure each seam, lap, shingle, or batten has realistic micro-shadows that react naturally to the ambient light, preventing the texture from appearing flat or painted-on.
6. LIGHTING: Keep the exact same sunlight, shadows, and lighting direction as the original photo.
7. PHOTOREALISM: The result must be pristine and professional. No AI artifacts, melting edges, or blurriness.`;

    const response = await withTimeout(getAI().models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: { parts: [{ inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } }, { text: prompt }] },
    }), 90_000, 'quick-render');

    let resultImage: string | null = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) { resultImage = `data:image/png;base64,${part.inlineData.data}`; break; }
    }
    if (!resultImage) return res.status(500).json({ error: 'AI model did not return an image. Please try again.' });
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
});

// POST /api/generate
interface SectionData {
  id: string;
  name: string;
  maskData: string | null;
  selectedLine: { tier: string; line: string; material: string };
  selectedColor: { name: string; hex: string; hue: string };
  maskTarget: string;
}

app.post('/api/generate', generationLimiter, async (req, res) => {
  const { imageBase64, sections, lightingCondition, isHighQuality, imageSize, mimeType: srcMimeType } = req.body as {
    imageBase64: string;
    sections: SectionData[];
    lightingCondition: string;
    isHighQuality: boolean;
    imageSize: string;
    mimeType?: string;
  };
  if (!imageBase64 || !sections?.length) {
    return res.status(400).json({ error: 'Missing required fields: imageBase64, sections.' });
  }
  try {
    validateImagePayload(imageBase64, srcMimeType);
    const parts: any[] = [{ inlineData: { data: imageBase64, mimeType: srcMimeType || 'image/jpeg' } }];
    let promptText = `You are an expert architectural visualizer. Modify this house image according to the following section specifications:`;

    sections.forEach((section, index) => {
      if (section.maskData) {
        const maskBase64 = section.maskData.includes(',') ? section.maskData.split(',')[1] : section.maskData;
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
4. LIGHTING INTEGRITY: Apply a ${lightingCondition.toLowerCase()} lighting condition to the siding, but respect the original shadow map of the house.
5. SCALE: Ensure the siding laps/boards are correctly scaled relative to the distance of the house.
6. PHOTOREALISM: The applied siding must look like a high-end architectural photo, avoiding any blurry "AI generation" artifacts.`;

    parts.push({ text: promptText });

    const response = await withTimeout(getAI().models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: { parts },
    }), 120_000, 'generate');

    let resultImage: string | null = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) { resultImage = `data:image/png;base64,${part.inlineData.data}`; break; }
    }
    if (!resultImage) return res.status(500).json({ error: 'Failed to generate the visualized image. Please try again.' });
    res.json({ resultImage });
  } catch (err: any) {
    console.error('[generate] error:', err?.message);
    let errorMessage = 'Something went wrong while processing the image. Please try again.';
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('quota')) errorMessage = 'API quota exceeded. Please try again later.';
    else if (msg.includes('not found')) errorMessage = 'AI model not found. Please verify the model name configuration.';
    else if (msg.includes('safety')) errorMessage = 'The image was flagged by safety filters. Please try another image.';
    else if (err?.message) errorMessage = `Generation failed: ${err.message}`;
    res.status(500).json({ error: errorMessage });
  }
});

// POST /api/detect-sections
app.post('/api/detect-sections', async (req, res) => {
  const { imageBase64, mimeType } = req.body as { imageBase64: string; mimeType: string };
  if (!imageBase64) return res.status(400).json({ error: 'Missing required field: imageBase64.' });
  try {
    const response = await withTimeout(getAI().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } },
          {
            text: `You are an expert architectural analyst specializing in residential exterior design. Analyze this house photograph and identify every DISTINCT exterior zone that a homeowner might want to apply a DIFFERENT siding color or material to.

SECTION IDENTIFICATION RULES:
- Identify ALL colorable SIDING exterior zones:
  * SIDING surfaces: horizontal lap siding, vertical board siding, vinyl panels, fiber cement, wood clapboard, composite siding, AND any brick, stone, masonry, or stucco walls that represent the primary wall cladding (common renovation targets). DO NOT include decorative brick/stone accents, stone wainscoting, stone facades, or stone columns.
  * GARAGE DOOR: if present and colorable, include as its own zone.
- OPTIONAL ACCENT ZONES (return separately in "optionalSections"):
  * TRIM & ACCENTS: trim boards, corner boards, window trim, door trim, frieze boards — group all matching trim as one zone.
  * SHUTTERS: decorative or functional shutters — group all matching shutters on the house as one unified zone.
- NEVER include: roof shingles/tiles, skylights, window glass panes, door glass, front door, entry door, side doors, gutters and downspouts, soffit, fascia, chimneys, foundation/concrete base, driveway, landscaping, sky, people, vehicles, or decorative stone/brick accents (wainscoting, columns, stone facades, entryway surrounds).
- Each zone must be architecturally DISTINCT: on a different plane, separated by a physical break, or clearly a different element type.
- Return ALL distinct zones you identify — there is no maximum. If one continuous siding surface exists, return only 1.
- Order sections by prominence (largest/most visible siding first).

SECTION NAMING - use ONLY these canonical names:
  Main Body, Upper Gable, Lower Gable, Dormer, Garage Bay, Porch Surround, Second Story, First Story, Side Wing, Accent Band, Garage Door
  (For optional accents: Shutters, Trim, Corner Boards)
  (If none fit, use a concise 2-3 word descriptive name.)

For each maskTarget: describe the zone's exact location and boundaries, referencing neighboring elements as exclusion anchors (e.g. "all decorative shutters flanking windows on the main facade" or "trim boards along window and door frames, excluding window glass and siding").

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
    }), 30_000, 'detect-sections');

    const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed: any;
    try {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON object found");
      parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    } catch {
      console.error('[detect-sections] JSON parse error. Raw:', rawText.slice(0, 300));
      return res.status(500).json({ error: 'AI returned an invalid format. Please try a clearer image.' });
    }

    if (parsed.isResidentialHouse === false) {
      return res.status(400).json({ error: 'PREFLIGHT_FAILURE: The uploaded image does not appear to be a residential house or building suitable for siding. Please upload a clear exterior photo.' });
    }

    const EXCLUDED_NAMES = ['front door', 'entry door', 'side door', 'door'];
    const OPTIONAL_NAMES = ['shutters', 'trim', 'corner boards'];

    parsed.sections = (parsed.sections || []).filter(
      (s: any) => !EXCLUDED_NAMES.some(ex => s.name.toLowerCase().includes(ex))
    );

    const primarySections = parsed.sections.filter(
      (s: any) => !OPTIONAL_NAMES.some(opt => s.name.toLowerCase().includes(opt))
    );
    const accentFromSections = parsed.sections.filter(
      (s: any) => OPTIONAL_NAMES.some(opt => s.name.toLowerCase().includes(opt))
    );

    const rawOptional = parsed.optionalSections || [];
    const filteredOptional = rawOptional.filter(
      (s: any) => !EXCLUDED_NAMES.some(ex => s.name.toLowerCase().includes(ex))
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
});

interface DesignSpec {
  mode: string;
  primaryLine?: string;
  primaryColor?: string;
  primaryHex?: string;
  shutters?: string | null;
  trim?: string | null;
  sections?: { name: string; line: string; color: string; hex: string }[];
  siding?: { zone: string; line: string; color: string; hex: string }[];
}

function generatePDFBuffer(spec: DesignSpec, form: any, visualizationImage?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#0F172A';
      const accentColor = '#3B82F6';
      const lightBg = '#F8FAFC';
      const darkBorder = '#E2E8F0';

      // Header Banner
      doc.rect(0, 0, 595.28, 80).fill(primaryColor);
      doc.fillColor('#FFFFFF')
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('BLUEPRINTENVISION', 40, 20, { characterSpacing: 1.5 });
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#94A3B8')
         .text('Premium Exterior Design Specification', 40, 48);

      const dateStr = new Date().toLocaleDateString('en-US', { dateStyle: 'long' });
      doc.fontSize(9)
         .font('Helvetica-Oblique')
         .fillColor('#FFFFFF')
         .text(dateStr, 480, 35, { align: 'right' });

      doc.y = 110;

      // Section: Customer Details
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor(primaryColor)
         .text('CUSTOMER & PROPERTY DETAILS', 40, doc.y);

      doc.strokeColor(accentColor).lineWidth(1.5).moveTo(40, doc.y + 14).lineTo(555, doc.y + 14).stroke();

      doc.y += 24;
      const startCol1 = 40;
      const startCol2 = 300;
      const textRowHeight = 16;

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#475569');
      doc.text('Name:', startCol1, doc.y).font('Helvetica').fillColor('#0F172A').text(form.name, startCol1 + 50, doc.y);
      doc.font('Helvetica-Bold').fillColor('#475569').text('Address:', startCol2, doc.y).font('Helvetica').fillColor('#0F172A').text(form.address, startCol2 + 60, doc.y);

      doc.y += textRowHeight;
      doc.font('Helvetica-Bold').fillColor('#475569').text('Email:', startCol1, doc.y).font('Helvetica').fillColor('#0F172A').text(form.email, startCol1 + 50, doc.y);
      doc.font('Helvetica-Bold').fillColor('#475569').text('Zip Code:', startCol2, doc.y).font('Helvetica').fillColor('#0F172A').text(form.zipCode, startCol2 + 60, doc.y);

      doc.y += textRowHeight;
      doc.font('Helvetica-Bold').fillColor('#475569').text('Phone:', startCol1, doc.y).font('Helvetica').fillColor('#0F172A').text(form.phone, startCol1 + 50, doc.y);
      doc.font('Helvetica-Bold').fillColor('#475569').text('Timeline:', startCol2, doc.y).font('Helvetica').fillColor('#0F172A').text(form.projectTimeline, startCol2 + 60, doc.y);

      doc.y += 30;

      // Section: Design Specifications
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor(primaryColor)
         .text('SELECTED PRODUCT SPECIFICATIONS', 40, doc.y);
      doc.strokeColor(accentColor).lineWidth(1.5).moveTo(40, doc.y + 14).lineTo(555, doc.y + 14).stroke();

      doc.y += 24;

      // Table Header
      doc.rect(40, doc.y, 515, 20).fill('#E2E8F0');
      doc.fillColor('#334155').font('Helvetica-Bold').fontSize(9);
      doc.text('ZONE / ELEMENT', 50, doc.y + 6);
      doc.text('PRODUCT / MATERIAL', 180, doc.y + 6);
      doc.text('COLOR SPECIFICATION', 360, doc.y + 6);

      doc.y += 20;

      const items: { zone: string; product: string; color: string; hex: string }[] = [];

      if (spec.sections) {
        spec.sections.forEach(s => {
          items.push({ zone: s.name, product: s.line, color: s.color, hex: s.hex });
        });
      } else if (spec.primaryLine) {
        items.push({ zone: 'Primary Roof', product: spec.primaryLine, color: spec.primaryColor || '', hex: spec.primaryHex || '' });
      }

      if (spec.siding) {
        spec.siding.forEach(s => {
          items.push({ zone: s.zone, product: s.line, color: s.color, hex: s.hex });
        });
      }

      if (spec.shutters) {
        items.push({ zone: 'Shutters', product: 'Accent Shutter Panels', color: spec.shutters, hex: '' });
      }
      if (spec.trim) {
        items.push({ zone: 'Trim', product: 'Exterior Trim Boards', color: spec.trim, hex: '' });
      }

      let alternateRow = false;
      items.forEach(item => {
        if (alternateRow) {
          doc.rect(40, doc.y, 515, 22).fill(lightBg);
        }
        doc.fillColor('#0F172A').font('Helvetica').fontSize(9);
        
        doc.font('Helvetica-Bold').text(item.zone, 50, doc.y + 6);
        doc.font('Helvetica').text(item.product, 180, doc.y + 6, { width: 170, height: 16, ellipsis: true });
        
        if (item.hex) {
          doc.save();
          doc.fillColor(item.hex).lineWidth(1).strokeColor('#CCCCCC');
          doc.circle(368, doc.y + 10, 5).fillAndStroke();
          doc.restore();
          doc.fillColor('#0F172A').text(item.color, 380, doc.y + 6);
        } else {
          doc.fillColor('#0F172A').text(item.color, 360, doc.y + 6);
        }

        doc.y += 22;
        alternateRow = !alternateRow;
      });

      doc.strokeColor(darkBorder).lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();

      doc.y += 24;

      if (visualizationImage) {
        try {
          const rawBase64 = visualizationImage.includes(',') ? visualizationImage.split(',')[1] : visualizationImage;
          const imgBuffer = Buffer.from(rawBase64, 'base64');
          
          if (doc.y > 500) {
            doc.addPage();
            doc.y = 40;
          }

          doc.fontSize(12)
             .font('Helvetica-Bold')
             .fillColor(primaryColor)
             .text('DESIGN VISUALIZATION PREVIEW', 40, doc.y);
          doc.strokeColor(accentColor).lineWidth(1.5).moveTo(40, doc.y + 14).lineTo(555, doc.y + 14).stroke();
          
          doc.y += 24;
          doc.image(imgBuffer, 40, doc.y, { fit: [515, 230], align: 'center' });
        } catch (imgErr) {
          console.warn('Failed to embed visualization image in PDF Spec:', imgErr);
        }
      }

      const footerY = doc.page.height - 50;
      doc.strokeColor(darkBorder).lineWidth(1).moveTo(40, footerY - 10).lineTo(555, footerY - 10).stroke();
      doc.fontSize(7.5)
         .font('Helvetica-Oblique')
         .fillColor('#94A3B8')
         .text('Disclaimer: Colors shown on this digital specification sheet are approximations. Physical product samples must be used as the final reference for construction and installation.', 40, footerY, { width: 515, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

app.post('/api/quote-request', standardLimiter, async (req, res) => {
  const { name, email, phone, address, zipCode, contactTime, projectTimeline, referralSource, notes, designSpec, visualizationImage } =
    req.body as {
      name: string; email: string; phone: string; address: string; zipCode: string;
      contactTime: string; projectTimeline: string; referralSource: string; notes: string;
      designSpec: DesignSpec;
      visualizationImage?: string;
    };

  if (!name || !email || !phone || !address || !zipCode) {
    return res.status(422).json({ error: 'Please fill in all required fields.' });
  }

  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' });

  const buildDesignHtml = (spec: DesignSpec): string => {
    const list: { name: string; line: string; color: string; hex: string }[] = [];
    if (spec.sections) {
      spec.sections.forEach(s => list.push({ name: s.name, line: s.line, color: s.color, hex: s.hex }));
    } else if (spec.primaryLine) {
      list.push({ name: 'Primary Siding', line: spec.primaryLine, color: spec.primaryColor || '', hex: spec.primaryHex || '' });
    }
    if (spec.siding) {
      spec.siding.forEach(s => list.push({ name: s.zone, line: s.line, color: s.color, hex: s.hex }));
    }
    return list.map(s => `
      <tr><td style="padding:6px 0;color:#64748B;width:140px">${s.name}</td>
        <td><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${s.hex};vertical-align:middle;margin-right:6px"></span>
        <strong>${s.line}</strong> — ${s.color}</td></tr>
    `).join('');
  };

  const leadEmailHtml = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<div style="max-width:620px;margin:24px auto">
  <div style="background:#0F172A;padding:24px 28px;border-radius:12px 12px 0 0">
    <div style="color:#60A5FA;font-size:18px;font-weight:bold;letter-spacing:2px">BLUEPRINTENVISION</div>
    <div style="color:#94A3B8;font-size:13px;margin-top:4px">New Lead — BlueprintEnvision</div>
  </div>
  <div style="background:white;padding:28px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0">
    <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:14px;margin-bottom:22px">
      <strong style="color:#C2410C">🔔 New Quote Request</strong>
      <p style="margin:6px 0 0;color:#9A3412;font-size:14px">A homeowner completed a visualization and requested a free estimate.</p>
    </div>
    <h3 style="color:#1E293B;margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px">Contact Details</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:22px">
      <tr><td style="padding:6px 0;color:#64748B;width:140px">Name</td><td><strong>${name}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748B">Email</td><td><a href="mailto:${email}" style="color:#3B82F6">${email}</a></td></tr>
      <tr><td style="padding:6px 0;color:#64748B">Phone</td><td><a href="tel:${phone}" style="color:#3B82F6">${phone}</a></td></tr>
      <tr><td style="padding:6px 0;color:#64748B">Address</td><td>${address}, ${zipCode}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B">Best Time</td><td>${contactTime}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B">Timeline</td><td>${projectTimeline}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B">Found Us Via</td><td>${referralSource}</td></tr>
    </table>
    ${notes ? `<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:12px;margin-bottom:22px;font-size:14px;color:#334155;font-style:italic">&ldquo;${notes}&rdquo;</div>` : ''}
    <h3 style="color:#1E293B;margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px">Visualized Design — ${designSpec.mode}</h3>
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin-bottom:22px">
      <table style="width:100%;border-collapse:collapse">${buildDesignHtml(designSpec)}</table>
    </div>
    <a href="mailto:${email}?subject=Re%3A%20Your%20BlueprintEnvision%20Quote%20Request" style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">Reply to ${name} →</a>
    <div style="margin-top:22px;padding-top:18px;border-top:1px solid #E2E8F0"><p style="color:#475569;font-size:12px;margin:0 0 8px">📎 <strong>PDF design spec sheet attached</strong> — see details in the attached files.</p></div>
  </div>
  <div style="background:#0F172A;padding:14px 28px;border-radius:0 0 12px 12px;text-align:center;color:#475569;font-size:11px">
    <p style="margin:0">Submitted via BlueprintEnvision &nbsp;·&nbsp; ${timestamp}</p>
    <p style="margin:4px 0 0">https://blueprint-envision.web.app</p>
  </div>
</div>
</body></html>`;

  const confirmEmailHtml = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<div style="max-width:580px;margin:24px auto">
  <div style="background:#0F172A;padding:24px 28px;border-radius:12px 12px 0 0">
    <div style="color:#60A5FA;font-size:18px;font-weight:bold;letter-spacing:2px">BLUEPRINTENVISION</div>
    <div style="color:#94A3B8;font-size:13px;margin-top:4px">Powered by BlueprintEnvision</div>
  </div>
  <div style="background:white;padding:28px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0">
    <h2 style="color:#1E293B;margin:0 0 16px">Hi ${name}, we received your request! 👋</h2>
    <p style="color:#475569;line-height:1.6">Thank you for using BlueprintEnvision to design your home exterior. Your quote request has been received by the BlueprintEnvision team and one of our specialists will reach out within <strong>24 business hours</strong>.</p>
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin:20px 0">
      <h3 style="margin:0 0 10px;color:#1E293B;font-size:13px;text-transform:uppercase;letter-spacing:1px">Your Selected Design</h3>
      <table style="width:100%;border-collapse:collapse">${buildDesignHtml(designSpec)}</table>
    </div>
    <p style="color:#64748B;font-size:13px">We have attached your customized <strong>Design Spec Sheet</strong> PDF to this email for your records.</p>
    <p style="color:#64748B;font-size:13px">Questions? You can reach us directly at <a href="mailto:drewhufnagle@gmail.com" style="color:#3B82F6">drewhufnagle@gmail.com</a></p>
  </div>
  <div style="background:#0F172A;padding:14px 28px;border-radius:0 0 12px 12px;text-align:center;color:#475569;font-size:11px">
    <p style="margin:0">BlueprintEnvision</p>
    <p style="margin:6px 0 0;font-size:10px;color:#64748B">Blueprint Ai Consulting Co. · Pennsylvania, USA</p>
    <p style="margin:4px 0 0;font-size:9px;color:#64748B">This is a one-time transactional email in response to your quote request. You will not receive marketing emails from this service.</p>
  </div>
</div>
</body></html>`;

  console.log(`[quote-request] New lead: ${name} <${email}> ${phone} — ${address} ${zipCode} — ${designSpec.mode} / ${designSpec.primaryLine || (designSpec.sections?.[0]?.line)} ${designSpec.primaryColor || (designSpec.sections?.[0]?.color)}`);
  res.json({ success: true });

  const transport = getGmailTransport();
  if (transport) {
    const FROM = `"BlueprintEnvision" <${process.env.GMAIL_USER}>`;
    const leadRecipients = process.env.LEAD_EMAIL
      ? process.env.LEAD_EMAIL.split(',')
      : ['drewhufnagle@gmail.com'];

    // Generate the spec PDF sheet
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await generatePDFBuffer(designSpec, req.body, visualizationImage);
    } catch (pdfErr: any) {
      console.error('[quote-request] PDF generation failed:', pdfErr?.message);
    }

    const attachments: { filename: string; content: Buffer }[] = [];
    
    if (pdfBuffer) {
      attachments.push({
        filename: `${name.replace(/\s+/g, '-')}-design-spec.pdf`,
        content: pdfBuffer,
      });
    }

    if (visualizationImage) {
      try {
        const rawBase64 = visualizationImage.includes(',') ? visualizationImage.split(',')[1] : visualizationImage;
        attachments.push({
          filename: `${name.replace(/\s+/g, '-')}-visualization.png`,
          content: Buffer.from(rawBase64, 'base64'),
        });
      } catch (e) {
        console.warn('[quote-request] Failed to parse visualization image for attachment');
      }
    }

    transport.sendMail({
      from: FROM,
      to: leadRecipients.join(', '),
      subject: `🏠 New Quote Request — ${name} — ${designSpec.primaryLine || designSpec.sections?.[0]?.line} ${designSpec.primaryColor || designSpec.sections?.[0]?.color}`,
      html: leadEmailHtml,
      attachments,
    }).then(() => console.log(`[quote-request] Lead email sent to ${leadRecipients.join(', ')} for ${email}`))
      .catch((err: any) => console.error('[quote-request] Lead email error:', err?.message));

    transport.sendMail({
      from: FROM,
      to: email,
      subject: `Your BlueprintEnvision Design Spec Sheet — We'll Be In Touch, ${name}!`,
      html: confirmEmailHtml,
      attachments,
    }).then(() => console.log(`[quote-request] Confirmation email sent to ${email}`))
      .catch((err: any) => console.error('[quote-request] Confirmation email error:', err?.message));
  }
});

// POST /api/enhance-image
app.post('/api/enhance-image', generationLimiter, async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg' } = req.body as { imageBase64: string; mimeType?: string };
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }
  try {
    validateImagePayload(imageBase64, mimeType);
    const response = await getAI().models.generateContent({
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
      if ((part as any).inlineData?.data) {
        enhancedBase64 = (part as any).inlineData.data;
        outMime = (part as any).inlineData.mimeType ?? 'image/png';
        break;
      }
    }
    if (!enhancedBase64) return res.status(500).json({ error: 'Gemini did not return an enhanced image. Try a different photo.' });
    res.json({ enhancedImageBase64: enhancedBase64, mimeType: outMime });
  } catch (err: any) {
    console.error('enhance-image error:', err?.message);
    res.status(500).json({ error: err?.message || 'Enhance image failed.' });
  }
});

// GET /api/ping
app.get('/api/ping', (_req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()), ts: new Date().toISOString() });
});

// POST /api/roof-detect-sections
app.post('/api/roof-detect-sections', generationLimiter, async (req, res) => {
  const { imageBase64, mimeType } = req.body as { imageBase64: string; mimeType: string };
  if (!imageBase64) return res.status(400).json({ error: 'Missing imageBase64.' });
  try {
    validateImagePayload(imageBase64, mimeType);
    const response = await withTimeout(getAI().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [
        { inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } },
        { text: `You are an expert roofing analyst. Analyze this house photograph and identify every DISTINCT roof plane or roofing zone that a homeowner might want to apply a DIFFERENT shingle color or material to.

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
}` },
      ] },
    }), 30_000, 'roof-detect-sections');

    const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

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
      return res.status(400).json({ error: 'PREFLIGHT_FAILURE: The uploaded image does not appear to contain a residential roof. Please upload a clear exterior photo showing the roof.' });
    }
    res.json({ sections: parsed.sections || [], optionalSections: parsed.optionalSections || [] });
  } catch (err: any) {
    console.error('[roof-detect-sections] error:', err?.message);
    res.status(500).json({ error: err?.message || 'Roof section detection failed.' });
  }
});

// POST /api/roof-quick-render
const ROOF_PRODUCT_DESCRIPTIONS: Record<string, string> = {
  'patriot': 'CertainTeed Patriot XL (builder-grade architectural strip shingles with oversized 42-inch tabs creating a distinct, clean 3D dimensional profile and crisp granule texture).',
  'landmark pro': 'CertainTeed Landmark Pro (premium heavyweight laminate shingles with maximum high-definition dimensional depth. The tab shadow lines must be extra-deep and pronounced, creating high-contrast architectural relief, using a vibrant, rich blend of contrasting granules to maximize wood-shake dimension).',
  'landmark': 'CertainTeed Landmark (classic dual-layer laminate architectural shingles displaying a heavy, random dimensional wood-shake profile with clear overlapping shadow lines between tabs and courses, with dense, realistic asphalt granules).',
  'metal': 'standing seam metal panels (continuous vertical metal panels with raised seams spaced evenly, displaying a subtle metallic sheen, soft directional light reflections, and crisp vertical seam shadows).',
};

app.post('/api/roof-quick-render', generationLimiter, async (req, res) => {
  const { imageBase64, mimeType, zones } = req.body as {
    imageBase64: string; mimeType: string;
    zones: { name: string; productName: string; colorName: string; colorHex: string; hue: string; materialType: string }[];
  };
  if (!imageBase64 || !zones?.length) return res.status(400).json({ error: 'Missing imageBase64 or zones.' });
  try {
    validateImagePayload(imageBase64, mimeType);
    let prompt = `You are a strict, precise roofing material-replacement engine. Replace ONLY the roof shingles and specified accent zones on this residential home.\n\nApply ONLY these changes:\n`;
    zones.forEach(z => {
      const prodKey = z.productName.toLowerCase();
      let prodDesc = '';
      if (prodKey.includes('patriot')) prodDesc = ROOF_PRODUCT_DESCRIPTIONS['patriot'];
      else if (prodKey.includes('landmark pro')) prodDesc = ROOF_PRODUCT_DESCRIPTIONS['landmark pro'];
      else if (prodKey.includes('landmark')) prodDesc = ROOF_PRODUCT_DESCRIPTIONS['landmark'];
      else if (prodKey.includes('metal') || prodKey.includes('standing seam')) prodDesc = ROOF_PRODUCT_DESCRIPTIONS['metal'];

      const detail = prodDesc ? ` [PRODUCT PROFILE: ${prodDesc}]` : '';
      prompt += `• ${z.name}: ${z.productName} "${z.colorName}" — ${z.hue} (hex ref: ${z.colorHex}) [${z.materialType}]${detail}\n`;
    });
    prompt += `\nCRITICAL RULES:
1. PRESERVATION: You MUST strictly map the new roofing materials to the existing roof geometry. DO NOT alter the roof pitch, ridge lines, hips, valleys, camera perspective, structural layout, or aspect ratio.
2. NEGATIVE CONSTRAINTS: DO NOT add, remove, or modify siding, windows, doors, trim, landscaping, sky, foundation, driveways. Leave them 100% untouched.
3. ROOF-ONLY: Apply shingle changes ONLY to visible roof surfaces. Gutter changes apply ONLY to gutter/fascia areas along eaves and rakes.
4. TEXTURAL INTEGRITY & GRANULES: Roof shingles must show high-resolution, tactile asphalt granule texture. Ensure there are visible, realistic shadow lines under each shingle course to give thickness and dimension, preventing the shingles from looking like a flat pattern or colored overlay.
5. LIGHTING: Keep the exact same sunlight direction, shadows, and lighting direction as the original photo.
6. PHOTOREALISM: The result must look like a premium architectural photograph. No AI artifacts, melting edges, or blurriness.`;

    const response = await withTimeout(getAI().models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: { parts: [{ inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } }, { text: prompt }] },
    }), 90_000, 'roof-quick-render');

    let resultImage: string | null = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) { resultImage = `data:image/png;base64,${part.inlineData.data}`; break; }
    }
    if (!resultImage) return res.status(500).json({ error: 'AI did not return an image. Please try again.' });
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
});

// POST /api/roof-generate
app.post('/api/roof-generate', generationLimiter, async (req, res) => {
  const { imageBase64, mimeType: srcMimeType, sections } = req.body as {
    imageBase64: string; mimeType?: string;
    sections: { id: string; name: string; maskTarget: string; maskData: string | null;
      selectedProduct: { tier: string; line: string; materialType: string };
      selectedColor: { name: string; hex: string; hue: string } }[];
  };
  if (!imageBase64 || !sections?.length) return res.status(400).json({ error: 'Missing imageBase64 or sections.' });
  try {
    validateImagePayload(imageBase64, srcMimeType);
    const parts: any[] = [{ inlineData: { data: imageBase64, mimeType: srcMimeType || 'image/jpeg' } }];
    let promptText = `You are an expert architectural roofing visualizer. Modify ONLY the roof in this house image according to these section specifications:`;
    sections.forEach((section, index) => {
      if (section.maskData) {
        const maskBase64 = section.maskData.includes(',') ? section.maskData.split(',')[1] : section.maskData;
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

    const response = await withTimeout(getAI().models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: { parts },
    }), 120_000, 'roof-generate');

    let resultImage: string | null = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) { resultImage = `data:image/png;base64,${part.inlineData.data}`; break; }
    }
    if (!resultImage) return res.status(500).json({ error: 'Failed to generate roofing visualization.' });
    res.json({ resultImage });
  } catch (err: any) {
    console.error('[roof-generate] error:', err?.message);
    let errorMessage = 'Roof generation failed. Please try again.';
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('quota')) errorMessage = 'API quota exceeded.';
    else if (msg.includes('safety')) errorMessage = 'Image flagged by safety filters.';
    else if (err?.message) errorMessage = `Generation failed: ${err.message}`;
    res.status(500).json({ error: errorMessage });
  }
});

// Export the cloud function endpoint mapping to our Express app
export const api = onRequest({
  cors: true,
  secrets: ['GEMINI_API_KEY'],
  timeoutSeconds: 120,
  memory: '1GiB'
}, app);
