import { SidingLine, RoofingLine, SidingColor, RoofingColor, QuickZone, QuickRoofZone } from '../types';

// RGBA overlay colors for advanced-mode section mask visualization
export const SECTION_COLORS: [number, number, number, number][] = [
  [59, 130, 246, 100],   // Blue
  [16, 185, 129, 100],   // Green
  [249, 115, 22, 100],   // Orange
  [139, 92, 246, 100],   // Purple
  [236, 72, 153, 100],   // Pink
  [234, 179, 8, 100],    // Yellow
  [6, 182, 212, 100],    // Cyan
  [239, 68, 68, 100],    // Red
];

// ===========================================================================
//  SIDING — 3 product lines (Lap, Board & Batten, Cedar Shake)
// ===========================================================================
export const SIDING_OPTIONS: SidingLine[] = [
  {
    tier: 'Lap',
    line: 'Lap Siding',
    material: 'Vinyl Lap Siding',
    profileLabel: 'Horizontal Lap — Traditional Profile',
    textureImage: '/textures/horizontal-lap.png',
    textureStyle: 'horizontal-lap',
    description: 'Classic horizontal clapboard — the most popular siding style.',
    colors: [
      { id: 'lap-snow',            name: 'Snow',            hex: '#F2F2F0', hue: 'Crisp near-white'       },
      { id: 'lap-colonial-white',  name: 'Colonial White',  hex: '#E8E6DF', hue: 'Warm off-white'         },
      { id: 'lap-heritage-cream',  name: 'Heritage Cream',  hex: '#EDE0BE', hue: 'Buttery cream'          },
      { id: 'lap-desert-tan',      name: 'Desert Tan',      hex: '#D8CBB5', hue: 'Sandy warm tan'         },
      { id: 'lap-sandstone-beige', name: 'Sandstone Beige', hex: '#D4C6A8', hue: 'Warm sandy beige'       },
      { id: 'lap-natural-clay',    name: 'Natural Clay',    hex: '#C8B89A', hue: 'Warm earthy clay'       },
      { id: 'lap-savannah-wicker', name: 'Savannah Wicker', hex: '#C4AE82', hue: 'Warm golden wicker'     },
      { id: 'lap-herringbone',     name: 'Herringbone',     hex: '#C9B98C', hue: 'Warm wheat sand'        },
      { id: 'lap-sterling-gray',   name: 'Sterling Gray',   hex: '#B8B6B0', hue: 'Light silver-gray'      },
      { id: 'lap-castle-stone',    name: 'Castle Stone',    hex: '#A09890', hue: 'Warm light gray-beige'  },
      { id: 'lap-weathered-wood',  name: 'Weathered Wood',  hex: '#9E8E78', hue: 'Aged driftwood gray'    },
      { id: 'lap-cypress',         name: 'Cypress',         hex: '#9A9E80', hue: 'Warm olive-gray'        },
      { id: 'lap-seagrass',        name: 'Seagrass',        hex: '#8A9878', hue: 'Sage green-gray'        },
      { id: 'lap-granite-gray',    name: 'Granite Gray',    hex: '#8C8B87', hue: 'Neutral medium gray'    },
      { id: 'lap-graystone',       name: 'Graystone',       hex: '#888480', hue: 'Warm medium gray'       },
      { id: 'lap-oxford-blue',     name: 'Oxford Blue',     hex: '#8FA0A8', hue: 'Dusty steel blue'       },
      { id: 'lap-wedgewood-blue',  name: 'Wedgewood Blue',  hex: '#6E8B9A', hue: 'Medium coastal blue'    },
      { id: 'lap-pacific-blue',    name: 'Pacific Blue',    hex: '#6A7D89', hue: 'Muted slate blue'       },
      { id: 'lap-flagstone',       name: 'Flagstone',       hex: '#756E66', hue: 'Warm slate gray'        },
      { id: 'lap-spruce',          name: 'Spruce',          hex: '#526058', hue: 'Dark spruce green'       },
      { id: 'lap-forest',          name: 'Forest',          hex: '#4A6741', hue: 'Rich deep green'        },
      { id: 'lap-charcoal-gray',   name: 'Charcoal Gray',   hex: '#4A4A4C', hue: 'Near-black dark gray'   },
      { id: 'lap-sable-brown',     name: 'Sable Brown',     hex: '#5A3E2E', hue: 'Dark warm brown'        },
      { id: 'lap-autumn-red',      name: 'Autumn Red',      hex: '#7A3530', hue: 'Deep brick red'         },
    ]
  },
  {
    tier: 'B&B',
    line: 'Board & Batten',
    material: 'Insulated Board & Batten Vinyl',
    profileLabel: 'Vertical Panel — Cedar Grain Texture',
    textureImage: '/textures/board-batten.png',
    textureStyle: 'board-batten',
    style: 'vertical',
    description: 'Vertical board & batten with insulated foam backing.',
    colors: [
      { id: 'bb-snow',            name: 'Snow',            hex: '#F2F2F0', hue: 'Crisp near-white'       },
      { id: 'bb-colonial-white',  name: 'Colonial White',  hex: '#E8E6DF', hue: 'Warm off-white'         },
      { id: 'bb-heritage-cream',  name: 'Heritage Cream',  hex: '#EDE0BE', hue: 'Buttery cream'          },
      { id: 'bb-herringbone',     name: 'Herringbone',     hex: '#C9B98C', hue: 'Warm wheat sand'        },
      { id: 'bb-natural-clay',    name: 'Natural Clay',    hex: '#C8B89A', hue: 'Warm earthy clay'       },
      { id: 'bb-savannah-wicker', name: 'Savannah Wicker', hex: '#C4AE82', hue: 'Warm golden wicker'     },
      { id: 'bb-sterling-gray',   name: 'Sterling Gray',   hex: '#B8B6B0', hue: 'Light silver-gray'      },
      { id: 'bb-granite-gray',    name: 'Granite Gray',    hex: '#8C8B87', hue: 'Neutral medium gray'    },
      { id: 'bb-weathered-wood',  name: 'Weathered Wood',  hex: '#9E8E78', hue: 'Aged driftwood gray'    },
      { id: 'bb-flagstone',       name: 'Flagstone',       hex: '#756E66', hue: 'Warm slate gray'        },
      { id: 'bb-charcoal-gray',   name: 'Charcoal Gray',   hex: '#4A4A4C', hue: 'Near-black dark gray'   },
      { id: 'bb-autumn-red',      name: 'Autumn Red',      hex: '#7A3530', hue: 'Deep brick red'         },
    ]
  },
  {
    tier: 'Shake',
    line: 'Cedar Shake',
    material: 'Polymer Shakes & Shingles',
    profileLabel: 'Staggered Shingle — Natural Cedar Look',
    textureImage: '/textures/cedar-shake.png',
    textureStyle: 'shake',
    description: 'Authentic cedar shingle look with natural texture.',
    colors: [
      { id: 'cs-colonial-white',  name: 'Colonial White',  hex: '#E8E6DF', hue: 'Warm off-white'         },
      { id: 'cs-heritage-cream',  name: 'Heritage Cream',  hex: '#EDE0BE', hue: 'Buttery cream'          },
      { id: 'cs-natural-clay',    name: 'Natural Clay',    hex: '#C8B89A', hue: 'Warm earthy clay'       },
      { id: 'cs-savannah-wicker', name: 'Savannah Wicker', hex: '#C4AE82', hue: 'Warm golden wicker'     },
      { id: 'cs-cedar-blend',     name: 'Cedar Blend',     hex: '#8A5C3A', hue: 'Reddish-brown cedar'    },
      { id: 'cs-weathered-wood',  name: 'Weathered Wood',  hex: '#9E8E78', hue: 'Aged driftwood gray'    },
      { id: 'cs-driftwood',       name: 'Driftwood',       hex: '#A2A09A', hue: 'Aged silvery gray'      },
      { id: 'cs-castle-stone',    name: 'Castle Stone',    hex: '#A09890', hue: 'Warm light gray-beige'  },
      { id: 'cs-sterling-gray',   name: 'Sterling Gray',   hex: '#B8B6B0', hue: 'Light silver-gray'      },
      { id: 'cs-granite-gray',    name: 'Granite Gray',    hex: '#8C8B87', hue: 'Neutral medium gray'    },
      { id: 'cs-slate',           name: 'Slate',           hex: '#697077', hue: 'Cool blue-gray'         },
      { id: 'cs-bermuda-blue',    name: 'Bermuda Blue',    hex: '#7A9BAF', hue: 'Soft caribbean blue'    },
      { id: 'cs-midnight-blue',   name: 'Midnight Blue',   hex: '#2C3D52', hue: 'Deep navy blue'         },
      { id: 'cs-seagrass',        name: 'Seagrass',        hex: '#8A9878', hue: 'Sage green-gray'        },
      { id: 'cs-espresso',        name: 'Espresso',        hex: '#3A2218', hue: 'Very dark espresso'     },
      { id: 'cs-charcoal-gray',   name: 'Charcoal Gray',   hex: '#4A4A4C', hue: 'Near-black dark gray'   },
      { id: 'cs-sable-brown',     name: 'Sable Brown',     hex: '#5A3E2E', hue: 'Dark warm brown'        },
      { id: 'cs-tuxedo',          name: 'Tuxedo',          hex: '#2E2E30', hue: 'Near-black charcoal'    },
    ]
  }
];

