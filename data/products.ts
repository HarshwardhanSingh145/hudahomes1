export type CategoryId =
  | 'console-table'
  | 'lander'
  | 'side-tables'
  | 'dining-tables'
  | 'fireplace'
  | 'pedistal'
  | 'washbasin'
  | 'other-beautiful-handicrafts';

export const OWNER_PHONE_RAW = '8058694217';
export const OWNER_PHONE_INTL = '918058694217';
export const OWNER_PHONE_DISPLAY = '+91 80586 94217';
export const OWNER_TEL_URL = 'tel:+918058694217';
export const OWNER_WHATSAPP_URL = 'https://wa.me/918058694217';

export function formatIndianWhatsAppDigits(rawPhone?: string): string {
  const digits = (rawPhone || OWNER_PHONE_INTL).replace(/[^0-9]/g, '');
  if (!digits) return OWNER_PHONE_INTL;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
}

export type ImageFitMode = 'original' | 'edge-to-edge';

export interface Product {
  id: string;
  name: string;
  category: CategoryId;
  categoryLabel: string;
  quantity: string;
  material: string;
  imageFitMode?: ImageFitMode;
  price?: string;
  subtitle?: string;
  origin?: string;
  finishes?: string[];
  standardFormat?: string;
  thickness?: string;
  applications?: string[];
  description?: string;
  image: string;
  detailImage?: string;
  images?: string[];
  bookmatched?: boolean;
  featured?: boolean;
}

export function inferMaterialFromProduct(p: {
  material?: string;
  name?: string;
  subtitle?: string;
  origin?: string;
}): string {
  if (p.material && p.material.trim()) return p.material.trim();
  const name = p.name || '';
  if (/statuario/i.test(name)) return 'Italian Statuario White Marble';
  if (/calacatta viola/i.test(name)) return 'Calacatta Viola Breccia Marble';
  if (/calacatta/i.test(name)) return 'Calacatta Oro Italian Marble';
  if (/botticino/i.test(name)) return 'Botticino Classico Marble';
  if (/travertine/i.test(name)) return 'Natural Roman Travertine Stone';
  if (/marquina/i.test(name)) return 'Spanish Nero Marquina Black Marble';
  if (/verde alpi/i.test(name)) return 'Verde Alpi Green Serpentine Marble';
  if (/sandstone/i.test(name)) return 'Natural Golden Sandstone';
  if (/slate/i.test(name)) return 'Natural Split-Cleft Slate Stone';
  if (/basalt/i.test(name)) return 'Volcanic Honed Basalt Stone';
  if (/limestone/i.test(name)) return 'Natural Architectural Limestone';
  if (/granite/i.test(name)) return 'Natural Architectural Granite';
  if (/onyx/i.test(name)) return 'Translucent Natural Onyx Stone';
  if (/alabaster/i.test(name)) return 'Volterra Translucent Alabaster';
  if (/pietra grey/i.test(name)) return 'Pietra Grey Natural Marble';
  if (/emperador/i.test(name)) return 'Dark Emperador Marble';
  if (/rosso/i.test(name)) return 'Rosso Levanto Red Marble';
  if (/arabescato/i.test(name)) return 'Arabescato Corchia Italian Marble';
  if (/makrana/i.test(name)) return 'Makrana Pure White Marble';
  return 'Natural Hand-Carved Marble';
}

export function inferQuantityFromProduct(p: {
  quantity?: string;
  standardFormat?: string;
  category?: string;
}): string {
  if (p.quantity && p.quantity.trim()) return p.quantity.trim();
  if (p.standardFormat && /set of 2/i.test(p.standardFormat)) return '1 Pair (2 Pieces)';
  if (p.standardFormat && /complete set/i.test(p.standardFormat)) return '1 Complete Set';
  if (p.category === 'lander') return '1 Slab';
  return '1 Piece';
}

type RawSeedProduct = Omit<Product, 'quantity' | 'material'> & {
  quantity?: string;
  material?: string;
};

export function normalizeProductRecord(p: RawSeedProduct): Product {
  const images =
    Array.isArray(p.images) && p.images.length > 0
      ? p.images.filter(Boolean)
      : [p.image, ...(p.detailImage && p.detailImage !== p.image ? [p.detailImage] : [])].filter(
          Boolean
        );
  const primaryImage = images[0] || p.image;
  const imageFitMode: ImageFitMode =
    p.imageFitMode === 'original' ? 'original' : 'edge-to-edge';
  return {
    ...p,
    image: primaryImage,
    detailImage: p.detailImage || images[1] || primaryImage,
    images,
    imageFitMode,
    quantity: inferQuantityFromProduct(p),
    material: inferMaterialFromProduct(p),
    price: p.price || 'Price on Request',
    subtitle: p.subtitle || '',
    origin: p.origin || 'HUDA HOMES Artisanal Quarry Selection',
    finishes: Array.isArray(p.finishes) && p.finishes.length > 0 ? p.finishes : ['Polished', 'Honed'],
    standardFormat: p.standardFormat || 'Standard Architectural Format',
    thickness: p.thickness || '20mm & 30mm Solid Block',
    applications:
      Array.isArray(p.applications) && p.applications.length > 0
        ? p.applications
        : ['Luxury Residential', 'Architectural Interiors'],
    description:
      p.description ||
      `Handcrafted ${p.name} in ${inferMaterialFromProduct(p)} (${inferQuantityFromProduct(p)}).`,
  };
}

