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
//  SIDING — 3 product lines (Lap, Vertical Panel, Rustic Shingle)
// ===========================================================================
export const SIDING_OPTIONS: SidingLine[] = [
  {
    tier: 'Good',
    line: 'MainStreet™',
    material: 'Vinyl Siding',
    profileLabel: 'D5" Colonial / D5" Dutchlap / Beaded',
    textureImage: '/textures/horizontal-lap.png',
    textureStyle: 'horizontal-lap',
    description: 'Consistent quality and good looks for everyday homes.',
    colors: [
      { id: 'ms-autumn-red',      name: 'Autumn Red',      hex: '#7A3530', hue: 'Deep brick red'         },
      { id: 'ms-autumn-yellow',   name: 'Autumn Yellow',   hex: '#D6B96A', hue: 'Warm harvest yellow'    },
      { id: 'ms-castle-stone',    name: 'Castle Stone',    hex: '#A09890', hue: 'Warm light gray-beige'  },
      { id: 'ms-charcoal-gray',   name: 'Charcoal Gray',   hex: '#4A4A4C', hue: 'Near-black dark gray'   },
      { id: 'ms-colonial-white',  name: 'Colonial White',  hex: '#E8E6DF', hue: 'Warm off-white'         },
      { id: 'ms-cypress',         name: 'Cypress',         hex: '#9A9E80', hue: 'Warm olive-gray'         },
      { id: 'ms-desert-tan',      name: 'Desert Tan',      hex: '#D8CBB5', hue: 'Sandy warm tan'         },
      { id: 'ms-flagstone',       name: 'Flagstone',       hex: '#756E66', hue: 'Warm slate gray'         },
      { id: 'ms-forest',          name: 'Forest',          hex: '#4A6741', hue: 'Rich deep green'         },
      { id: 'ms-granite-gray',    name: 'Granite Gray',    hex: '#8C8B87', hue: 'Neutral medium gray'    },
      { id: 'ms-graystone',       name: 'Graystone',       hex: '#888480', hue: 'Warm medium gray'       },
      { id: 'ms-heritage-cream',  name: 'Heritage Cream',  hex: '#EDE0BE', hue: 'Buttery cream'          },
      { id: 'ms-herringbone',     name: 'Herringbone',     hex: '#C9B98C', hue: 'Warm wheat sand'        },
      { id: 'ms-natural-clay',    name: 'Natural Clay',    hex: '#C8B89A', hue: 'Warm earthy clay'       },
      { id: 'ms-oxford-blue',     name: 'Oxford Blue',     hex: '#8FA0A8', hue: 'Dusty steel blue'       },
      { id: 'ms-pacific-blue',    name: 'Pacific Blue',    hex: '#6A7D89', hue: 'Muted slate blue'       },
      { id: 'ms-sable-brown',     name: 'Sable Brown',     hex: '#5A3E2E', hue: 'Dark warm brown'        },
      { id: 'ms-sandstone-beige', name: 'Sandstone Beige', hex: '#D4C6A8', hue: 'Warm sandy beige'      },
      { id: 'ms-savannah-wicker', name: 'Savannah Wicker', hex: '#C4AE82', hue: 'Warm golden wicker'     },
      { id: 'ms-seagrass',        name: 'Seagrass',        hex: '#8A9878', hue: 'Sage green-gray'        },
      { id: 'ms-snow',            name: 'Snow',            hex: '#F2F2F0', hue: 'Crisp near-white'       },
      { id: 'ms-spruce',          name: 'Spruce',          hex: '#526058', hue: 'Dark spruce green'      },
      { id: 'ms-sterling-gray',   name: 'Sterling Gray',   hex: '#B8B6B0', hue: 'Light silver-gray'      },
      { id: 'ms-weathered-wood',  name: 'Weathered Wood',  hex: '#9E8E78', hue: 'Aged driftwood gray'   },
      { id: 'ms-wedgewood-blue',  name: 'Wedgewood Blue',  hex: '#6E8B9A', hue: 'Medium coastal blue'   }
    ]
  },
  {
    tier: 'Better',
    line: 'Monogram®',
    material: 'Premium Vinyl Siding',
    profileLabel: 'D5" Colonial / D5" Dutchlap / S7"',
    textureImage: '/textures/dutch-lap.png',
    textureStyle: 'dutch-lap',
    description: 'Premium woodgrain texture with industry-leading 38-color palette.',
    colors: [
      { id: 'mo-arbor-blend',      name: 'Arbor Blend',      hex: '#9FA882', hue: 'Green-gray natural mix'  },
      { id: 'mo-autumn-red',       name: 'Autumn Red',       hex: '#7A3530', hue: 'Deep brick red'          },
      { id: 'mo-brownstone',       name: 'Brownstone',       hex: '#6E5A46', hue: 'Medium warm brown'       },
      { id: 'mo-castle-stone',     name: 'Castle Stone',     hex: '#A09890', hue: 'Warm light gray-beige'   },
      { id: 'mo-cedar-blend',      name: 'Cedar Blend',      hex: '#8A5C3A', hue: 'Reddish-brown cedar'     },
      { id: 'mo-charcoal-gray',    name: 'Charcoal Gray',    hex: '#4A4A4C', hue: 'Near-black dark gray'    },
      { id: 'mo-colonial-white',   name: 'Colonial White',   hex: '#E8E6DF', hue: 'Warm off-white'          },
      { id: 'mo-cypress',          name: 'Cypress',          hex: '#9A9E80', hue: 'Warm olive-gray'          },
      { id: 'mo-deep-mineral',     name: 'Deep Mineral',     hex: '#445A6E', hue: 'Deep teal-steel blue'    },
      { id: 'mo-desert-tan',       name: 'Desert Tan',       hex: '#D8CBB5', hue: 'Sandy warm tan'          },
      { id: 'mo-driftwood-blend',  name: 'Driftwood Blend',  hex: '#A2A09A', hue: 'Aged cedar silvery gray' },
      { id: 'mo-espresso',         name: 'Espresso',         hex: '#3A2218', hue: 'Very dark espresso'      },
      { id: 'mo-flagstone',        name: 'Flagstone',        hex: '#756E66', hue: 'Warm slate gray'          },
      { id: 'mo-forest',           name: 'Forest',           hex: '#4A6741', hue: 'Rich deep green'          },
      { id: 'mo-frontier-blend',   name: 'Frontier Blend',   hex: '#B09880', hue: 'Warm mixed sandy-brown'  },
      { id: 'mo-granite-gray',     name: 'Granite Gray',     hex: '#8C8B87', hue: 'Neutral medium gray'     },
      { id: 'mo-graystone',        name: 'Graystone',       hex: '#888480', hue: 'Warm medium gray'        },
      { id: 'mo-heritage-cream',   name: 'Heritage Cream',   hex: '#EDE0BE', hue: 'Buttery cream'           },
      { id: 'mo-herringbone',      name: 'Herringbone',     hex: '#C9B98C', hue: 'Warm wheat sand'         },
      { id: 'mo-melrose',          name: 'Melrose',          hex: '#8F95A4', hue: 'Dusty periwinkle gray'   },
      { id: 'mo-midnight-blue',    name: 'Midnight Blue',    hex: '#2C3D52', hue: 'Deep navy blue'          },
      { id: 'mo-natural-blend',    name: 'Natural Blend',    hex: '#CDB89A', hue: 'Fresh cedar light tan'   },
      { id: 'mo-natural-clay',     name: 'Natural Clay',     hex: '#C8B89A', hue: 'Warm earthy clay'        },
      { id: 'mo-olive-grove',      name: 'Olive Grove',      hex: '#6B7051', hue: 'Warm olive green'        },
      { id: 'mo-oxford-blue',      name: 'Oxford Blue',     hex: '#8FA0A8', hue: 'Dusty steel blue'        },
      { id: 'mo-pacific-blue',     name: 'Pacific Blue',     hex: '#6A7D89', hue: 'Muted slate blue'        },
      { id: 'mo-rustic-blend',     name: 'Rustic Blend',     hex: '#8A7268', hue: 'Seasoned cedar brown-gray'},
      { id: 'mo-sable-brown',      name: 'Sable Brown',     hex: '#5A3E2E', hue: 'Dark warm brown'         },
      { id: 'mo-sandstone-beige',  name: 'Sandstone Beige',  hex: '#D4C6A8', hue: 'Warm sandy beige'       },
      { id: 'mo-savannah-wicker',  name: 'Savannah Wicker',  hex: '#C4AE82', hue: 'Warm golden wicker'      },
      { id: 'mo-seagrass',         name: 'Seagrass',         hex: '#8A9878', hue: 'Sage green-gray'         },
      { id: 'mo-slate',            name: 'Slate',            hex: '#697077', hue: 'Cool blue-gray'          },
      { id: 'mo-smoky-gray',       name: 'Smoky Gray',       hex: '#6B6D6F', hue: 'Medium cool gray'        },
      { id: 'mo-sparrow',          name: 'Sparrow',          hex: '#8A8E98', hue: 'Cool gray-blue'          },
      { id: 'mo-spruce',           name: 'Spruce',           hex: '#526058', hue: 'Dark spruce green'       },
      { id: 'mo-sterling-gray',    name: 'Sterling Gray',    hex: '#B8B6B0', hue: 'Light silver-gray'       },
      { id: 'mo-weathered-blend',  name: 'Weathered Blend',  hex: '#8A7870', hue: 'Gray-brown weathered'    },
      { id: 'mo-weathered-wood',   name: 'Weathered Wood',   hex: '#9E8E78', hue: 'Aged driftwood gray'    }
    ]
  },
  {
    tier: 'Best',
    line: 'Cedar Impressions®',
    material: 'Polymer Shakes & Shingles',
    profileLabel: 'T5" Perfection Straight / D7" Staggered',
    textureImage: '/textures/cedar-shake.png',
    textureStyle: 'shake',
    description: 'Authentic cedar shingle look with 28 hand-selected colors.',
    colors: [
      { id: 'ci-autumn-red',           name: 'Autumn Red',           hex: '#7A3530', hue: 'Deep brick red'           },
      { id: 'ci-bermuda-blue',         name: 'Bermuda Blue',         hex: '#7A9BAF', hue: 'Soft caribbean blue'      },
      { id: 'ci-brownstone',           name: 'Brownstone',           hex: '#6E5A46', hue: 'Medium warm brown'        },
      { id: 'ci-castle-stone',         name: 'Castle Stone',         hex: '#A09890', hue: 'Warm light gray-beige'    },
      { id: 'ci-cedar-blend-solid',    name: 'Cedar Blend Solid',    hex: '#8A5C3A', hue: 'Reddish-brown fresh cedar'},
      { id: 'ci-charcoal-gray',        name: 'Charcoal Gray',        hex: '#4A4A4C', hue: 'Near-black dark gray'     },
      { id: 'ci-colonial-white',       name: 'Colonial White',       hex: '#E8E6DF', hue: 'Warm off-white'           },
      { id: 'ci-cypress',              name: 'Cypress',              hex: '#9A9E80', hue: 'Warm olive-gray'           },
      { id: 'ci-deep-mineral',         name: 'Deep Mineral',         hex: '#445A6E', hue: 'Deep teal-steel blue'     },
      { id: 'ci-driftwood-blend-solid',name: 'Driftwood Blend Solid',hex: '#A2A09A', hue: 'Aged cedar silvery gray'  },
      { id: 'ci-espresso',             name: 'Espresso',             hex: '#3A2218', hue: 'Very dark espresso'       },
      { id: 'ci-flagstone',            name: 'Flagstone',            hex: '#756E66', hue: 'Warm slate gray'           },
      { id: 'ci-granite-gray',         name: 'Granite Gray',         hex: '#8C8B87', hue: 'Neutral medium gray'      },
      { id: 'ci-hearthstone',          name: 'Hearthstone',          hex: '#897868', hue: 'Warm gray-brown'          },
      { id: 'ci-melrose',              name: 'Melrose',              hex: '#8F95A4', hue: 'Dusty periwinkle gray'    },
      { id: 'ci-midnight-blue',        name: 'Midnight Blue',        hex: '#2C3D52', hue: 'Deep navy blue'           },
      { id: 'ci-natural-blend-solid',  name: 'Natural Blend Solid',  hex: '#CDB89A', hue: 'Fresh cedar light tan'    },
      { id: 'ci-natural-clay',         name: 'Natural Clay',         hex: '#C8B89A', hue: 'Warm earthy clay'         },
      { id: 'ci-pacific-blue',         name: 'Pacific Blue',         hex: '#6A7D89', hue: 'Muted slate blue'         },
      { id: 'ci-rustic-blend-solid',   name: 'Rustic Blend Solid',   hex: '#8A7268', hue: 'Seasoned cedar brown-gray'},
      { id: 'ci-sable-brown',          name: 'Sable Brown',          hex: '#5A3E2E', hue: 'Dark warm brown'          },
      { id: 'ci-savannah-wicker',      name: 'Savannah Wicker',      hex: '#C4AE82', hue: 'Warm golden wicker'       },
      { id: 'ci-seagrass',             name: 'Seagrass',             hex: '#8A9878', hue: 'Sage green-gray'          },
      { id: 'ci-slate',                name: 'Slate',                hex: '#697077', hue: 'Cool blue-gray'           },
      { id: 'ci-sterling-gray',        name: 'Sterling Gray',        hex: '#B8B6B0', hue: 'Light silver-gray'        },
      { id: 'ci-tuxedo',               name: 'Tuxedo',               hex: '#2E2E30', hue: 'Near-black charcoal'      },
      { id: 'ci-weathered-wood',       name: 'Weathered Wood',       hex: '#9E8E78', hue: 'Aged driftwood gray'     },
      { id: 'ci-wedgewood-blue',       name: 'Wedgewood Blue',       hex: '#6E8B9A', hue: 'Medium coastal blue'     }
    ]
  },
  {
    tier: 'B&B',
    line: 'CedarBoards™',
    material: 'Insulated Board & Batten Vinyl',
    profileLabel: '7" & 8" Board + Batten — TrueTexture™ Cedar',
    textureImage: '/textures/board-batten.png',
    textureStyle: 'board-batten',
    description: 'Vertical board & batten with TrueTexture™ cedar finish and insulated foam backing.',
    style: 'vertical',
    colors: [
      { id: 'cb-autumn-red',      name: 'Autumn Red',      hex: '#7A3530', hue: 'Deep brick red'       },
      { id: 'cb-colonial-white',  name: 'Colonial White',  hex: '#E8E6DF', hue: 'Warm off-white'       },
      { id: 'cb-granite-gray',    name: 'Granite Gray',    hex: '#8C8B87', hue: 'Neutral medium gray'  },
      { id: 'cb-herringbone',     name: 'Herringbone',     hex: '#C9B98C', hue: 'Warm wheat sand'      },
      { id: 'cb-natural-clay',    name: 'Natural Clay',    hex: '#C8B89A', hue: 'Warm earthy clay'     },
      { id: 'cb-savannah-wicker', name: 'Savannah Wicker', hex: '#C4AE82', hue: 'Warm golden wicker'   },
      { id: 'cb-snow',            name: 'Snow',            hex: '#F2F2F0', hue: 'Crisp near-white'     },
      { id: 'cb-sterling-gray',   name: 'Sterling Gray',   hex: '#B8B6B0', hue: 'Light silver-gray'    }
    ]
  }
];