// Keep for backward compatibility
export const VERTICAL_SIDING_OPTIONS: SidingLine[] = [SIDING_OPTIONS[1]];

export const SHUTTER_COLORS: SidingColor[] = [
  { id: 'sh-jet-black',     name: 'Jet Black',      hex: '#1C1C1C', hue: 'Classic deep matte black'   },
  { id: 'sh-midnight-navy', name: 'Midnight Navy',  hex: '#1B2A4A', hue: 'Deep traditional navy blue' },
  { id: 'sh-forest-green',  name: 'Forest Green',   hex: '#2D4A2D', hue: 'Deep woodland green'        },
  { id: 'sh-colonial-red',  name: 'Colonial Red',   hex: '#7B2D2D', hue: 'Classic deep colonial red'  },
  { id: 'sh-burgundy',      name: 'Burgundy',       hex: '#5C1A2A', hue: 'Rich dark wine'             },
  { id: 'sh-pure-white',    name: 'Pure White',     hex: '#F5F5F0', hue: 'Crisp bright white'         },
  { id: 'sh-cream',         name: 'Cream',          hex: '#E8E0CC', hue: 'Warm off-white'             },
  { id: 'sh-slate-gray',    name: 'Slate Gray',     hex: '#6B7280', hue: 'Medium neutral gray'        },
  { id: 'sh-charcoal',      name: 'Charcoal',       hex: '#374151', hue: 'Dark warm gray'             },
  { id: 'sh-bronze',        name: 'Bronze',         hex: '#59422A', hue: 'Warm earthy bronze'         },
  { id: 'sh-hunter-green',  name: 'Hunter Green',   hex: '#1A3A2A', hue: 'Dark rich hunter green'     },
  { id: 'sh-espresso',      name: 'Espresso Brown', hex: '#3C2415', hue: 'Deep roasted dark brown'    },
];

