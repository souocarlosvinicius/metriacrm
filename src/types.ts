export interface Property {
  id?: string;
  _id?: string;
  code?: string; // Unique random code (e.g. IM-XXXX)
  ownerId?: string; // Reference to owner (Client)
  title: string;
  type: string; // 'Apartamento' | 'Casa' | 'Sobrado' | 'Terreno' | 'Comercial'
  condition: string; // 'Novo' | 'Usado'
  description: string;
  modality: string; // 'Venda' | 'Aluguel' | 'Temporada'
  price: number;
  condo: number;
  iptu: number;
  address: string;
  neighborhood: string;
  city: string;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  parkingSpots: number;
  area: number;
  builtArea?: number;
  constructionYear?: number;
  floor?: string;
  sunPosition?: string;
  documentStatus?: string;
  financialStatus?: string; // 'quitado' | 'em financiamento' | 'não definida'
  acceptsExchange?: boolean;
  photos: string[];
  videoLink?: string; // YouTube or social media post link
  amenities: string[];
  status: string; // 'DISPONÍVEL' | 'EM PROPOSTA' | 'VENDIDO' | 'ALUGADO'
  captadorName?: string;
  captadorPhone?: string;
  createdAt?: string;
}

export interface Client {
  id?: string;
  _id?: string;
  clientType?: "PF" | "PJ"; // PF = Pessoa Física, PJ = Pessoa Jurídica
  name: string;
  phone: string;
  document: string;
  email: string;
  profileType: string; // 'Lead' | 'Comprador' | 'Locatário' | 'Proprietário'
  objective: string; // 'Venda' | 'Aluguel' | 'Temporada'
  propertyType: string;
  minBudget: number;
  maxBudget: number;
  observations: string;
  status: string; // 'Novo' | 'Em Atendimento' | 'Proposta' | 'Ganho' | 'Perdido'
  birthday?: string; // YYYY-MM-DD
  address?: string; // Client address
  pipelineStatus?: string; // Funnel stage: Em Atendimento, Em Visita, Em Proposta, Fase de Contrato, Contrato Assinado, Fase de Documentação, Finalização do Processo
  linkedPropertyId?: string; // Reference key or MongoDB/Local ID of Property
  createdAt?: string;
}

export interface Task {
  id?: string;
  _id?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  title: string;
  clientName: string;
  description: string;
  type: string; // 'VISITA' | 'FOLLOW-UP' | 'CONTRATO' | 'OUTRO'
  completed: boolean;
  propertyTitle?: string;
  createdAt?: string;
}

export interface DBStatus {
  dbType: string;
  mongoActive: boolean;
  geminiActive: boolean;
}

export interface User {
  id?: string;
  _id?: string;
  username: string;
  name: string;
  email: string;
  avatarUrl: string;
  role?: string;
  phone?: string;
}

