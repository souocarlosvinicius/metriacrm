export interface Property {
  id?: string;
  _id?: string;
  userId?: string; // Partitioning key
  code?: string; // Unique random code (e.g. IM-XXXX)
  ownerId?: string; // Reference to owner (Client)
  title: string;
  type: string; // 'Apartamento' | 'Casa' | 'Sobrado' | 'Terreno' | 'Comercial'
  condition: string; // 'Novo' | 'Usado'
  description: string;
  modality: string; // 'Venda' | 'Aluguel' | 'Ambos'
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
  status: string; // 'Disponível' | 'Reservado' | 'Em Negociação' | 'Vendido' | 'Alugado' | 'Inativo'
  captadorName?: string;
  captadorPhone?: string;
  estimatedCommission?: number; // Estimated commission in % or absolute BRL
  createdAt?: string;
}

export interface HistoryEntry {
  id?: string;
  type: string; // 'creation' | 'status_change' | 'pipeline_change' | 'whatsapp' | 'task_created' | 'task_completed' | 'visit_scheduled' | 'proposal_sent' | 'observation' | 'loss'
  date: string; // YYYY-MM-DD HH:mm:ss or similar ISO string
  description: string;
  userName?: string;
}

export interface Client {
  id?: string;
  _id?: string;
  userId?: string; // Partitioning key
  clientType?: "PF" | "PJ"; // PF = Pessoa Física, PJ = Pessoa Jurídica
  name: string;
  phone: string;
  document: string;
  email: string;
  profileType: string; // 'Lead' | 'Comprador' | 'Vendedor' | 'Locador' | 'Locatário' | 'Investidor'
  objective: string; // Legacy objective
  leadSource?: string; // 'Indicação' | 'Instagram' | 'Facebook' | 'OLX' | 'Portal Imobiliário' | 'Placa' | 'WhatsApp' | 'Tráfego Pago' | 'Outro'
  interest?: string; // 'Compra' | 'Venda' | 'Locação' | 'Avaliação' | 'Investimento'
  budgetRange?: string; // Faixa de orçamento (e.g. "R$ 300.000 - R$ 500.000")
  neighborhoodOfInterest?: string; // Bairro de interesse
  desiredPropertyType?: string; // Tipo de imóvel desejado (e.g. "Apartamento 3 quartos")
  status: string; // Status de atendimento: 'Novo' | 'Em Atendimento' | 'Proposta' | 'Contrato' | 'Ganho' | 'Perdido'
  temperature?: "Frio" | "Morno" | "Quente"; // Temperature of lead
  nextAction?: string; // Próxima ação a ser realizada
  nextFollowUpDate?: string; // Data do próximo follow-up (YYYY-MM-DD)
  propertyType: string;
  minBudget: number;
  maxBudget: number;
  observations: string;
  birthday?: string; // YYYY-MM-DD
  address?: string; // Client address
  pipelineStatus?: string; // Funnel stage
  linkedPropertyId?: string; // Reference key or MongoDB/Local ID of Property
  createdAt?: string;
  updatedAt?: string; // Track when client stage/status was last modified
  lossReason?: string; // Motivo de perda
  commissionForecast?: number; // Previsão de comissão (BRL)
  commissionPercent?: number; // Porcentagem de comissão (%)
  potentialValue?: number; // Valor potencial do negócio (BRL)
  history?: HistoryEntry[];
}

export interface Proposal {
  id?: string;
  _id?: string;
  userId?: string;
  clientId: string;
  clientName: string;
  propertyId: string;
  propertyTitle: string;
  proposedValue: number;
  status: "Pendente" | "Aceita" | "Recusada" | "Em Análise";
  date: string; // YYYY-MM-DD
  observations: string;
  nextAction?: string;
  createdAt?: string;
}

export interface Visit {
  id?: string;
  _id?: string;
  userId?: string;
  clientId: string;
  clientName: string;
  propertyId: string;
  propertyTitle: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: "Agendada" | "Realizada" | "Cancelada";
  observations: string;
  feedback?: string;
  createdAt?: string;
}

export interface Task {
  id?: string;
  _id?: string;
  userId?: string; // Partitioning key
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  title: string;
  clientId?: string; // Linked client (required for new tasks, optional for legacy)
  clientName: string;
  propertyId?: string; // Linked property, optional
  propertyTitle?: string;
  type: string; // 'Ligar' | 'Enviar WhatsApp' | 'Enviar imóvel' | 'Confirmar visita' | 'Enviar proposta' | 'Cobrar retorno' | 'Documentação' | 'Outro'
  priority?: "baixa" | "média" | "alta"; // Priority
  completed: boolean;
  description: string;
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
  onboardingCompleted?: boolean;
  commercialName?: string;
  creci?: string;
  primaryCity?: string;
  actingType?: "Venda" | "Locação" | "Lançamentos" | "Usados" | "Alto padrão" | "Minha Casa Minha Vida" | "Geral";
}