export const TRIM_COLORS: SidingColor[] = [
  { id: 'tr-bright-white',  name: 'Bright White',  hex: '#F8F8F5', hue: 'Clean crisp white'    },
  { id: 'tr-antique-white', name: 'Antique White', hex: '#EDE8DC', hue: 'Warm classic white'   },
  { id: 'tr-cream',         name: 'Cream',         hex: '#E4DBCA', hue: 'Soft warm cream'      },
  { id: 'tr-linen',         name: 'Linen',         hex: '#D9CEBC', hue: 'Neutral beige-white'  },
  { id: 'tr-light-gray',    name: 'Light Gray',    hex: '#C8CBD0', hue: 'Subtle cool gray'     },
  { id: 'tr-silver-gray',   name: 'Silver Gray',   hex: '#A0A5AD', hue: 'Medium light gray'    },
  { id: 'tr-slate',         name: 'Slate',         hex: '#6B7685', hue: 'Blue-toned mid gray'  },
  { id: 'tr-charcoal',      name: 'Charcoal',      hex: '#3D4450', hue: 'Dark cool charcoal'   },
  { id: 'tr-black',         name: 'Matte Black',   hex: '#1C1E22', hue: 'Clean matte black'    },
  { id: 'tr-tan',           name: 'Tan',           hex: '#C4A97D', hue: 'Warm sandy tan'       },
  { id: 'tr-brown',         name: 'Warm Brown',    hex: '#7A5C3E', hue: 'Rich warm brown'      },
  { id: 'tr-navy',          name: 'Navy',          hex: '#1B2F4E', hue: 'Deep traditional navy'},
];

