/**
 * textures.ts
 * Generates CSS background styles for each material texture style.
 * Uses inline SVG patterns so no external image files are required.
 * The hex color is applied as the base background; the SVG adds the
 * structural surface detail on top via mix-blend-mode in the component.
 */

function svgUri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Returns a CSS backgroundImage for the texture overlay (neutral gray tones) */
export function getTextureOverlayCSS(style: string | undefined): string | undefined {
  switch (style) {

    // ── ROOFING ──────────────────────────────────────────────────────────────

    case 'architectural': {
      // Dimensional asphalt shingles — staggered rectangular tabs with shadow lines
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="32">
        <rect width="80" height="32" fill="#b0b0b0"/>
        <!-- row shadow lines -->
        <rect x="0" y="11" width="80" height="3" fill="#6a6a6a" opacity="0.55"/>
        <rect x="0" y="25" width="80" height="3" fill="#6a6a6a" opacity="0.55"/>
        <!-- tab breaks row 1 -->
        <rect x="19" y="0" width="2" height="11" fill="#555" opacity="0.4"/>
        <rect x="51" y="0" width="2" height="11" fill="#555" opacity="0.4"/>
        <!-- tab breaks row 2 -->
        <rect x="5"  y="14" width="2" height="11" fill="#555" opacity="0.4"/>
        <rect x="35" y="14" width="2" height="11" fill="#555" opacity="0.4"/>
        <rect x="65" y="14" width="2" height="11" fill="#555" opacity="0.4"/>
        <!-- granule noise -->
        <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="noise"/><feColorMatrix type="saturate" values="0"/><feBlend in="SourceGraphic" in2="noise" mode="multiply"/></filter>
        <rect width="80" height="32" filter="url(#n)" opacity="0.12"/>
      </svg>`;
      return svgUri(svg);
    }

    case 'designer': {
      // HD designer shingles — deeper shadow, more irregular tab widths
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="36">
        <rect width="96" height="36" fill="#a8a8a8"/>
        <rect x="0" y="13" width="96" height="4" fill="#505050" opacity="0.65"/>
        <rect x="0" y="29" width="96" height="4" fill="#505050" opacity="0.65"/>
        <!-- row 1 tab breaks — irregular widths -->
        <rect x="22" y="0" width="3" height="13" fill="#444" opacity="0.45"/>
        <rect x="58" y="0" width="2" height="13" fill="#444" opacity="0.45"/>
        <!-- row 2 -->
        <rect x="10" y="17" width="2" height="12" fill="#444" opacity="0.45"/>
        <rect x="44" y="17" width="3" height="12" fill="#444" opacity="0.45"/>
        <rect x="76" y="17" width="2" height="12" fill="#444" opacity="0.45"/>
        <!-- highlight lip -->
        <rect x="0" y="11" width="96" height="1.5" fill="#fff" opacity="0.18"/>
        <rect x="0" y="27" width="96" height="1.5" fill="#fff" opacity="0.18"/>
        <filter id="n2"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" result="noise"/><feColorMatrix type="saturate" values="0"/><feBlend in="SourceGraphic" in2="noise" mode="multiply"/></filter>
        <rect width="96" height="36" filter="url(#n2)" opacity="0.15"/>
      </svg>`;
      return svgUri(svg);
    }

    case 'metal': {
      // Standing seam — clean vertical ribs
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="64">
        <rect width="48" height="64" fill="#c0c4c8"/>
        <!-- panels -->
        <rect x="0"  y="0" width="22" height="64" fill="#d0d4d8"/>
        <rect x="26" y="0" width="22" height="64" fill="#d0d4d8"/>
        <!-- seam ridges -->
        <rect x="22" y="0" width="4" height="64" fill="#707478"/>
        <!-- highlight on ridge -->
        <rect x="22" y="0" width="1" height="64" fill="#fff" opacity="0.3"/>
        <rect x="25" y="0" width="1" height="64" fill="#fff" opacity="0.15"/>
        <!-- subtle panel sheen gradient -->
        <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0"   stop-color="#fff" stop-opacity="0.12"/>
          <stop offset="0.5" stop-color="#fff" stop-opacity="0.0"/>
          <stop offset="1"   stop-color="#000" stop-opacity="0.08"/>
        </linearGradient>
        <rect width="48" height="64" fill="url(#sheen)"/>
      </svg>`;
      return svgUri(svg);
    }

    // ── SIDING ───────────────────────────────────────────────────────────────

    case 'horizontal-lap': {
      // Vinyl lap siding — horizontal boards with woodgrain texture + shadow lines
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40">
        <rect width="80" height="40" fill="#d0d0d0"/>
        <!-- board faces -->
        <rect x="0" y="0"  width="80" height="18" fill="#d8d8d6"/>
        <rect x="0" y="20" width="80" height="18" fill="#d8d8d6"/>
        <!-- shadow under each course -->
        <rect x="0" y="16" width="80" height="4" fill="#404040" opacity="0.45"/>
        <rect x="0" y="36" width="80" height="4" fill="#404040" opacity="0.45"/>
        <!-- highlight lip at top of each board -->
        <rect x="0" y="0"  width="80" height="1.5" fill="#fff" opacity="0.35"/>
        <rect x="0" y="20" width="80" height="1.5" fill="#fff" opacity="0.35"/>
        <!-- wood grain lines -->
        <line x1="0" y1="6"  x2="80" y2="5"  stroke="#b8b8b4" stroke-width="0.7" opacity="0.5"/>
        <line x1="0" y1="10" x2="80" y2="11" stroke="#b8b8b4" stroke-width="0.5" opacity="0.4"/>
        <line x1="0" y1="27" x2="80" y2="26" stroke="#b8b8b4" stroke-width="0.7" opacity="0.5"/>
        <line x1="0" y1="31" x2="80" y2="32" stroke="#b8b8b4" stroke-width="0.5" opacity="0.4"/>
      </svg>`;
      return svgUri(svg);
    }

    case 'board-batten': {
      // Vertical board & batten — wide planks + narrow raised battens
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="64">
        <rect width="48" height="64" fill="#ccccca"/>
        <!-- board panels -->
        <rect x="0"  y="0" width="20" height="64" fill="#d4d4d2"/>
        <rect x="28" y="0" width="20" height="64" fill="#d4d4d2"/>
        <!-- shadow on right side of each board -->
        <rect x="20" y="0" width="2"  height="64" fill="#404040" opacity="0.3"/>
        <rect x="46" y="0" width="2"  height="64" fill="#404040" opacity="0.3"/>
        <!-- raised batten -->
        <rect x="20" y="0" width="8" height="64" fill="#c8c8c6"/>
        <rect x="20" y="0" width="1.5" height="64" fill="#fff" opacity="0.25"/>
        <rect x="27" y="0" width="1"   height="64" fill="#000" opacity="0.15"/>
        <!-- vertical grain lines on boards -->
        <line x1="7"  y1="0" x2="7"  y2="64" stroke="#b8b8b6" stroke-width="0.6" opacity="0.5"/>
        <line x1="13" y1="0" x2="13" y2="64" stroke="#b8b8b6" stroke-width="0.4" opacity="0.35"/>
        <line x1="35" y1="0" x2="35" y2="64" stroke="#b8b8b6" stroke-width="0.6" opacity="0.5"/>
        <line x1="41" y1="0" x2="41" y2="64" stroke="#b8b8b6" stroke-width="0.4" opacity="0.35"/>
      </svg>`;
      return svgUri(svg);
    }

    case 'shake': {
      // Cedar shakes — staggered rough shingles
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48">
        <rect width="64" height="48" fill="#b8b4ae"/>
        <!-- row 1 shingles (offset) -->
        <rect x="0"  y="0" width="19" height="20" rx="1" fill="#c0bcb6"/>
        <rect x="21" y="0" width="21" height="20" rx="1" fill="#bab6b0"/>
        <rect x="44" y="0" width="20" height="20" rx="1" fill="#c2beb8"/>
        <!-- row 2 shingles (offset by half) -->
        <rect x="-5" y="22" width="17" height="20" rx="1" fill="#bab6b0"/>
        <rect x="14" y="22" width="20" height="20" rx="1" fill="#c0bcb6"/>
        <rect x="36" y="22" width="18" height="20" rx="1" fill="#b8b4ae"/>
        <rect x="56" y="22" width="12" height="20" rx="1" fill="#bcb8b2"/>
        <!-- shadow at bottom of each row -->
        <rect x="0" y="19" width="64" height="3" fill="#555" opacity="0.45"/>
        <rect x="0" y="41" width="64" height="3" fill="#555" opacity="0.45"/>
        <!-- grain lines on shingles -->
        <line x1="7"  y1="0" x2="6"  y2="20" stroke="#888" stroke-width="0.5" opacity="0.4"/>
        <line x1="14" y1="0" x2="14" y2="20" stroke="#888" stroke-width="0.5" opacity="0.35"/>
        <line x1="30" y1="0" x2="31" y2="20" stroke="#888" stroke-width="0.5" opacity="0.4"/>
        <line x1="55" y1="0" x2="56" y2="20" stroke="#888" stroke-width="0.5" opacity="0.4"/>
      </svg>`;
      return svgUri(svg);
    }

    default:
      return undefined;
  }
}
