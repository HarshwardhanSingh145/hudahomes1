export interface ProjectInspiration {
  id: string;
  title: string;
  location: string;
  material: string;
  category: 'Living' | 'Bathroom' | 'Kitchen' | 'Exterior';
  image: string;
  architect?: string;
}

export const INSPIRATION_PROJECTS: ProjectInspiration[] = [
  {
    id: 'proj-1',
    title: 'Villa Bellagio Pavilion',
    location: 'Lake Como, Italy',
    material: 'Statuario Marble & Roman Travertine',
    category: 'Living',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85',
    architect: 'Studio Terragni',
  },
  {
    id: 'proj-2',
    title: 'Highland Sanctuary Bath',
    location: 'St. Moritz, Switzerland',
    material: 'Nero Marquina & Honed Basaltina',
    category: 'Bathroom',
    image:
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1400&q=85',
    architect: 'Kuehn Malvezzi',
  },
  {
    id: 'proj-3',
    title: 'Monolith Residence Island',
    location: 'Kyoto, Japan',
    material: 'Grand Format Porcelain & Minimal Ceramic',
    category: 'Kitchen',
    image:
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1400&q=85',
    architect: 'Kengo Associates',
  },
  {
    id: 'proj-4',
    title: 'Atelier Courtyard Loggia',
    location: 'Mallorca, Spain',
    material: 'Cross-Cut Travertine & French Limestone',
    category: 'Exterior',
    image:
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=85',
    architect: 'Marcos Morales',
  },
  {
    id: 'proj-5',
    title: 'Penthouse Foyer & Gallery',
    location: 'Mayfair, London',
    material: 'Calacatta Borghini & Terrazzo Veneziano',
    category: 'Living',
    image:
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85',
    architect: 'Foster & Partners',
  },
];