export const ALL_SIDING_OPTIONS = [...SIDING_OPTIONS];

// ===========================================================================
//  ROOFING — 3 product tiers (Standard, Designer, Metal)
// ===========================================================================
export const ROOFING_OPTIONS: RoofingLine[] = [
  {
    tier: 'Standard',
    line: 'Architectural Shingles',
    materialType: 'Architectural Shingles',
    profileLabel: 'Lifetime Laminate — Dimensional Profile',
    textureImage: '/textures/roof-architectural.png',
    textureStyle: 'architectural',
    description: 'Industry-standard dimensional shingle — 14 colors.',
    colors: [
      { id: 'std-charcoal',         name: 'Charcoal',         hex: '#3C3C3E', hue: 'Dark near-black charcoal'  },
      { id: 'std-weathered-wood',   name: 'Weathered Wood',   hex: '#9C8C72', hue: 'Aged cedar gray-brown'     },
      { id: 'std-pewter-gray',      name: 'Pewter Gray',      hex: '#888C90', hue: 'Cool pewter gray'          },
      { id: 'std-slate',            name: 'Slate',            hex: '#6B7279', hue: 'Cool blue-gray slate'      },
      { id: 'std-barkwood',         name: 'Barkwood',         hex: '#7C624A', hue: 'Medium warm bark brown'    },
      { id: 'std-shakewood',        name: 'Shakewood',        hex: '#8C7462', hue: 'Dark cedar weathered'      },
      { id: 'std-hickory',          name: 'Hickory',          hex: '#8E765A', hue: 'Warm hickory tan-brown'    },
      { id: 'std-mission-brown',    name: 'Mission Brown',    hex: '#5C4030', hue: 'Dark warm brown'           },
      { id: 'std-oyster-gray',      name: 'Oyster Gray',      hex: '#B2AEA6', hue: 'Warm light oyster gray'    },
      { id: 'std-fox-hollow-gray',  name: 'Fox Hollow Gray',  hex: '#7C828A', hue: 'Medium cool neutral gray'  },
      { id: 'std-colonial-slate',   name: 'Colonial Slate',   hex: '#707A82', hue: 'Cool colonial blue-slate'  },
      { id: 'std-coastal-blue',     name: 'Coastal Blue',     hex: '#5C6A7A', hue: 'Coastal muted blue'        },
      { id: 'std-heritage-red',     name: 'Heritage Red',     hex: '#7C3232', hue: 'Deep brick red'            },
      { id: 'std-hunter-green',     name: 'Hunter Green',     hex: '#3C5C3C', hue: 'Deep traditional green'    },
    ]
  },
  {
    tier: 'Designer',
    line: 'Designer Shingles',
    materialType: 'Designer Architectural Shingles',
    profileLabel: 'High-Definition — Maximum Dimension',
    textureImage: '/textures/roof-designer.png',
    textureStyle: 'designer',
    description: 'Premium high-contrast laminate with ultra-HD dimension — 8 colors.',
    colors: [
      { id: 'des-midnight-mesa',   name: 'Midnight Mesa',   hex: '#303032', hue: 'Deep midnight near-black'  },
      { id: 'des-charcoal',        name: 'Charcoal',        hex: '#3C3C3E', hue: 'Dark near-black charcoal'  },
      { id: 'des-chestnut-valley', name: 'Chestnut Valley', hex: '#70503A', hue: 'Rich chestnut warm brown'  },
      { id: 'des-barkwood',        name: 'Barkwood',        hex: '#7C624A', hue: 'Medium warm bark brown'    },
      { id: 'des-shakewood',       name: 'Shakewood',       hex: '#8C7462', hue: 'Dark cedar weathered'      },
      { id: 'des-weathered-wood',  name: 'Weathered Wood',  hex: '#9C8C72', hue: 'Aged cedar gray-brown'     },
      { id: 'des-cliffside',       name: 'Cliffside',       hex: '#8C8482', hue: 'Warm cliff-face gray'      },
      { id: 'des-sierra-sand',     name: 'Sierra Sand',     hex: '#C2AC8A', hue: 'Warm light sand'           },
    ]
  },
  {
    tier: 'Metal',
    line: 'Standing Seam Metal',
    materialType: 'Standing Seam Metal Roof',
    profileLabel: 'Vertical Panel — Concealed Fastener',
    textureImage: '/textures/roof-storm.png',
    textureStyle: 'metal',
    description: 'Premium standing seam metal roofing — 10 colors.',
    colors: [
      { id: 'mtl-matte-black',      name: 'Matte Black',      hex: '#1E1E20', hue: 'Deep matte black'        },
      { id: 'mtl-charcoal-gray',    name: 'Charcoal Gray',    hex: '#404244', hue: 'Dark cool charcoal'      },
      { id: 'mtl-slate-gray',       name: 'Slate Gray',       hex: '#6E7278', hue: 'Medium neutral slate'    },
      { id: 'mtl-silver',           name: 'Silver',           hex: '#B0B4B8', hue: 'Bright metallic silver'   },
      { id: 'mtl-galvalume',        name: 'Galvalume',        hex: '#C8CCD0', hue: 'Bright zinc-aluminum'     },
      { id: 'mtl-copper-penny',     name: 'Copper Penny',     hex: '#8A5A38', hue: 'Warm copper tone'         },
      { id: 'mtl-burnished-bronze', name: 'Burnished Bronze', hex: '#5C4228', hue: 'Dark warm bronze'         },
      { id: 'mtl-forest-green',     name: 'Forest Green',     hex: '#2E4A30', hue: 'Deep forest green'        },
      { id: 'mtl-barn-red',         name: 'Barn Red',         hex: '#7A2E2E', hue: 'Classic barn red'         },
      { id: 'mtl-colonial-blue',    name: 'Colonial Blue',    hex: '#384A5E', hue: 'Deep traditional blue'    },
    ]
  },
];

