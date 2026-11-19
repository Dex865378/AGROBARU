import { BUNDLED_CROP_IMAGES, createInitialsAvatarDataUri } from '../lib/imageFallbacks';

export interface EnterpriseProfile {
  id: string;
  name: string;
  brandName: string;
  category: 'Agroindustria' | 'Exportadora' | 'Insumos & Biocontrol' | 'Logística Fría' | 'Cooperativa';
  corregimiento: string;
  description: string;
  verified: boolean;
  avatar: string;
  phone: string;
  rating: number;
  featuredProducts: string[];
}

export interface FarmerDirectoryProfile {
  id: string;
  name: string;
  farmName: string;
  username: string;
  corregimiento: string;
  primaryCrops: string[];
  areaHectares: number;
  midaRegistration: string;
  reputation: number;
  avatar: string;
  phone: string;
}

export const ENTERPRISE_DIRECTORY: EnterpriseProfile[] = [
  {
    id: 'ENT-01',
    name: 'Productos Lácteos y Agropecuarios La Chiricana S.A.',
    brandName: 'La Chiricana',
    category: 'Agroindustria',
    corregimiento: 'Progreso',
    description: 'Marca insignia de procesamiento de derivados lácteos y apoyo a ganaderos y agricultores en Chiriquí.',
    verified: true,
    avatar: createInitialsAvatarDataUri('La Chiricana'),
    phone: '+507 770-1122',
    rating: 4.95,
    featuredProducts: ['Leche Grado A', 'Queso Artesanal', 'Alimento Balanceado']
  },
  {
    id: 'ENT-02',
    name: 'Cooperativa de Servicios Múltiples Bananeros (COOPASBA R.L.)',
    brandName: 'COOPASBA R.L.',
    category: 'Cooperativa',
    corregimiento: 'Progreso',
    description: 'Cooperativa histórica de pequeños y medianos productores bananeros del Distrito de Barú.',
    verified: true,
    avatar: BUNDLED_CROP_IMAGES.banana,
    phone: '+507 770-9844',
    rating: 4.98,
    featuredProducts: ['Banano Cavendish', 'Plátano Curaré', 'Servicios de Empaque']
  },
  {
    id: 'ENT-03',
    name: 'Exportadora Frutas del Barú & Pacífico S.A.',
    brandName: 'Frutas del Barú',
    category: 'Exportadora',
    corregimiento: 'Puerto Armuelles',
    description: 'Empresa exportadora que consolida contenedores Reefer hacia Europa y Norteamérica con trazabilidad MIDA.',
    verified: true,
    avatar: BUNDLED_CROP_IMAGES.platano,
    phone: '+507 770-4500',
    rating: 4.92,
    featuredProducts: ['Cajas 40lb Banano', 'Contenedores Reefer FOB']
  },
  {
    id: 'ENT-04',
    name: 'BioInsumos Orgánicos del Pacífico',
    brandName: 'BioInsumos Chiriquí',
    category: 'Insumos & Biocontrol',
    corregimiento: 'Baco',
    description: 'Fabricación y suministro de bio-fungicidas preventivos para control de Sigatoka Negra con extractos de Melaleuca y Bacillus.',
    verified: true,
    avatar: BUNDLED_CROP_IMAGES.cacao,
    phone: '+507 6321-9988',
    rating: 4.88,
    featuredProducts: ['Bio-Fungicida Sigatoka 500SL', 'Microorganismos de Montaña']
  },
  {
    id: 'ENT-05',
    name: 'Logística Fría del Pacífico (Barú Reefer Services)',
    brandName: 'Barú Reefer Cold Chain',
    category: 'Logística Fría',
    corregimiento: 'Puerto Armuelles',
    description: 'Flota de camiones refrigerados con termo-registro continuo a 13.5 °C para transporte seguro a muelle FOB.',
    verified: true,
    avatar: createInitialsAvatarDataUri('Barú Reefer'),
    phone: '+507 770-7733',
    rating: 4.96,
    featuredProducts: ['Contenedor 40ft HC', 'Monitoreo Satelital de Frío']
  }
];

export const FARMER_DIRECTORY: FarmerDirectoryProfile[] = [
  {
    id: 'USR-FARMER-01',
    name: 'Don Dionisio Castillo',
    farmName: 'Finca Agroecológica Santa Clara',
    username: '@dionisio_castillo',
    corregimiento: 'Puerto Armuelles',
    primaryCrops: ['Banano Cavendish', 'Plátano Curaré Enano'],
    areaHectares: 14.5,
    midaRegistration: 'MIDA-CH-BARU-2024-0089',
    reputation: 99.4,
    avatar: createInitialsAvatarDataUri('Dionisio Castillo'),
    phone: '+507 6789-1234'
  },
  {
    id: 'USR-FARMER-02',
    name: 'Doña Carmen Rosa Morales',
    farmName: 'Finca Cacaotera Los Limones',
    username: '@carmen_cacao',
    corregimiento: 'Limones',
    primaryCrops: ['Cacao Criollo Fino', 'Plátano Hartón'],
    areaHectares: 8.2,
    midaRegistration: 'MIDA-CH-BARU-2023-0142',
    reputation: 98.9,
    avatar: createInitialsAvatarDataUri('Carmen Morales'),
    phone: '+507 6822-4411'
  },
  {
    id: 'USR-FARMER-04',
    name: 'Demetrio Samudio Quiel',
    farmName: 'Parcela Las Brisas de Baco',
    username: '@demetrio_samudio',
    corregimiento: 'Baco',
    primaryCrops: ['Plátano Hartón', 'Papaya Hawaiana'],
    areaHectares: 12.0,
    midaRegistration: 'MIDA-CH-BARU-2024-0210',
    reputation: 99.1,
    avatar: createInitialsAvatarDataUri('Demetrio Samudio'),
    phone: '+507 6912-3344'
  },
  {
    id: 'USR-FARMER-05',
    name: 'Marcelino Vega',
    farmName: 'Finca El Progreso Frutícola',
    username: '@marcelino_vega',
    corregimiento: 'Progreso',
    primaryCrops: ['Banano Cavendish', 'Cacao'],
    areaHectares: 18.0,
    midaRegistration: 'MIDA-CH-BARU-2024-0312',
    reputation: 99.6,
    avatar: createInitialsAvatarDataUri('Marcelino Vega'),
    phone: '+507 6655-7788'
  },
  {
    id: 'USR-FARMER-06',
    name: 'Carlos Batista',
    farmName: 'Finca Rodolfo Aguilar Delgado',
    username: '@carlos_batista',
    corregimiento: 'Rodolfo Aguilar Delgado',
    primaryCrops: ['Plátano Curaré', 'Palma Aceitera'],
    areaHectares: 22.4,
    midaRegistration: 'MIDA-CH-BARU-2024-0401',
    reputation: 98.4,
    avatar: createInitialsAvatarDataUri('Carlos Batista'),
    phone: '+507 6544-2200'
  }
];