export const CATEGORIES: ReadonlyArray<{
  id: CategoryId;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    id: 'console-table',
    label: 'Console Table',
    icon: 'Layers',
    description: 'Sculptural marble and monolithic stone console tables for grand foyers and galleries.',
  },
  {
    id: 'lander',
    label: 'Lander',
    icon: 'Mountain',
    description: 'Architectural stone landers, monolithic stair landings, and stepped plinth slabs.',
  },
  {
    id: 'side-tables',
    label: 'Side Tables',
    icon: 'Square',
    description: 'Hand-turned and faceted natural stone accent and lounge side tables.',
  },
  {
    id: 'dining-tables',
    label: 'Dining Tables',
    icon: 'Grid3X3',
    description: 'Statement bookmatched marble and sintered stone dining tables for timeless gatherings.',
  },
  {
    id: 'fireplace',
    label: 'Fireplace',
    icon: 'Sparkles',
    description: 'Bespoke carved marble mantels, fluted surrounds, and monolithic hearth elevations.',
  },
  {
    id: 'pedistal',
    label: 'Pedistal',
    icon: 'Gem',
    description: 'Monolithic gallery pedestals and fluted stone columns for fine art and sculpture.',
  },
  {
    id: 'washbasin',
    label: 'Washbasin',
    icon: 'Layers',
    description: 'Solid block-carved marble vessel sinks, integrated vanities, and freestanding washbasins.',
  },
  {
    id: 'other-beautiful-handicrafts',
    label: 'Other Beautiful Handicrafts',
    icon: 'Sparkles',
    description: 'Artisan-carved stone vessels, inlay trays, architectural bowls, and bespoke objects.',
  },
] as const;