// Keep for backward compatibility
export const VERTICAL_SIDING_OPTIONS: SidingLine[] = [SIDING_OPTIONS[3]];

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
    tier: 'Patriot XL',
    line: 'CertainTeed Patriot XL',
    materialType: 'CertainTeed Patriot XL Shingles',
    profileLabel: 'Entry-Level Architectural Shingles',
    textureImage: '',
    textureStyle: 'architectural',
    description: 'Builder-grade dimensional architectural shingles — 8 colors.',
    colors: [
      { id: 'pat-jet-black',    name: 'Jet Black',    hex: '#1E1F21', hue: 'Crisp deep black'          },
      { id: 'pat-raven-black',  name: 'Raven Black',  hex: '#3A3B3D', hue: 'Dark charcoal black'       },
      { id: 'pat-ash-gray',     name: 'Ash Gray',     hex: '#8B8C8E', hue: 'Medium cool gray'          },
      { id: 'pat-smoked-gray',  name: 'Smoked Gray',  hex: '#6E7377', hue: 'Muted blue-gray'           },
      { id: 'pat-sablewood',    name: 'Sablewood',    hex: '#83715C', hue: 'Weathered wood brown'      },
      { id: 'pat-maple-brown',  name: 'Maple Brown',  hex: '#5E4F41', hue: 'Rich medium brown'         },
      { id: 'pat-hazelnut',     name: 'Hazelnut',     hex: '#9C836A', hue: 'Warm golden tan-brown'     },
      { id: 'pat-trufflewood',  name: 'Trufflewood',  hex: '#4E3E34', hue: 'Dark warm brown'           },
    ]
  },
  {
    tier: 'Landmark',
    line: 'CertainTeed Landmark',
    materialType: 'CertainTeed Landmark Shingles',
    profileLabel: 'Classic Dimensional Architectural Shingles',
    textureImage: '',
    textureStyle: 'architectural',
    description: 'Industry-standard dimensional architectural shingle — 13 colors.',
    colors: [
      { id: 'std-moire-black',     name: 'Moire Black',      hex: '#2B2B2C', hue: 'Deep charcoal black'       },
      { id: 'std-charcoal',        name: 'Charcoal Black',   hex: '#3C3C3E', hue: 'Dark near-black charcoal', swatchImage: '/textures/roofing/charcoal-black.jpg' },
      { id: 'std-weathered-wood',  name: 'Weathered Wood',   hex: '#8B7E6D', hue: 'Aged wood gray-brown'      },
      { id: 'std-pewter-gray',     name: 'Pewterwood',       hex: '#7B7D7E', hue: 'Medium gray with brown undertones' },
      { id: 'std-cobblestone-gray', name: 'Cobblestone Gray', hex: '#A5A6A3', hue: 'Light neutral gray', swatchImage: '/textures/roofing/cobblestone-gray.jpg' },
      { id: 'std-colonial-slate',  name: 'Colonial Slate',   hex: '#6D6E70', hue: 'Classic slate gray-blue', swatchImage: '/textures/roofing/colonial-slate.jpg' },
      { id: 'std-georgetown-gray', name: 'Georgetown Gray',  hex: '#7A7D81', hue: 'Medium cool gray', swatchImage: '/textures/roofing/georgetown-gray.jpg' },
      { id: 'std-driftwood',       name: 'Driftwood',        hex: '#7E6B5D', hue: 'Deep greyish brown'        },
      { id: 'std-burnt-sienna',    name: 'Burnt Sienna',     hex: '#7C5441', hue: 'Warm reddish brown', swatchImage: '/textures/roofing/burnt-sienna.jpg' },
      { id: 'std-black-walnut',    name: 'Black Walnut',     hex: '#4A3B32', hue: 'Dark walnut brown', swatchImage: '/textures/roofing/black-walnut.jpg' },
      { id: 'std-cinder-black',    name: 'Cinder Black',     hex: '#2E2E30', hue: 'Deep cinder black', swatchImage: '/textures/roofing/cinder-black.png' },
      { id: 'std-resawn-shake',    name: 'Resawn Shake',     hex: '#96806C', hue: 'Natural weathered cedar'   },
      { id: 'std-heather-blend',   name: 'Heather Blend',    hex: '#88725C', hue: 'Muted brown-gray blend', swatchImage: '/textures/roofing/heather-blend.jpg' },
      { id: 'std-mojave-tan',      name: 'Mojave Tan',       hex: '#8B745D', hue: 'Warm tan and brown blend', swatchImage: '/textures/roofing/mojave-tan.jpg' },
      { id: 'std-silver-birch',    name: 'Silver Birch',     hex: '#CFD1D0', hue: 'Light reflective silver-white' },
      { id: 'std-hunter-green',    name: 'Hunter Green',     hex: '#2D4F37', hue: 'Deep traditional forest green' },
    ]
  },
  {
    tier: 'Landmark Pro',
    line: 'CertainTeed Landmark Pro',
    materialType: 'CertainTeed Landmark Pro Shingles',
    profileLabel: 'Max Def Premium Architectural Shingles',
    textureImage: '',
    textureStyle: 'designer',
    description: 'Premium heavyweight shingle with Max Def high-definition color depth — 12 colors.',
    colors: [
      { id: 'pro-moire-black',     name: 'Max Def Moire Black',      hex: '#262628', hue: 'Ultra-HD deep black'             },
      { id: 'pro-charcoal',        name: 'Max Def Charcoal Black', hex: '#363638', hue: 'High-definition charcoal black', swatchImage: '/textures/roofing/charcoal-black.jpg' },
      { id: 'pro-weathered-wood',  name: 'Max Def Weathered Wood',   hex: '#837461', hue: 'High-definition aged wood brown' },
      { id: 'pro-pewterwood',      name: 'Max Def Pewterwood',       hex: '#727475', hue: 'High-definition pewter gray-brown' },
      { id: 'pro-cobblestone-gray', name: 'Max Def Cobblestone Gray', hex: '#9C9C98', hue: 'High-definition light neutral gray', swatchImage: '/textures/roofing/cobblestone-gray.jpg' },
      { id: 'pro-colonial-slate',  name: 'Max Def Colonial Slate',   hex: '#66686A', hue: 'High-definition slate gray-blue', swatchImage: '/textures/roofing/colonial-slate.jpg' },
      { id: 'pro-georgetown-gray', name: 'Max Def Georgetown Gray',  hex: '#707377', hue: 'High-definition medium gray', swatchImage: '/textures/roofing/georgetown-gray.jpg' },
      { id: 'pro-driftwood',       name: 'Max Def Driftwood',        hex: '#746153', hue: 'High-definition warm brown'      },
      { id: 'pro-burnt-sienna',    name: 'Max Def Burnt Sienna',   hex: '#724937', hue: 'High-definition warm reddish-tan', swatchImage: '/textures/roofing/burnt-sienna.jpg' },
      { id: 'pro-black-walnut',    name: 'Max Def Black Walnut',   hex: '#42332A', hue: 'High-definition walnut brown', swatchImage: '/textures/roofing/black-walnut.jpg' },
      { id: 'pro-cinder-black',    name: 'Max Def Cinder Black',   hex: '#262628', hue: 'High-definition cinder black', swatchImage: '/textures/roofing/cinder-black.png' },
      { id: 'pro-resawn-shake',    name: 'Max Def Resawn Shake',     hex: '#8C7561', hue: 'High-definition golden cedar shake' },
      { id: 'pro-heather-blend',   name: 'Max Def Heather Blend',    hex: '#7E6751', hue: 'High-definition deep brown-gray blend', swatchImage: '/textures/roofing/heather-blend.jpg' },
      { id: 'pro-mojave-tan',      name: 'Max Def Mojave Tan',       hex: '#836A51', hue: 'High-definition warm tan blend', swatchImage: '/textures/roofing/mojave-tan.jpg' },
      { id: 'pro-shenandoah',      name: 'Max Def Shenandoah',       hex: '#4B5A50', hue: 'High-definition earthy gray-green blend' },
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
  { id: 'rz-main', name: 'Roof', enabled: false, selectedLine: ROOFING_OPTIONS[1], selectedColor: ROOFING_OPTIONS[1].colors[0] },
  { id: 'rz-gutters', name: 'Gutters', enabled: false, selectedLine: { tier: 'Standard', line: 'Seamless Gutters', materialType: 'Seamless Aluminum Gutters', profileLabel: '5" K-Style / 6" K-Style', textureImage: '', textureStyle: 'metal', description: 'Standard aluminum gutters', colors: GUTTER_COLORS } as any, selectedColor: GUTTER_COLORS[0] },
];

export const DEFAULT_QUICK_ZONES: QuickZone[] = [
  { id: 'qz-main',     name: 'Main Body',   enabled: false,  selectedLine: SIDING_OPTIONS[0], selectedColor: SIDING_OPTIONS[0].colors[0] },
  { id: 'qz-gable',    name: 'Upper Gable', enabled: false, selectedLine: SIDING_OPTIONS[2], selectedColor: SIDING_OPTIONS[2].colors[0] },
  { id: 'qz-dormer',   name: 'Dormer',      enabled: false, selectedLine: SIDING_OPTIONS[2], selectedColor: SIDING_OPTIONS[2].colors[3] },
  { id: 'qz-trim',     name: 'Trim',        enabled: false, selectedLine: SIDING_OPTIONS[0], selectedColor: TRIM_COLORS[0] },
  { id: 'qz-shutters', name: 'Shutters',    enabled: false, selectedLine: SIDING_OPTIONS[0], selectedColor: SHUTTER_COLORS[0] },
  { id: 'qz-garage',   name: 'Garage',      enabled: false, selectedLine: SIDING_OPTIONS[0], selectedColor: SIDING_OPTIONS[0].colors[1] },
];
