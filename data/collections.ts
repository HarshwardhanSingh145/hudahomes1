export interface Collection {
  id: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  image: string;
  materialsCount: string;
  aspects: string[];
}

export const FEATURED_COLLECTIONS: Collection[] = [
  {
    id: 'marble-edit',
    title: 'The Marble Edit',
    category: 'Curated Selection',
    tagline: 'Rare Italian & Iberian Slabs',
    description:
      'Hand-quarried blocks from Carrara and Valencia. Bookmatched veining calibrated for grand residential pavilions and master suites.',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    materialsCount: '14 Exclusive Slabs',
    aspects: ['Bookmatched symmetry', 'Hand-inspected blocks', 'Mirror & Honed options'],
  },
  {
    id: 'earth-stone',
    title: 'Earth & Stone',
    category: 'Natural Sediment',
    tagline: 'Travertine, Limestone & Slate',
    description:
      'Raw, geological honesty. Sourced from historical European quarries to infuse modern architecture with grounding mineral texture.',
    image:
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85',
    materialsCount: '9 Architectural Stones',
    aspects: ['Open-pore Roman cuts', 'Tactile cleft textures', 'Extreme weather durability'],
  },
  {
    id: 'modern-surfaces',
    title: 'Modern Surfaces',
    category: 'Technical Innovation',
    tagline: 'Grand Format Porcelain & Ceramics',
    description:
      'Ultra-compact sintered surfaces engineered to span 3.2 meters without joints. Zero porosity, unyielding resilience.',
    image:
      'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1200&q=85',
    materialsCount: '18 Grand Formats',
    aspects: ['320 × 160 cm monolithic panels', 'Zero stain absorption', 'Thermal shock proof'],
  },
];