const RAW_PRODUCTS: RawSeedProduct[] = [
  // ============================================================================
  // 1. CONSOLE TABLE (6 Products — preserves original Statuario, Calacatta, Botticino + 3 more)
  // ============================================================================
  {
    id: 'statuario-marble',
    name: 'Statuario Marble Console Table',
    category: 'console-table',
    categoryLabel: 'Console Table',
    price: '$4,850',
    subtitle: 'Pure white Carrara bed with dramatic graphite veining',
    origin: 'Carrara, Tuscany, Italy',
    finishes: ['Polished', 'Honed', 'Satin', 'Bookmatched'],
    standardFormat: '180 × 45 × 78 cm',
    thickness: '20mm & 30mm',
    applications: ['Grand Foyers', 'Living Pavilions', 'Private Galleries', 'Entry Halls'],
    description:
      'The crown jewel of Italian quarrying sculpted into an architectural console silhouette. Statuario is celebrated worldwide for its brilliant luminous ivory matrix contrasted by bold, sweeping storm-grey veins.',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85',
    bookmatched: true,
    featured: true,
  },
  {
    id: 'calacatta-marble',
    name: 'Calacatta Oro Monolith Console',
    category: 'console-table',
    categoryLabel: 'Console Table',
    price: '$5,200',
    subtitle: 'Warm crystalline white with honey & charcoal veins',
    origin: 'Apuan Alps, Italy',
    finishes: ['High-Gloss Polished', 'Velvet Honed', 'Leathered'],
    standardFormat: '200 × 48 × 76 cm',
    thickness: '30mm',
    applications: ['Private Foyers', 'Executive Suites', 'Dining Corridors'],
    description:
      'Characterized by a warm, creamy undertone interlaced with wide, dramatic ribbons of charcoal, bronze, and subtle gold. Mitered waterfall legs bring instant grandeur and bespoke warmth to signature spaces.',
    image:
      'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=85',
    bookmatched: true,
    featured: true,
  },
  {
    id: 'botticino-marble',
    name: 'Botticino Classico Arch Console',
    category: 'console-table',
    categoryLabel: 'Console Table',
    price: '$3,900',
    subtitle: 'Classic warm beige with delicate crystalline pearl veins',
    origin: 'Brescia, Lombardy, Italy',
    finishes: ['Honed', 'Antique Brushed', 'Polished'],
    standardFormat: '165 × 42 × 76 cm',
    thickness: '20mm',
    applications: ['Expansive Hallways', 'Grand Staircases', 'Covered Loggias'],
    description:
      'A timeless classic with superior compressive strength. Botticino offers soft biscuit and honey hues dotted with golden feathering, evoking the classic palazzos of northern Italy.',
    image:
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
    bookmatched: false,
    featured: false,
  },
  {
    id: 'travertine-fluted-console',
    name: 'Roman Travertine Fluted Console',
    category: 'console-table',
    categoryLabel: 'Console Table',
    price: '$4,350',
    subtitle: 'Vein-cut Tivoli travertine with hand-carved twin fluted columns',
    origin: 'Tivoli, Rome, Italy',
    finishes: ['Open Pore Honed', 'Filled Velvet Matte'],
    standardFormat: '175 × 45 × 77 cm',
    thickness: '25mm',
    applications: ['Entry Vestibules', 'Minimalist Living Rooms', 'Gallery Corridors'],
    description:
      'Supported by twin cylindrical columns with precision-milled vertical fluting, this Roman travertine console celebrates classical proportion and organic mineral pores.',
    image:
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85',
    bookmatched: false,
    featured: true,
  },
  {
    id: 'nero-marquina-cantilever-console',
    name: 'Nero Marquina Cantilever Console',
    category: 'console-table',
    categoryLabel: 'Console Table',
    price: '$4,600',
    subtitle: 'Obsidian Spanish marble with bold cantilevered slab geometry',
    origin: 'Markina, Basque Country, Spain',
    finishes: ['Satin Honed', 'High-Gloss Polished'],
    standardFormat: '190 × 44 × 76 cm',
    thickness: '30mm',
    applications: ['Modern Penthouses', 'Architectural Foyers', 'Executive Reception'],
    description:
      'Engineered with an asymmetric counterbalance plinth, the Nero Marquina Cantilever Console delivers striking graphical contrast with fine white calcite lightning veins.',
    image:
      'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
    bookmatched: true,
    featured: false,
  },
  {
    id: 'verde-alpi-atelier-console',
    name: 'Verde Alpi Atelier Console Table',
    category: 'console-table',
    categoryLabel: 'Console Table',
    price: '$5,450',
    subtitle: 'Deep alpine forest serpentine marble with chamfered bevel edge',
    origin: 'Aosta Valley, Italy',
    finishes: ['Polished Crystal', 'Brushed Leather'],
    standardFormat: '185 × 46 × 78 cm',
    thickness: '25mm',
    applications: ['Private Libraries', 'Statement Entryways', 'Boutique Lounges'],
    description:
      'Quarried from the high Italian Alps, this rich emerald-and-charcoal stone console features a 45-degree chamfered tabletop resting on tapered monolith legs.',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85',
    bookmatched: true,
    featured: false,
  },

  // ============================================================================
  // 2. LANDER (6 Products — preserves Travertine Navona, Desert Sandstone, Slate Stone + 3 more)
  // ============================================================================
  {
    id: 'travertine-navona',
    name: 'Travertine Navona Grand Lander',
    category: 'lander',
    categoryLabel: 'Lander',
    price: '$3,400',
    subtitle: 'Cross-cut Roman travertine monolithic stair & foyer lander slab',
    origin: 'Tivoli, Rome, Italy',
    finishes: ['Open Pore Honed', 'Filled & Honed', 'Vein Cut', 'Tumbled'],
    standardFormat: '240 × 120 × 6 cm',
    thickness: '30mm & 60mm',
    applications: ['Staircase Landings', 'Indoor-Outdoor Thresholds', 'Split-Level Plinths'],
    description:
      'The sacred stone of Rome crafted into seamless architectural landers. Travertine Navona features warm sandy bone tones with gentle horizontal striations, delivering profound warmth underfoot.',
    image:
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85',
    featured: true,
  },
  {
    id: 'desert-sandstone',
    name: 'Natural Sandstone Courtyard Lander',
    category: 'lander',
    categoryLabel: 'Lander',
    price: '$2,750',
    subtitle: 'Warm golden grain with subtle geological wave lines',
    origin: 'Rajasthan & Central Highlands',
    finishes: ['Sawn Finish', 'Sandblasted', 'Shot-blasted', 'Honed'],
    standardFormat: '200 × 110 × 5 cm',
    thickness: '40mm & 50mm',
    applications: ['Courtyard Terraces', 'Garden Pavilion Steps', 'Veranda Landings'],
    description:
      'Densely compacted silica grains formed over epochs. Naturally slip-resistant, soothingly tactile underfoot, and engineered for grand transition landings.',
    image:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },
  {
    id: 'charcoal-slate-stone',
    name: 'Galician Slate Monolith Lander',
    category: 'lander',
    categoryLabel: 'Lander',
    price: '$3,150',
    subtitle: 'Fine-grained architectural anthracite with natural cleft strata',
    origin: 'Galicia, Northern Spain',
    finishes: ['Natural Cleft', 'Honed Smooth', 'Brushed Texture'],
    standardFormat: '220 × 115 × 4 cm',
    thickness: '30mm & 40mm',
    applications: ['Floating Stair Landers', 'Entry Platforms', 'Exterior Terraces'],
    description:
      'Foliated metamorphic stone featuring low water porosity and a distinct micro-textured surface that catches directional architectural light with subtle graphite sheen.',
    image:
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85',
    featured: true,
  },
  {
    id: 'natural-limestone-jura',
    name: 'Jura Limestone Stepped Lander',
    category: 'lander',
    categoryLabel: 'Lander',
    price: '$3,600',
    subtitle: 'Pale oyster and bone beige with micro-crystalline fossil traces',
    origin: 'Burgundy, France & Bavaria',
    finishes: ['Velvet Honed', 'Brushed', 'Bush-hammered'],
    standardFormat: '240 × 120 × 5 cm',
    thickness: '30mm & 50mm',
    applications: ['Minimalist Stairways', 'Gallery Mezzanines', 'Atrium Landings'],
    description:
      'A tranquil, softly muted limestone lander celebrated for its matte, understated presence. Creates unbroken continuity between split architectural levels.',
    image:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },
  {
    id: 'basaltina-floating-lander',
    name: 'Basaltina Volcanic Floating Lander',
    category: 'lander',
    categoryLabel: 'Lander',
    price: '$3,950',
    subtitle: 'Dense Italian volcanic stone calibrated for cantilevered stairs',
    origin: 'Bagnoregio, Viterbo, Italy',
    finishes: ['Water-Honed', 'Thermal Flamed', 'Sawn Anti-Slip'],
    standardFormat: '210 × 105 × 6 cm',
    thickness: '60mm Solid Block',
    applications: ['Cantilevered Staircases', 'Garden Thresholds', 'Gallery Entrances'],
    description:
      'Quarried from central Italian volcanic deposits, this monolithic lander offers high flexural strength and a quiet ash-grey mineral grain.',
    image:
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },
  {
    id: 'pietra-serena-pavilion-lander',
    name: 'Pietra Serena Pavilion Lander',
    category: 'lander',
    categoryLabel: 'Lander',
    price: '$3,500',
    subtitle: 'FlorentineRenaissance grey sandstone with bullnose step profile',
    origin: 'Fiesole, Tuscany, Italy',
    finishes: ['Fine Honed', 'Chiseled Edge', 'Bush-Hammered Grip'],
    standardFormat: '230 × 115 × 5 cm',
    thickness: '45mm',
    applications: ['Villa Porticos', 'Library Mezzanines', 'Ceremonial Stairways'],
    description:
      'Beloved by Renaissance master architects, Pietra Serena brings a composed silver-taupe tone and crisp architectural profiling to grand landings.',
    image:
      'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },

  // ============================================================================
  // 3. SIDE TABLES (6 Products — preserves Emperador, Nero Marquina + 4 more)
  // ============================================================================
  {
    id: 'emperador-marble',
    name: 'Emperador Marble Cube Side Table',
    category: 'side-tables',
    categoryLabel: 'Side Tables',
    price: '$1,650',
    subtitle: 'Deep espresso matrix with intricate calcite cobweb veining',
    origin: 'Valencia, Spain',
    finishes: ['Polished', 'Honed', 'Leathered'],
    standardFormat: '48 × 48 × 52 cm',
    thickness: '20mm Mitered Block',
    applications: ['Lounge Seating', 'Master Suites', 'Executive Reading Corners'],
    description:
      'A deeply aristocratic natural stone side table with a rich dark chocolate body woven with hazelnut clouds and fine ivory crystal fractures.',
    image:
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
    bookmatched: true,
    featured: true,
  },
  {
    id: 'nero-marquina',
    name: 'Nero Marquina Drum Side Table',
    category: 'side-tables',
    categoryLabel: 'Side Tables',
    price: '$1,850',
    subtitle: 'Pure midnight black cylinder with stark white lightning veins',
    origin: 'Markina, Basque Country, Spain',
    finishes: ['Polished', 'Honed', 'Fluted Barrel'],
    standardFormat: 'Ø 45 × 50 cm',
    thickness: 'Solid Lathe-Turned Core',
    applications: ['Living Room Sofas', 'Bedside Suites', 'Hotel Lobby Lounges'],
    description:
      'Lathe-turned from a solid cylindrical boulder of Basque Nero Marquina, delivering uncompromising graphical contrast beside upholstered seating.',
    image:
      'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
    bookmatched: true,
    featured: false,
  },
  {
    id: 'calacatta-viola-plinth-side-table',
    name: 'Calacatta Viola Plinth Side Table',
    category: 'side-tables',
    categoryLabel: 'Side Tables',
    price: '$2,250',
    subtitle: 'Rich burgundy-violet breccia veins framing creamy Carrara clasts',
    origin: 'Carrara, Italy',
    finishes: ['Velvet Honed', 'Mirror Polished'],
    standardFormat: '45 × 45 × 54 cm',
    thickness: '20mm Seamless Miter',
    applications: ['Salon Seating', 'Bespoke Bedrooms', 'Collector Galleries'],
    description:
      'An iconic low architectural plinth side table crafted from dramatic Calacatta Viola marble, turning every corner into an editorial focal point.',
    image:
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=85',
    bookmatched: true,
    featured: true,
  },
  {
    id: 'roman-travertine-hourglass-table',
    name: 'Roman Travertine Hourglass Side Table',
    category: 'side-tables',
    categoryLabel: 'Side Tables',
    price: '$1,580',
    subtitle: 'Sculptural double-cone silhouette in warm porous Tivoli stone',
    origin: 'Tivoli, Rome, Italy',
    finishes: ['Raw Open Pore', 'Brushed Matte'],
    standardFormat: 'Ø 42 × 48 cm',
    thickness: 'Solid Carved Block',
    applications: ['Sunlit Living Rooms', 'Covered Terraces', 'Reading Nooks'],
    description:
      'Carved on a five-axis CNC lathe and hand-finished by Italian stone artisans, the Hourglass Side Table balances monolithic weight with poised geometry.',
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },
  {
    id: 'amber-onyx-prism-side-table',
    name: 'Amber Onyx Faceted Side Table',
    category: 'side-tables',
    categoryLabel: 'Side Tables',
    price: '$2,490',
    subtitle: 'Translucent honey-amber onyx with octagonal faceted sides',
    origin: 'Yazd & Oaxaca Quarries',
    finishes: ['High-Luster Polished', 'Satin Glow'],
    standardFormat: '44 × 44 × 51 cm',
    thickness: '25mm',
    applications: ['Evening Lounges', 'Master Suites', 'Boutique Dressing Rooms'],
    description:
      'Crystalline onyx bands catch ambient daylight and warm evening lamps, casting a jewel-like amber glow across surrounding floors.',
    image:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=85',
    bookmatched: true,
    featured: false,
  },
  {
    id: 'connemara-green-fluted-side-table',
    name: 'Verde Guatemala Fluted Side Table',
    category: 'side-tables',
    categoryLabel: 'Side Tables',
    price: '$1,790',
    subtitle: 'Scalloped vertical reeds carved in deep botanical green marble',
    origin: 'Udaipur & Guatemala',
    finishes: ['Honed Silk', 'Polished Top'],
    standardFormat: 'Ø 46 × 52 cm',
    thickness: 'Solid Fluted Base',
    applications: ['Conservatories', 'Living Pavilions', 'Hospitality Suites'],
    description:
      'Tactile scalloped fluting encircles the base while a smooth honed circular top showcases rich serpentine clouding.',
    image:
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },

  // ============================================================================
  // 4. DINING TABLES (6 Products — preserves Large Format Porcelain, Stone-Finish, Matte, Polished + 2 more)
  // ============================================================================
  {
    id: 'large-format-porcelain',
    name: 'Grand Monolith Sintered Dining Table',
    category: 'dining-tables',
    categoryLabel: 'Dining Tables',
    price: '$7,800',
    subtitle: 'Seamless 320 × 120 cm monolithic banquet top with zero porosity',
    origin: 'Sassuolo, Modena, Italy',
    finishes: ['Silk Matte', 'Polished Crystal', 'Textured Structure'],
    standardFormat: '320 × 120 × 76 cm (10–12 Seater)',
    thickness: '20mm Reinforced Slab',
    applications: ['Formal Dining Rooms', 'Indoor-Outdoor Loggias', 'Boardrooms'],
    description:
      'Ultra-compact sintered porcelain slab dining table impervious to red wine, citrus, heat, and scratches, supported by twin architectural stone piers.',
    image:
      'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1200&q=85',
    detailImage:
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=85',
    featured: true,
  },
  {
    id: 'stone-finish-porcelain',
    name: 'Ceppo di Gré Architectural Dining Table',
    category: 'dining-tables',
    categoryLabel: 'Dining Tables',
    price: '$6,900',
    subtitle: 'Pietra di Vals & Ceppo di Gré authentic mineral pebble relief',
    origin: 'Lombardy & Castellón',
    finishes: ['Honed Soft', 'Natural Brushed'],
    standardFormat: '260 × 110 × 75 cm (8–10 Seater)',
    thickness: '30mm Bullnose Edge',
    applications: ['Contemporary Dining', 'Al Fresco Pavilions', 'Design Studios'],
    description:
      'Showcases the iconic conglomerate pebble texture of Milanese architecture in a generous 8-to-10-person dining table with sculptural slab legs.',
    image:
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },
  {
    id: 'matte-porcelain',
    name: 'Pietra Chalk Oval Dining Table',
    category: 'dining-tables',
    categoryLabel: 'Dining Tables',
    price: '$6,400',
    subtitle: 'Warm chalk and limestone tones with anti-glare velvet bevel',
    origin: 'Emilia-Romagna, Italy',
    finishes: ['Ultra-Matte Velvet', 'Smooth Sawn'],
    standardFormat: '240 × 115 × 76 cm (8 Seater)',
    thickness: '25mm Chamfered Edge',
    applications: ['Open-Plan Dining', 'Artisan Kitchens', 'Minimalist Villas'],
    description:
      'An organic elliptical dining table with a soft matte stone finish that absorbs harsh reflections and invites intimate conversation around a central fluted drum.',
    image:
      'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },
  {
    id: 'polished-porcelain',
    name: 'Arabescato Corchia Banquet Table',
    category: 'dining-tables',
    categoryLabel: 'Dining Tables',
    price: '$8,650',
    subtitle: 'Bookmatched Italian breccia marble with sweeping ovular veins',
    origin: 'Apuan Alps, Tuscany, Italy',
    finishes: ['Mirror Polished', 'Velvet Honed'],
    standardFormat: '280 × 115 × 76 cm (10 Seater)',
    thickness: '30mm Solid Carrara Slab',
    applications: ['Formal Dining Halls', 'Penthouse Residences', 'Private Clubs'],
    description:
      'Hand-selected bookmatched Arabescato Corchia slab resting on dual V-shaped solid marble trestles, multiplying natural light across the dining room.',
    image:
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=85',
    bookmatched: true,
    featured: true,
  },
  {
    id: 'patagonia-quartzite-dining-table',
    name: 'Patagonia Quartzite Statement Table',
    category: 'dining-tables',
    categoryLabel: 'Dining Tables',
    price: '$9,400',
    subtitle: 'Crystalline quartz, black tourmaline, and gold feldspar mosaic',
    origin: 'Espírito Santo, Brazil',
    finishes: ['Polished Crystal', 'Leathered'],
    standardFormat: '300 × 120 × 76 cm (10–12 Seater)',
    thickness: '30mm',
    applications: ['Collector Dining Rooms', 'Luxury Chalets', 'Signature Villas'],
    description:
      'Each Patagonia Quartzite dining top is a natural geological painting of translucent quartz crystals and volcanic minerals with extreme Mohs 7 hardness.',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    bookmatched: true,
    featured: true,
  },
  {
    id: 'round-travertine-rotunda-table',
    name: 'Tivoli Rotunda Round Dining Table',
    category: 'dining-tables',
    categoryLabel: 'Dining Tables',
    price: '$5,950',
    subtitle: 'Circular Roman travertine tabletop with conical fluted pedestal',
    origin: 'Tivoli, Rome, Italy',
    finishes: ['Filled & Honed', 'Open-Pore Matte'],
    standardFormat: 'Ø 160 × 76 cm (6–8 Seater)',
    thickness: '30mm Bullnose',
    applications: ['Breakfast Rotundas', 'Square Dining Rooms', 'Sunlit Conservatories'],
    description:
      'Designed for effortless social flow, the 160 cm circular travertine top anchors on a monumental hand-fluted central drum.',
    image:
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },

  // ============================================================================
  // 5. FIREPLACE (6 Products — preserves Minimal, Textured, Contemporary Wall, Quartzite Cristallo + 2 more)
  // ============================================================================
  {
    id: 'quartzite-cristallo',
    name: 'Cristallo Quartzite Monolith Fireplace',
    category: 'fireplace',
    categoryLabel: 'Fireplace',
    price: '$8,200',
    subtitle: 'Pearlescent crystalline quartz surround with extreme thermal resistance',
    origin: 'Minas Gerais, Brazil',
    finishes: ['Leathered', 'Polished Glass', 'Honed'],
    standardFormat: '180 × 135 × 40 cm Surround',
    thickness: '30mm Mitered Cladding',
    applications: ['Great Rooms', 'Master Bedroom Hearths', 'Alpine Chalets'],
    description:
      'Formed from pure quartz sandstone subjected to extreme tectonic pressures. Cristallo illuminates warmly beside live hearth flames while resisting high thermal loads.',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    bookmatched: true,
    featured: true,
  },
  {
    id: 'minimal-ceramic',
    name: 'Haussmann Carved Carrara Mantel',
    category: 'fireplace',
    categoryLabel: 'Fireplace',
    price: '$6,750',
    subtitle: ' Parisian-proportioned Bianco Carrara fireplace with corbel jambs',
    origin: 'Carrara, Tuscany, Italy',
    finishes: ['Velvet Honed', 'Soft Satin Polish'],
    standardFormat: '155 × 118 × 35 cm',
    thickness: 'Solid Carved Block',
    applications: ['Drawing Rooms', 'Townhouse Salons', 'Primary Suites'],
    description:
      'Faithfully carved with classic French architectural mouldings, fluted jambs, and a deep beveled mantel shelf in luminous Bianco Carrara marble.',
    image:
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=85',
    featured: true,
  },
  {
    id: 'textured-ceramic',
    name: 'Fluted Travertine Hearth Elevation',
    category: 'fireplace',
    categoryLabel: 'Fireplace',
    price: '$7,100',
    subtitle: 'Full-height vertical fluted reeds and monolithic hearth bench',
    origin: 'Tivoli & Castellón',
    finishes: ['Bisque Matte', 'Ribbed Satin', 'Linear Grooved'],
    standardFormat: '200 × 280 × 45 cm Floor-to-Ceiling',
    thickness: '30mm Carvings',
    applications: ['Double-Height Living Rooms', 'Hotel Lobbies', 'Penthouse Lounges'],
    description:
      'Sculptural vertical reeding transforms the fireplace chimney breast into a rhythmic play of architectural shadow and warm firelight.',
    image:
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },
  {
    id: 'contemporary-wall-tiles',
    name: 'Warm Terracotta & Limestone Surround',
    category: 'fireplace',
    categoryLabel: 'Fireplace',
    price: '$5,400',
    subtitle: 'Earthy Mediterranean limestone frame with cantilevered hearth ledge',
    origin: 'Sassuolo & Provence',
    finishes: ['Brushed Limestone', 'Matte Silk'],
    standardFormat: '165 × 125 × 38 cm',
    thickness: '30mm',
    applications: ['Mediterranean Villas', 'Courtyard Loggias', 'Family Lounges'],
    description:
      'Inspired by vernacular Southern European architecture, pairing a warm limestone surround with a deep cantilevered fireside seating plinth.',
    image:
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },
  {
    id: 'basaltina-honed',
    name: 'Basaltina Brutalist Hearth Surround',
    category: 'fireplace',
    categoryLabel: 'Fireplace',
    price: '$6,950',
    subtitle: 'Dense volcanic basalt with uniform grey micro-crystalline grain',
    origin: 'Bagnoregio, Viterbo, Italy',
    finishes: ['Water-Honed', 'Flame-Textured', 'Smooth Sawn'],
    standardFormat: '190 × 120 × 42 cm',
    thickness: '40mm Solid Slabs',
    applications: ['Minimalist Fireplace Hearths', 'Loft Living', 'Modernist Villas'],
    description:
      'Quarried from extinct volcanic deposits in central Italy. Naturally born from fire, Basaltina provides the definitive dark-stone foundation for minimalist hearths.',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },
  {
    id: 'calacatta-oro-bookmatched-fireplace',
    name: 'Calacatta Bookmatched Chimney Cladding',
    category: 'fireplace',
    categoryLabel: 'Fireplace',
    price: '$9,800',
    subtitle: 'Mirror-matched golden veins ascending from hearth to ceiling',
    origin: 'Carrara, Italy',
    finishes: ['Polished', 'Honed'],
    standardFormat: '210 × 300 cm Custom Height',
    thickness: '20mm Bookmatched Panels',
    applications: ['Formal Living Rooms', 'Presidential Suites', 'Private Estates'],
    description:
      'Precision-cut from two consecutive slabs in the block so the golden-grey Calacatta veins mirror symmetrically across the centerpiece fireplace.',
    image:
      'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=85',
    bookmatched: true,
    featured: true,
  },

  // ============================================================================
  // 6. PEDISTAL (6 Products — preserves Premium Floor Tiles, Terrazzo Veneziano, Onyx Fantastico + 3 more)
  // ============================================================================
  {
    id: 'onyx-fantastico',
    name: 'Onyx Fantastico Illuminated Pedistal',
    category: 'pedistal',
    categoryLabel: 'Pedistal',
    price: '$3,200',
    subtitle: 'Translucent amber, rose, and ivory strata ready for internal LED',
    origin: 'Yazd Province & Mexico',
    finishes: ['Mirror Polished', 'Translucent Honed'],
    standardFormat: '38 × 38 × 105 cm Column',
    thickness: '20mm Mitered Optical Box',
    applications: ['Sculpture Display', 'Gallery Foyers', 'VIP Lounges'],
    description:
      'An ethereal, semi-precious stone pedestal capable of transmitting light from within to illuminate fine art, bronze sculptures, or floral vessels.',
    image:
      'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=85',
    bookmatched: true,
    featured: true,
  },
  {
    id: 'terrazzo-veneziano',
    name: 'Terrazzo Veneziano Gallery Pedistal',
    category: 'pedistal',
    categoryLabel: 'Pedistal',
    price: '$1,950',
    subtitle: 'Hand-selected Carrara and Verona marble chips in mineral matrix',
    origin: 'Veneto, Italy',
    finishes: ['Diamond Polished', 'Silken Honed', 'Micro-Brushed'],
    standardFormat: '36 × 36 × 95 cm',
    thickness: 'Solid Cast & Mitered Slab',
    applications: ['Art Galleries', 'Foyer Corners', 'Boutique Merchandising'],
    description:
      'A century-old Venetian craft reinvented into a tall architectural display column. Dense aggregate distribution delivers rhythmic mid-century appeal.',
    image:
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=85',
    featured: true,
  },
  {
    id: 'premium-floor-tiles',
    name: 'Doric Fluted Carrara Pedistal',
    category: 'pedistal',
    categoryLabel: 'Pedistal',
    price: '$2,650',
    subtitle: 'Classical 20-flute cylindrical marble column with stepped plinth',
    origin: 'Carrara & Bologna, Italy',
    finishes: ['Honed Matte', 'Classical Polished'],
    standardFormat: 'Ø 38 × 100 cm',
    thickness: 'Solid Carved Marble',
    applications: ['Classical Rotundas', 'Bust & Urn Display', 'Private Museums'],
    description:
      'Carved from a single block of white Italian marble with crisp Doric fluting and a square abacus top plate for displaying heirloom pieces.',
    image:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },
  {
    id: 'roman-travertine-monolith-pedistal',
    name: 'Roman Travertine Museum Pedistal',
    category: 'pedistal',
    categoryLabel: 'Pedistal',
    price: '$2,100',
    subtitle: 'Raw vein-cut travertine tower with razor-sharp mitered edges',
    origin: 'Tivoli, Rome, Italy',
    finishes: ['Open Pore Raw', 'Velvet Honed'],
    standardFormat: '35 × 35 × 110 cm',
    thickness: '20mm Seamless Miter',
    applications: ['Living Room Corners', 'Sculpture Exhibitions', 'Entry Foyers'],
    description:
      'Vertical vein-cut striations draw the eye upward, lending architectural stature to ceramic vessels, busts, and contemporary objects.',
    image:
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },
  {
    id: 'nero-marquina-obelisk-pedistal',
    name: 'Nero Marquina Tapered Pedistal',
    category: 'pedistal',
    categoryLabel: 'Pedistal',
    price: '$2,450',
    subtitle: 'Subtly tapered black Spanish marble plinth with white veining',
    origin: 'Markina, Spain',
    finishes: ['Polished', 'Satin Honed'],
    standardFormat: '40 × 40 × 98 cm',
    thickness: '25mm',
    applications: ['High-Contrast Galleries', 'Modern Foyers', 'Luxury Retail'],
    description:
      'A commanding jet-black marble pedestal that makes white marble sculptures, brass objects, and botanical arrangements pop with gallery precision.',
    image:
      'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=85',
    bookmatched: true,
    featured: false,
  },
  {
    id: 'roso-levanto-column-pedistal',
    name: 'Rosso Levanto Twisted Pedistal',
    category: 'pedistal',
    categoryLabel: 'Pedistal',
    price: '$2,890',
    subtitle: 'Deep cherry-wine Ligurian marble with helical carved shaft',
    origin: 'Levanto, Liguria, Italy',
    finishes: ['High-Gloss Polished', 'Honed'],
    standardFormat: 'Ø 36 × 102 cm',
    thickness: 'Solid Carved Shaft',
    applications: ['Statement Entrances', 'Study Libraries', 'Collector Salons'],
    description:
      'Carved from dramatic Rosso Levanto marble veined with white calcite, featuring a gentle torsion twist that captures light from every angle.',
    image:
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },

  // ============================================================================
  // 7. WASHBASIN (6 Products)
  // ============================================================================
  {
    id: 'carrara-monolith-freestanding-washbasin',
    name: 'Statuario Freestanding Pillar Washbasin',
    category: 'washbasin',
    categoryLabel: 'Washbasin',
    price: '$4,200',
    subtitle: 'Solid block-carved floor-standing cylinder basin with deep bowl',
    origin: 'Carrara, Tuscany, Italy',
    finishes: ['Honed Silk Interior', 'Fluted Exterior'],
    standardFormat: 'Ø 45 × 88 cm Freestanding',
    thickness: 'Solid Carved Block',
    applications: ['Powder Rooms', 'Master Bath Sanctuaries', 'Spa Suites'],
    description:
      'Hollowed from a single 400 kg boulder of Italian Statuario marble, this freestanding pedestal washbasin turns the powder room into an architectural sculpture.',
    image:
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=85',
    bookmatched: false,
    featured: true,
  },
  {
    id: 'travertine-slot-drain-washbasin',
    name: 'Roman Travertine Slot-Drain Vanity Basin',
    category: 'washbasin',
    categoryLabel: 'Washbasin',
    price: '$2,680',
    subtitle: 'Integrated sloped plane with concealed architectural linear drain',
    origin: 'Tivoli, Rome, Italy',
    finishes: ['Resin-Filled Honed', 'Brushed Velvet'],
    standardFormat: '90 × 52 × 22 cm Wall-Hung / Counter',
    thickness: '30mm Mitered Apron',
    applications: ['Minimalist Master Baths', 'Guest Suites', 'Boutique Hotels'],
    description:
      'Water vanishes silently into a precision-milled linear slot drain across a gently inclined plane of warm Roman travertine.',
    image:
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=85',
    featured: true,
  },
  {
    id: 'calacatta-viola-apron-washbasin',
    name: 'Calacatta Viola Deep Apron Washbasin',
    category: 'washbasin',
    categoryLabel: 'Washbasin',
    price: '$3,450',
    subtitle: 'Bold breccia purple-and-cream marble sink with integrated backsplash',
    origin: 'Apuan Alps, Italy',
    finishes: ['Polished', 'Velvet Honed'],
    standardFormat: '75 × 50 × 35 cm',
    thickness: '25mm',
    applications: ['Statement Powder Rooms', 'Dressing Suites', 'Bespoke Vanities'],
    description:
      'Inspired by historic Italian country estate sculleries and elevated for haute interiors with dramatic Calacatta Viola veining and a high scalloped splashback.',
    image:
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=85',
    bookmatched: true,
    featured: true,
  },
  {
    id: 'nero-marquina-ribbed-vessel-washbasin',
    name: 'Nero Marquina Fluted Vessel Washbasin',
    category: 'washbasin',
    categoryLabel: 'Washbasin',
    price: '$1,490',
    subtitle: 'Hand-fluted countertop stone bowl with satin nano-sealed basin',
    origin: 'Markina, Spain',
    finishes: ['Honed Matte', 'Polished Bowl'],
    standardFormat: 'Ø 42 × 16 cm Countertop Vessel',
    thickness: '35mm Carved Rim',
    applications: ['Vanity Consoles', 'Double Master Sinks', 'Executive Restrooms'],
    description:
      'Carved from solid Spanish Nero Marquina with fine exterior vertical reeds and a silky hydrophobic interior bowl.',
    image:
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },
  {
    id: 'honey-onyx-luminous-washbasin',
    name: 'Honey Onyx Translucent Vessel Washbasin',
    category: 'washbasin',
    categoryLabel: 'Washbasin',
    price: '$1,980',
    subtitle: 'Thin-walled crystalline amber onyx basin that glows in warm light',
    origin: 'Yazd & Puebla',
    finishes: ['High-Gloss Polished', 'Satin Honed'],
    standardFormat: '55 × 38 × 15 cm Oval Vessel',
    thickness: '22mm Sculpted Wall',
    applications: ['VIP Powder Rooms', 'Spa Sanctuaries', 'Backlit Vanities'],
    description:
      'Precision-carved from translucent golden onyx so ambient sconce light illuminates the banded mineral strata through the basin walls.',
    image:
      'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },
  {
    id: 'river-boulder-organic-washbasin',
    name: 'Basalt Chiseled Monolith Washbasin',
    category: 'washbasin',
    categoryLabel: 'Washbasin',
    price: '$1,750',
    subtitle: 'Raw split-face volcanic exterior contrasted with velvet-honed bowl',
    origin: 'Central Java & Viterbo',
    finishes: ['Chiseled Exterior', 'Honed Interior'],
    standardFormat: '52 × 44 × 18 cm',
    thickness: 'Solid Boulder Carve',
    applications: ['Zen Bath Suites', 'Outdoor Garden Showers', 'Courtyard Spas'],
    description:
      'Celebrates the raw tension between untouched geological texture on the outer rim and a mirror-smooth water basin within.',
    image:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },

  // ============================================================================
  // 8. OTHER BEAUTIFUL HANDICRAFTS (6 Products)
  // ============================================================================
  {
    id: 'carved-carrara-ruffle-bowl',
    name: 'Hand-Carved Carrara Fluted Centerpiece Bowl',
    category: 'other-beautiful-handicrafts',
    categoryLabel: 'Other Beautiful Handicrafts',
    price: '$680',
    subtitle: 'Artisan-chiseled scalloped waves in solid Bianco Carrara marble',
    origin: 'Pietrasanta, Tuscany, Italy',
    finishes: ['Velvet Honed', 'Hand-Buffed Satin'],
    standardFormat: 'Ø 38 × 12 cm',
    thickness: 'Solid Block Carve',
    applications: ['Dining Table Centerpieces', 'Console Styling', 'Collector Gifts'],
    description:
      'Sculpted by master artisans in Pietrasanta, each ribbon-like flute is hand-finished to capture soft architectural shadows across dining and console tables.',
    image:
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85',
    featured: true,
  },
  {
    id: 'pietra-dura-inlay-vanity-tray',
    name: 'Pietra Dura Mother-of-Pearl & Marble Tray',
    category: 'other-beautiful-handicrafts',
    categoryLabel: 'Other Beautiful Handicrafts',
    price: '$540',
    subtitle: 'Heritage botanical stone marquetry inlaid into Makrana white marble',
    origin: 'Agra & Florence Artisan Guilds',
    finishes: ['Mirror Hand-Polished'],
    standardFormat: '42 × 26 × 3.5 cm',
    thickness: '35mm Carved Rim',
    applications: ['Dressing Tables', 'Hospitality Suites', 'Coffee Table Accents'],
    description:
      'Centuries-old Pietra Dura stone inlay craftsmanship uniting semi-precious lapis, malachite, jasper, and mother-of-pearl in luminous white marble.',
    image:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
    featured: true,
  },
  {
    id: 'alabaster-translucent-table-urn',
    name: 'Volterra Alabaster Sculptural Amphora Vase',
    category: 'other-beautiful-handicrafts',
    categoryLabel: 'Other Beautiful Handicrafts',
    price: '$790',
    subtitle: 'Lathe-turned translucent Tuscan alabaster with organic clouding',
    origin: 'Volterra, Tuscany, Italy',
    finishes: ['Beeswax Satin', 'Natural Translucent'],
    standardFormat: 'Ø 24 × 42 cm',
    thickness: '12mm Turned Wall',
    applications: ['Mantelpiece Styling', 'Pedistal Display', 'Library Shelving'],
    description:
      'Turned from luminous Volterra alabaster prized since Etruscan times for its warm, milk-white translucency and delicate gypsum veins.',
    image:
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },
  {
    id: 'travertine-arch-bookends-pair',
    name: 'Roman Travertine Architectural Arch Bookends',
    category: 'other-beautiful-handicrafts',
    categoryLabel: 'Other Beautiful Handicrafts',
    price: '$420',
    subtitle: 'Monolithic Classical aqueduct arches cut from solid Tivoli stone',
    origin: 'Tivoli, Rome, Italy',
    finishes: ['Open Pore Raw', 'Sawn Matte'],
    standardFormat: 'Set of 2 · 18 × 10 × 22 cm',
    thickness: 'Solid Stone Blocks',
    applications: ['Executive Studies', 'Architectural Bookcases', 'Credenza Styling'],
    description:
      'Heavyweight architectural bookends inspired by Roman colonnades, providing poise and mineral texture to curated art and architecture libraries.',
    image:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85',
    featured: false,
  },
  {
    id: 'calacatta-viola-mortars-and-vessels',
    name: 'Calacatta Viola Carved Incense & Candle Chamber',
    category: 'other-beautiful-handicrafts',
    categoryLabel: 'Other Beautiful Handicrafts',
    price: '$490',
    subtitle: 'Two-piece interlocking sculptural cylinder in breccia marble',
    origin: 'Carrara, Italy',
    finishes: ['Honed Exterior', 'Polished Interior'],
    standardFormat: 'Ø 14 × 18 cm',
    thickness: '20mm Wall',
    applications: ['Meditation Sanctuaries', 'Bath Counters', 'Coffee Tables'],
    description:
      'Precision-turned from richly veined Calacatta Viola offcuts so zero precious quarry stone goes to waste, creating an heirloom tabletop vessel.',
    image:
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=85',
    bookmatched: false,
    featured: false,
  },
  {
    id: 'marble-chess-sculpture-set',
    name: 'Statuario & Marquina Architectural Chess Set',
    category: 'other-beautiful-handicrafts',
    categoryLabel: 'Other Beautiful Handicrafts',
    price: '$1,280',
    subtitle: '32 lathe-turned minimalist stone pieces on an inlaid marble board',
    origin: 'Carrara & Basque Country',
    finishes: ['Velvet Honed Board', 'Weighted Felt-Base Pieces'],
    standardFormat: '44 × 44 × 9 cm Complete Set',
    thickness: '25mm Inlaid Board',
    applications: ['Drawing Rooms', 'Collector Studies', 'Luxury Lounge Tables'],
    description:
      'A collector-grade geometric chess set pairing pure white Italian Statuario and jet-black Spanish Nero Marquina in minimalist architectural silhouettes.',
    image:
      'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=85',
    bookmatched: true,
    featured: true,
  },
];

export const PRODUCTS: Product[] = RAW_PRODUCTS.map(normalizeProductRecord);