export const GUTTER_COLORS: RoofingColor[] = [
  { id: 'gu-aluminum-white', name: 'Aluminum White', hex: '#F0EFEC', hue: 'Standard bright white' },
  { id: 'gu-antique-ivory',  name: 'Antique Ivory',  hex: '#E8DECC', hue: 'Warm antique cream'    },
  { id: 'gu-brown',          name: 'Brown',           hex: '#5A3E28', hue: 'Standard medium brown' },
  { id: 'gu-Hartford-green', name: 'Hartford Green',  hex: '#3E5A40', hue: 'Deep traditional green'},
  { id: 'gu-musket-brown',   name: 'Musket Brown',    hex: '#4A3422', hue: 'Dark rustic brown'     },
  { id: 'gu-charcoal',       name: 'Charcoal',        hex: '#3A3A3C', hue: 'Dark cool charcoal'    },
  { id: 'gu-copper-patina',  name: 'Copper Patina',   hex: '#6E8878', hue: 'Verdigris patina green'},
  { id: 'gu-black',          name: 'Matte Black',     hex: '#1C1C1E', hue: 'Crisp matte black'     },
  { id: 'gu-earth-tone',     name: 'Earth Tone',      hex: '#8A7258', hue: 'Warm natural earth'    },
];

// ===========================================================================
//  DEFAULTS
// ===========================================================================
export const DEFAULT_QUICK_ROOF_ZONES: QuickRoofZone[] = [
  { id: 'rz-main', name: 'Roof', enabled: true, selectedLine: ROOFING_OPTIONS[0], selectedColor: ROOFING_OPTIONS[0].colors[0] },
];

export const DEFAULT_QUICK_ZONES: QuickZone[] = [
  { id: 'qz-main',     name: 'Main Body',   enabled: true,  selectedLine: SIDING_OPTIONS[0], selectedColor: SIDING_OPTIONS[0].colors[0] },
  { id: 'qz-gable',    name: 'Upper Gable', enabled: false, selectedLine: SIDING_OPTIONS[2], selectedColor: SIDING_OPTIONS[2].colors[0] },
  { id: 'qz-trim',     name: 'Trim',        enabled: false, selectedLine: SIDING_OPTIONS[0], selectedColor: TRIM_COLORS[0] },
  { id: 'qz-shutters', name: 'Shutters',    enabled: false, selectedLine: SIDING_OPTIONS[0], selectedColor: SHUTTER_COLORS[0] },
];
