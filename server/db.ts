import { MongoClient, Db, ObjectId } from "mongodb";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { hashPassword, verifyPassword } from "./crypto.js";

export interface Property {
  id?: string;
  _id?: any;
  userId?: string;
  code?: string;
  ownerId?: string;
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
  videoLink?: string;
  amenities: string[];
  status: string; // 'Disponível' | 'Reservado' | 'Em Negociação' | 'Vendido' | 'Alugado' | 'Inativo'
  captadorName?: string;
  captadorPhone?: string;
  estimatedCommission?: number;
  createdAt: string;
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
  _id?: any;
  userId?: string;
  clientType?: "PF" | "PJ";
  name: string;
  phone: string;
  document: string;
  email: string;
  profileType: string; // 'Lead' | 'Comprador' | 'Vendedor' | 'Locador' | 'Locatário' | 'Investidor'
  objective: string; // Legacy objective
  leadSource?: string;
  interest?: string;
  budgetRange?: string;
  neighborhoodOfInterest?: string;
  desiredPropertyType?: string;
  status: string; // 'Novo' | 'Em Atendimento' | 'Proposta' | 'Contrato' | 'Ganho' | 'Perdido'
  temperature?: "Frio" | "Morno" | "Quente";
  nextAction?: string;
  nextFollowUpDate?: string;
  propertyType: string;
  minBudget: number;
  maxBudget: number;
  observations: string;
  birthday?: string; // YYYY-MM-DD
  address?: string;
  pipelineStatus?: string;
  linkedPropertyId?: string;
  createdAt: string;
  lossReason?: string;
  commissionForecast?: number;
  commissionPercent?: number;
  potentialValue?: number;
  history?: HistoryEntry[];
}

export interface Proposal {
  id?: string;
  _id?: any;
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
  createdAt: string;
}

export interface Visit {
  id?: string;
  _id?: any;
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
  createdAt: string;
}

export interface Task {
  id?: string;
  _id?: any;
  userId?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  title: string;
  clientId?: string;
  clientName: string;
  propertyId?: string;
  propertyTitle?: string;
  type: string; // 'Ligar' | 'Enviar WhatsApp' | 'Enviar imóvel' | 'Confirmar visita' | 'Enviar proposta' | 'Cobrar retorno' | 'Documentação' | 'Outro'
  priority?: "baixa" | "média" | "alta";
  completed: boolean;
  description: string;
  createdAt: string;
}

export interface User {
  id?: string;
  _id?: any;
  username: string;
  password?: string;
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


const LOCAL_DB_DIR = path.join(process.cwd(), "data");
const LOCAL_DB_PATH = path.join(LOCAL_DB_DIR, "db.json");

// Default high-quality real estate mock data in Portuguese (matching the original screenshots)
const defaultProperties: Property[] = [
  {
    title: "Apartamento em Ipanema",
    type: "Apartamento",
    condition: "Usado",
    description: "Excelente apartamento em Ipanema, a poucos metros da praia. Totalmente reformado, com acabamentos premium, piso em taco original restaurado, ar-condicionado em todos os cômodos e armários planejados de altíssima qualidade. Living espaçoso com iluminação planejada, copa-cozinha equipada e área de serviço completa com dependências.",
    modality: "Venda",
    price: 2450000,
    condo: 1200,
    iptu: 350,
    address: "Avenida Vieira Souto, 320",
    neighborhood: "Ipanema",
    city: "Rio de Janeiro / RJ",
    bedrooms: 3,
    suites: 1,
    bathrooms: 3,
    parkingSpots: 2,
    area: 110,
    builtArea: 100,
    photos: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Portaria 24h", "Salão de Festas", "Churrasqueira"],
    status: "DISPONÍVEL",
    captadorName: "Carlos Eduardo",
    captadorPhone: "(11) 98765-4321",
    createdAt: new Date().toISOString()
  },
  {
    title: "Loft Vila Madalena",
    type: "Apartamento",
    condition: "Novo",
    description: "Charmoso loft duplex na Vila Madalena, com arquitetura industrial moderna, pé-direito duplo e paredes de tijolo aparente. Grandes janelas de ferro proporcionam luz natural abundante durante todo o dia. Totalmente mobiliado com móveis de design e decoração contemporânea sofisticada. Ideal para solteiros ou casais jovens que buscam estilo e praticidade.",
    modality: "Aluguel",
    price: 8500,
    condo: 800,
    iptu: 150,
    address: "Rua Aspicuelta, 450",
    neighborhood: "Vila Madalena",
    city: "São Paulo / SP",
    bedrooms: 1,
    suites: 1,
    bathrooms: 2,
    parkingSpots: 1,
    area: 65,
    builtArea: 65,
    photos: [
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Academia", "Churrasqueira", "Piscina", "Portaria 24h"],
    status: "EM PROPOSTA",
    captadorName: "Carlos Eduardo",
    captadorPhone: "(11) 98765-4321",
    createdAt: new Date().toISOString()
  },
  {
    title: "Casa de Praia Búzios",
    type: "Casa",
    condition: "Usado",
    description: "Casa espetacular em condomínio fechado na Praia de Geribá. Projeto arquitetônico moderno que integra perfeitamente as áreas internas e externas. Possui uma linda piscina de borda infinita integrada à área de churrasqueira, deck de madeira, sauna úmida e paisagismo tropical impecável. Vista privilegiada e segurança 24 horas.",
    modality: "Venda",
    price: 4200000,
    condo: 1800,
    iptu: 600,
    address: "Condomínio Geribá Hills, Casa 12",
    neighborhood: "Geribá",
    city: "Armação dos Búzios / RJ",
    bedrooms: 5,
    suites: 4,
    bathrooms: 6,
    parkingSpots: 4,
    area: 320,
    builtArea: 240,
    photos: [
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Piscina", "Churrasqueira", "Playground", "Portaria 24h"],
    status: "DISPONÍVEL",
    createdAt: new Date().toISOString()
  },
  {
    title: "Cobertura Duplex no Leblon",
    type: "Apartamento",
    condition: "Usado",
    description: "Cobertura espetacular no Leblon com vista panorâmica para o Cristo Redentor e para a Lagoa. Primeiro pavimento com living em 3 ambientes, varanda integrada, 3 amplas suítes com closets e copa-cozinha planejada. Segundo pavimento com salão multiuso, home theater, lavabo, sauna e excelente terraço privativo com piscina e área gourmet completa.",
    modality: "Venda",
    price: 12500000,
    condo: 3500,
    iptu: 1200,
    address: "Rua Cupertino Durão, 140",
    neighborhood: "Leblon",
    city: "Rio de Janeiro / RJ",
    bedrooms: 4,
    suites: 3,
    bathrooms: 5,
    parkingSpots: 3,
    area: 280,
    builtArea: 220,
    photos: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Piscina", "Churrasqueira", "Salão de Festas", "Portaria 24h"],
    status: "DISPONÍVEL",
    createdAt: new Date().toISOString()
  },
  {
    title: "Casa de Campo em Atibaia",
    type: "Casa",
    condition: "Usado",
    description: "Belíssima casa de campo em Atibaia, ideal para quem busca paz, conforto e contato direto com a natureza. Localizada em condomínio de alto padrão, conta com pomar privativo, quadra de tênis de saibro, piscina aquecida, espaço gourmet com forno de pizza a lenha, lareira e amplas suítes com vista para as montanhas.",
    modality: "Temporada",
    price: 1500, // R$ 1.500 por dia
    condo: 900,
    iptu: 250,
    address: "Condomínio Estância das Flores, Gleba B",
    neighborhood: "Estância",
    city: "Atibaia / SP",
    bedrooms: 4,
    suites: 4,
    bathrooms: 5,
    parkingSpots: 6,
    area: 450,
    builtArea: 350,
    photos: [
      "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Piscina", "Churrasqueira", "Playground", "Academia", "Portaria 24h"],
    status: "DISPONÍVEL",
    createdAt: new Date().toISOString()
  }
];

// Helper to generate dynamic birthdays
const getBirthdayRelative = (days: number, birthYear = 1990): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${birthYear}-${m}-${day}`;
};

const defaultClients: Client[] = [
  {
    name: "Ana Carolina Silva",
    phone: "(21) 98112-4455",
    document: "124.556.789-01",
    email: "carol.silva@outlook.com",
    profileType: "Lead",
    objective: "Venda",
    propertyType: "Apartamento",
    minBudget: 2000000,
    maxBudget: 3000000,
    observations: "Procura apartamento de 3 quartos em Ipanema ou Leblon com vaga de garagem. Prefere andar alto.",
    status: "Novo",
    birthday: getBirthdayRelative(0, 1993), // HOJE
    createdAt: new Date().toISOString()
  },
  {
    name: "Ricardo Menezes",
    phone: "(11) 99344-2233",
    document: "235.667.112-34",
    email: "ricardo.menezes@gmail.com",
    profileType: "Comprador",
    objective: "Aluguel",
    propertyType: "Apartamento",
    minBudget: 7000,
    maxBudget: 10000,
    observations: "Aguardando aprovação de proposta de aluguel no Loft da Vila Madalena. Fiador já validado.",
    status: "Proposta",
    birthday: getBirthdayRelative(1, 1988), // AMANHÃ
    createdAt: new Date().toISOString()
  },
  {
    name: "Beatriz Oliveira",
    phone: "(21) 98877-6655",
    document: "099.334.556-21",
    email: "beatriz.oliveira@uol.com.br",
    profileType: "Lead",
    objective: "Venda",
    propertyType: "Apartamento",
    minBudget: 1500000,
    maxBudget: 2200000,
    observations: "Lead qualificado. Buscando apartamento de 2 ou 3 dormitórios próximo ao metrô no Flamengo ou Botafogo.",
    status: "Em Atendimento",
    birthday: getBirthdayRelative(3, 1995), // EM 3 DIAS
    createdAt: new Date().toISOString()
  },
  {
    name: "João Pedro Fonseca",
    phone: "(11) 97112-9988",
    document: "110.223.334-55",
    email: "jp.fonseca@metalurgica.com.br",
    profileType: "Proprietário",
    objective: "Venda",
    propertyType: "Comercial",
    minBudget: 0,
    maxBudget: 0,
    observations: "Dono de galpão industrial na Lapa para venda direta ou locação de longo prazo.",
    status: "Novo",
    createdAt: new Date().toISOString()
  },
  {
    name: "Mariana Santos",
    phone: "(11) 99112-3344",
    document: "321.456.987-99",
    email: "mari.santos.adv@gmail.com",
    profileType: "Locatário",
    objective: "Aluguel",
    propertyType: "Casa",
    minBudget: 5000,
    maxBudget: 8000,
    observations: "Visita agendada em casa de condomínio fechado em Alphaville. Família com dois pets.",
    status: "Em Atendimento",
    birthday: getBirthdayRelative(4, 1990), // EM 4 DIAS (não aparece no lembrete de 3 dias)
    createdAt: new Date().toISOString()
  }
];

// Helper to generate dynamic dates around today
const getOffsetDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

const defaultTasks: Task[] = [
  {
    date: getOffsetDate(0), // HOJE
    time: "09:00",
    title: "Visita: Cobertura Leblon",
    clientName: "Ricardo Albuquerque",
    description: "Apresentação detalhada da cobertura duplex, com foco no terraço privativo e área de lazer.",
    type: "VISITA",
    completed: true,
    propertyTitle: "Cobertura Duplex no Leblon",
    createdAt: new Date().toISOString()
  },
  {
    date: getOffsetDate(0), // HOJE
    time: "10:30",
    title: "Follow-up: Reserva Prime",
    clientName: "Beatriz Oliveira",
    description: "Ligar para verificar a proposta de compra enviada na semana passada. Tirar dúvidas tributárias.",
    type: "FOLLOW-UP",
    completed: false,
    propertyTitle: "Apartamento em Ipanema",
    createdAt: new Date().toISOString()
  },
  {
    date: getOffsetDate(0), // HOJE
    time: "14:00",
    title: "Assinatura de Contrato",
    clientName: "Ricardo Menezes",
    description: "Assinatura digital de contrato de locação do Loft Vila Madalena. Sala 402 - Escritório Central.",
    type: "CONTRATO",
    completed: false,
    propertyTitle: "Loft Vila Madalena",
    createdAt: new Date().toISOString()
  },
  {
    date: getOffsetDate(0), // HOJE
    time: "16:30",
    title: "Visita: Terreno Barra",
    clientName: "Família Costa",
    description: "Clientes interessados em lote plano de 600m² para construção residencial unifamiliar.",
    type: "VISITA",
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    date: getOffsetDate(1), // AMANHÃ
    time: "10:00",
    title: "Visita: Casa Condomínio Alpha",
    clientName: "Maria Souza",
    description: "Apresentar casa moderna de 4 suítes. Cliente preza muito por segurança e área comum de lazer.",
    type: "VISITA",
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    date: getOffsetDate(2), // EM 2 DIAS
    time: "16:00",
    title: "Vistoria: Loft Vila Madalena",
    clientName: "João Victor (Vistoriador)",
    description: "Realizar vistoria de entrada com fotos detalhadas do imóvel e do inventário.",
    type: "OUTRO",
    completed: false,
    propertyTitle: "Loft Vila Madalena",
    createdAt: new Date().toISOString()
  }
];

const defaultUsers: User[] = [
  {
    username: "vega",
    password: "123",
    name: "Carlos Eduardo",
    email: "carlos@metriacrm.com",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    role: "Corretor Sênior",
    phone: "(11) 98765-4321"
  }
];

class DatabaseConnection {
  private mongoClient: MongoClient | null = null;
  private db: Db | null = null;
  private isUsingMongo: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      try {
        console.log("Detectado MONGODB_URI. Tentando conectar ao MongoDB Atlas...");
        this.mongoClient = new MongoClient(mongoUri);
        await this.mongoClient.connect();
        this.db = this.mongoClient.db(process.env.MONGODB_DB_NAME || "prop_crm_db");
        this.isUsingMongo = true;
        console.log("Conectado com sucesso ao MongoDB Atlas!");

        // Seed data in MongoDB if collections are empty
        await this.seedMongoIfEmpty();
      } catch (err) {
        console.error("Falha ao conectar no MongoDB Atlas, revertendo para banco JSON local.", err);
        this.isUsingMongo = false;
        this.ensureLocalDbExists();
      }
    } else {
      console.log("Nenhum MONGODB_URI configurado. Utilizando banco de dados local JSON.");
      this.isUsingMongo = false;
      this.ensureLocalDbExists();
    }
  }

  private ensureLocalDbExists() {
    if (!fs.existsSync(LOCAL_DB_DIR)) {
      fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      const initialDbState = {
        properties: defaultProperties,
        clients: defaultClients,
        tasks: defaultTasks,
        users: defaultUsers,
      };
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialDbState, null, 2), "utf8");
      console.log("Banco de dados local JSON criado e semeado com dados padrão em:", LOCAL_DB_PATH);
    } else {
      // Ensure users field exists
      try {
        const content = fs.readFileSync(LOCAL_DB_PATH, "utf8");
        const parsed = JSON.parse(content);
        if (!parsed.users) {
          parsed.users = defaultUsers;
          fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(parsed, null, 2), "utf8");
        }
      } catch (err) {
        console.error("Erro ao validar campo users no db.json:", err);
      }
    }
  }

  private async seedMongoIfEmpty() {
    if (!this.db) return;
    
    // Properties seed
    const propertiesColl = this.db.collection("properties");
    const propCount = await propertiesColl.countDocuments();
    if (propCount === 0) {
      await propertiesColl.insertMany(defaultProperties);
      console.log("Seeding inicial de Imóveis realizado no MongoDB Atlas.");
    }

    // Clients seed
    const clientsColl = this.db.collection("clients");
    const clientCount = await clientsColl.countDocuments();
    if (clientCount === 0) {
      await clientsColl.insertMany(defaultClients);
      console.log("Seeding inicial de Clientes realizado no MongoDB Atlas.");
    }

    // Tasks seed
    const tasksColl = this.db.collection("tasks");
    const taskCount = await tasksColl.countDocuments();
    if (taskCount === 0) {
      await tasksColl.insertMany(defaultTasks);
      console.log("Seeding inicial de Tarefas realizado no MongoDB Atlas.");
    }

    // Users seed
    const usersColl = this.db.collection("users");
    const userCount = await usersColl.countDocuments();
    if (userCount === 0) {
      await usersColl.insertMany(defaultUsers);
      console.log("Seeding inicial de Usuários realizado no MongoDB Atlas.");
    }
  }

  // Generic read methods
  private readLocalJson(): { properties: Property[]; clients: Client[]; tasks: Task[]; users: User[]; proposals: Proposal[]; visits: Visit[] } {
    this.ensureLocalDbExists();
    try {
      const content = fs.readFileSync(LOCAL_DB_PATH, "utf8");
      const parsed = JSON.parse(content);
      return {
        properties: parsed.properties || [],
        clients: parsed.clients || [],
        tasks: parsed.tasks || [],
        users: parsed.users || defaultUsers,
        proposals: parsed.proposals || [],
        visits: parsed.visits || [],
      };
    } catch (e) {
      console.error("Erro lendo db.json local:", e);
      return { properties: [], clients: [], tasks: [], users: defaultUsers, proposals: [], visits: [] };
    }
  }

  private writeLocalJson(data: { properties: Property[]; clients: Client[]; tasks: Task[]; users?: User[]; proposals?: Proposal[]; visits?: Visit[] }) {
    this.ensureLocalDbExists();
    try {
      const existing = this.readLocalJson();
      const payload = {
        properties: data.properties,
        clients: data.clients,
        tasks: data.tasks,
        users: data.users || existing.users || defaultUsers,
        proposals: data.proposals || existing.proposals || [],
        visits: data.visits || existing.visits || [],
      };
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(payload, null, 2), "utf8");
    } catch (e) {
      console.error("Erro salvando no db.json local:", e);
    }
  }

  // Public Methods
  public isMongoActive(): boolean {
    return this.isUsingMongo;
  }

  // --- SESSIONS ---
  private sessions = new Map<string, { userId: string; expiresAt: number }>();

  public createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    this.sessions.set(token, { userId, expiresAt });
    return token;
  }

  public getSession(token: string): { userId: string } | null {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }
    return { userId: session.userId };
  }

  public deleteSession(token: string): void {
    this.sessions.delete(token);
  }

  // --- SEED USER WORKSPACE ---
  public async seedUserItems(userId: string): Promise<void> {
    const userProperties = defaultProperties.map((p, idx) => ({
      ...p,
      userId,
      code: `IM-${1000 + idx * 23 + Math.floor(Math.random() * 8000)}`,
      createdAt: new Date().toISOString()
    }));

    const userClients = defaultClients.map((c) => ({
      ...c,
      userId,
      createdAt: new Date().toISOString()
    }));

    const userTasks = defaultTasks.map((t) => ({
      ...t,
      userId,
      createdAt: new Date().toISOString()
    }));

    if (this.isUsingMongo && this.db) {
      try {
        await this.db.collection("properties").insertMany(userProperties);
        await this.db.collection("clients").insertMany(userClients);
        await this.db.collection("tasks").insertMany(userTasks);
      } catch (err) {
        console.error("Erro ao semear dados do usuário no MongoDB:", err);
      }
    } else {
      const data = this.readLocalJson();
      const userPropertiesWithIds = userProperties.map(p => ({
        ...p,
        id: Math.random().toString(36).substring(2, 11)
      }));
      const userClientsWithIds = userClients.map(c => ({
        ...c,
        id: Math.random().toString(36).substring(2, 11)
      }));
      const userTasksWithIds = userTasks.map(t => ({
        ...t,
        id: Math.random().toString(36).substring(2, 11)
      }));

      data.properties.push(...userPropertiesWithIds);
      data.clients.push(...userClientsWithIds);
      data.tasks.push(...userTasksWithIds);
      this.writeLocalJson(data);
    }
  }

  // --- PROPERTIES ---
  public async getProperties(userId: string): Promise<Property[]> {
    let properties: Property[] = [];
    if (this.isUsingMongo && this.db) {
      const list = await this.db.collection("properties").find({
        $or: [
          { userId: userId },
          { userId: { $exists: false } }
        ]
      }).toArray();
      properties = list.map((item: any) => ({
        ...item,
        id: item._id.toString(),
      })) as Property[];

      // Filter legacy data if the user is not vega
      if (userId !== "user-1" && userId !== "vega") {
        properties = properties.filter(p => p.userId === userId);
      }
    } else {
      const data = this.readLocalJson();
      properties = data.properties.filter(p => p.userId === userId || (!p.userId && (userId === "user-1" || userId === "vega")));
    }

    // Ensure all properties have a unique code (e.g. IM-1234)
    let changed = false;
    const updated = properties.map((p, idx) => {
      if (!p.code) {
        const randomNum = 1000 + (idx * 23) + Math.floor(Math.random() * 8000);
        p.code = `IM-${randomNum}`;
        changed = true;
      }
      return p;
    });

    if (changed && !this.isUsingMongo) {
      const data = this.readLocalJson();
      // Merge unique codes back to master database JSON
      data.properties = data.properties.map(p => {
        const found = updated.find(u => u.id === p.id);
        return found || p;
      });
      this.writeLocalJson(data);
    }
    return updated;
  }

  public async getPropertyById(id: string, userId: string): Promise<Property | null> {
    const list = await this.getProperties(userId);
    return list.find((p) => p.id === id || p._id?.toString() === id) || null;
  }

  public async addProperty(prop: Omit<Property, "id">, userId: string): Promise<Property> {
    let code = prop.code;
    if (!code) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      code = `IM-${randomNum}`;
    }

    const newProp: Property = {
      ...prop,
      userId,
      code,
      status: prop.status || "DISPONÍVEL",
      createdAt: prop.createdAt || new Date().toISOString(),
    };

    if (this.isUsingMongo && this.db) {
      const result = await this.db.collection("properties").insertOne(newProp);
      const inserted = { ...newProp, id: result.insertedId.toString() };
      return inserted;
    } else {
      const data = this.readLocalJson();
      const generatedId = Math.random().toString(36).substring(2, 11);
      const inserted = { ...newProp, id: generatedId };
      data.properties.push(inserted);
      this.writeLocalJson(data);
      return inserted;
    }
  }

  public async updateProperty(id: string, updates: Partial<Property>, userId: string): Promise<Property | null> {
    if (this.isUsingMongo && this.db) {
      const filterQuery: any = { _id: new ObjectId(id) };
      if (userId !== "user-1" && userId !== "vega") {
        filterQuery.userId = userId;
      }
      await this.db.collection("properties").updateOne(
        filterQuery,
        { $set: updates }
      );
      return this.getPropertyById(id, userId);
    } else {
      const data = this.readLocalJson();
      const idx = data.properties.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      
      // Verify owner
      const item = data.properties[idx];
      const isOwner = item.userId === userId || (!item.userId && (userId === "user-1" || userId === "vega"));
      if (!isOwner) return null;

      data.properties[idx] = { ...data.properties[idx], ...updates };
      this.writeLocalJson(data);
      return data.properties[idx];
    }
  }

  public async deleteProperty(id: string, userId: string): Promise<boolean> {
    if (this.isUsingMongo && this.db) {
      const filterQuery: any = { _id: new ObjectId(id) };
      if (userId !== "user-1" && userId !== "vega") {
        filterQuery.userId = userId;
      }
      const res = await this.db.collection("properties").deleteOne(filterQuery);
      return res.deletedCount > 0;
    } else {
      const data = this.readLocalJson();
      const idx = data.properties.findIndex((p) => p.id === id);
      if (idx === -1) return false;

      const item = data.properties[idx];
      const isOwner = item.userId === userId || (!item.userId && (userId === "user-1" || userId === "vega"));
      if (!isOwner) return false;

      data.properties.splice(idx, 1);
      this.writeLocalJson(data);
      return true;
    }
  }

  // --- CLIENTS ---
  public async getClients(userId: string): Promise<Client[]> {
    let clients: Client[] = [];
    if (this.isUsingMongo && this.db) {
      const list = await this.db.collection("clients").find({
        $or: [
          { userId: userId },
          { userId: { $exists: false } }
        ]
      }).toArray();
      clients = list.map((item: any) => ({
        ...item,
        id: item._id.toString(),
      })) as Client[];

      if (userId !== "user-1" && userId !== "vega") {
        clients = clients.filter(c => c.userId === userId);
      }
    } else {
      const data = this.readLocalJson();
      clients = data.clients.filter(c => c.userId === userId || (!c.userId && (userId === "user-1" || userId === "vega")));
    }
    return clients;
  }

  public async getClientById(id: string, userId: string): Promise<Client | null> {
    const list = await this.getClients(userId);
    return list.find((c) => c.id === id || c._id?.toString() === id) || null;
  }

  public async addClient(client: Omit<Client, "id">, userId: string): Promise<Client> {
    const newClient: Client = {
      ...client,
      userId,
      status: client.status || "Novo",
      createdAt: client.createdAt || new Date().toISOString(),
      history: client.history || [
        {
          id: Math.random().toString(36).substring(2, 11),
          type: "creation",
          date: new Date().toISOString(),
          description: "Lead criado no sistema",
        }
      ],
    };

    if (this.isUsingMongo && this.db) {
      const result = await this.db.collection("clients").insertOne(newClient);
      return { ...newClient, id: result.insertedId.toString() };
    } else {
      const data = this.readLocalJson();
      const generatedId = Math.random().toString(36).substring(2, 11);
      const inserted = { ...newClient, id: generatedId };
      data.clients.push(inserted);
      this.writeLocalJson(data);
      return inserted;
    }
  }

  public async updateClient(id: string, updates: Partial<Client>, userId: string): Promise<Client | null> {
    if (this.isUsingMongo && this.db) {
      const filterQuery: any = { _id: new ObjectId(id) };
      if (userId !== "user-1" && userId !== "vega") {
        filterQuery.userId = userId;
      }
      await this.db.collection("clients").updateOne(
        filterQuery,
        { $set: updates }
      );
      return this.getClientById(id, userId);
    } else {
      const data = this.readLocalJson();
      const idx = data.clients.findIndex((c) => c.id === id);
      if (idx === -1) return null;

      const item = data.clients[idx];
      const isOwner = item.userId === userId || (!item.userId && (userId === "user-1" || userId === "vega"));
      if (!isOwner) return null;

      data.clients[idx] = { ...data.clients[idx], ...updates };
      this.writeLocalJson(data);
      return data.clients[idx];
    }
  }

  public async deleteClient(id: string, userId: string): Promise<boolean> {
    if (this.isUsingMongo && this.db) {
      const filterQuery: any = { _id: new ObjectId(id) };
      if (userId !== "user-1" && userId !== "vega") {
        filterQuery.userId = userId;
      }
      const res = await this.db.collection("clients").deleteOne(filterQuery);
      return res.deletedCount > 0;
    } else {
      const data = this.readLocalJson();
      const idx = data.clients.findIndex((c) => c.id === id);
      if (idx === -1) return false;

      const item = data.clients[idx];
      const isOwner = item.userId === userId || (!item.userId && (userId === "user-1" || userId === "vega"));
      if (!isOwner) return false;

      data.clients.splice(idx, 1);
      this.writeLocalJson(data);
      return true;
    }
  }

  // --- TASKS ---
  public async getTasks(userId: string): Promise<Task[]> {
    let tasks: Task[] = [];
    if (this.isUsingMongo && this.db) {
      const list = await this.db.collection("tasks").find({
        $or: [
          { userId: userId },
          { userId: { $exists: false } }
        ]
      }).toArray();
      tasks = list.map((item: any) => ({
        ...item,
        id: item._id.toString(),
      })) as Task[];

      if (userId !== "user-1" && userId !== "vega") {
        tasks = tasks.filter(t => t.userId === userId);
      }
    } else {
      const data = this.readLocalJson();
      tasks = data.tasks.filter(t => t.userId === userId || (!t.userId && (userId === "user-1" || userId === "vega")));
    }
    return tasks;
  }

  public async addTask(task: Omit<Task, "id">, userId: string): Promise<Task> {
    const newTask: Task = {
      ...task,
      userId,
      completed: task.completed ?? false,
      createdAt: task.createdAt || new Date().toISOString(),
    };

    if (this.isUsingMongo && this.db) {
      const result = await this.db.collection("tasks").insertOne(newTask);
      return { ...newTask, id: result.insertedId.toString() };
    } else {
      const data = this.readLocalJson();
      const generatedId = Math.random().toString(36).substring(2, 11);
      const inserted = { ...newTask, id: generatedId };
      data.tasks.push(inserted);
      this.writeLocalJson(data);
      return inserted;
    }
  }

  public async updateTask(id: string, updates: Partial<Task>, userId: string): Promise<Task | null> {
    if (this.isUsingMongo && this.db) {
      const filterQuery: any = { _id: new ObjectId(id) };
      if (userId !== "user-1" && userId !== "vega") {
        filterQuery.userId = userId;
      }
      await this.db.collection("tasks").updateOne(
        filterQuery,
        { $set: updates }
      );
      // Retrieve task
      const list = await this.getTasks(userId);
      return list.find((t) => t.id === id || t._id?.toString() === id) || null;
    } else {
      const data = this.readLocalJson();
      const idx = data.tasks.findIndex((t) => t.id === id);
      if (idx === -1) return null;

      const item = data.tasks[idx];
      const isOwner = item.userId === userId || (!item.userId && (userId === "user-1" || userId === "vega"));
      if (!isOwner) return null;

      data.tasks[idx] = { ...data.tasks[idx], ...updates };
      this.writeLocalJson(data);
      return data.tasks[idx];
    }
  }

  public async deleteTask(id: string, userId: string): Promise<boolean> {
    if (this.isUsingMongo && this.db) {
      const filterQuery: any = { _id: new ObjectId(id) };
      if (userId !== "user-1" && userId !== "vega") {
        filterQuery.userId = userId;
      }
      const res = await this.db.collection("tasks").deleteOne(filterQuery);
      return res.deletedCount > 0;
    } else {
      const data = this.readLocalJson();
      const idx = data.tasks.findIndex((t) => t.id === id);
      if (idx === -1) return false;

      const item = data.tasks[idx];
      const isOwner = item.userId === userId || (!item.userId && (userId === "user-1" || userId === "vega"));
      if (!isOwner) return false;

      data.tasks.splice(idx, 1);
      this.writeLocalJson(data);
      return true;
    }
  }

  // --- PROPOSALS ---
  public async getProposals(userId: string): Promise<Proposal[]> {
    let proposals: Proposal[] = [];
    if (this.isUsingMongo && this.db) {
      const list = await this.db.collection("proposals").find({
        $or: [
          { userId: userId },
          { userId: { $exists: false } }
        ]
      }).toArray();
      proposals = list.map((item: any) => ({
        ...item,
        id: item._id.toString(),
      })) as Proposal[];

      if (userId !== "user-1" && userId !== "vega") {
        proposals = proposals.filter(p => p.userId === userId);
      }
    } else {
      const data = this.readLocalJson();
      proposals = data.proposals.filter(p => p.userId === userId || (!p.userId && (userId === "user-1" || userId === "vega")));
    }
    return proposals;
  }

  public async addProposal(proposal: Omit<Proposal, "id">, userId: string): Promise<Proposal> {
    const inserted: Proposal = {
      ...proposal,
      userId,
      createdAt: new Date().toISOString()
    } as Proposal;

    if (this.isUsingMongo && this.db) {
      const res = await this.db.collection("proposals").insertOne(inserted);
      return {
        ...inserted,
        id: res.insertedId.toString()
      };
    } else {
      const data = this.readLocalJson();
      inserted.id = Math.random().toString(36).substring(2, 11);
      data.proposals.push(inserted);
      this.writeLocalJson(data);
      return inserted;
    }
  }

  public async updateProposal(id: string, updates: Partial<Proposal>, userId: string): Promise<Proposal | null> {
    if (this.isUsingMongo && this.db) {
      const filterQuery: any = { _id: new ObjectId(id) };
      if (userId !== "user-1" && userId !== "vega") {
        filterQuery.userId = userId;
      }
      await this.db.collection("proposals").updateOne(
        filterQuery,
        { $set: updates }
      );
      const list = await this.getProposals(userId);
      return list.find((p) => p.id === id || p._id?.toString() === id) || null;
    } else {
      const data = this.readLocalJson();
      const idx = data.proposals.findIndex((p) => p.id === id);
      if (idx === -1) return null;

      const item = data.proposals[idx];
      const isOwner = item.userId === userId || (!item.userId && (userId === "user-1" || userId === "vega"));
      if (!isOwner) return null;

      data.proposals[idx] = { ...data.proposals[idx], ...updates };
      this.writeLocalJson(data);
      return data.proposals[idx];
    }
  }

  public async deleteProposal(id: string, userId: string): Promise<boolean> {
    if (this.isUsingMongo && this.db) {
      const filterQuery: any = { _id: new ObjectId(id) };
      if (userId !== "user-1" && userId !== "vega") {
        filterQuery.userId = userId;
      }
      const res = await this.db.collection("proposals").deleteOne(filterQuery);
      return res.deletedCount > 0;
    } else {
      const data = this.readLocalJson();
      const idx = data.proposals.findIndex((p) => p.id === id);
      if (idx === -1) return false;

      const item = data.proposals[idx];
      const isOwner = item.userId === userId || (!item.userId && (userId === "user-1" || userId === "vega"));
      if (!isOwner) return false;

      data.proposals.splice(idx, 1);
      this.writeLocalJson(data);
      return true;
    }
  }

  // --- VISITS ---
  public async getVisits(userId: string): Promise<Visit[]> {
    let visits: Visit[] = [];
    if (this.isUsingMongo && this.db) {
      const list = await this.db.collection("visits").find({
        $or: [
          { userId: userId },
          { userId: { $exists: false } }
        ]
      }).toArray();
      visits = list.map((item: any) => ({
        ...item,
        id: item._id.toString(),
      })) as Visit[];

      if (userId !== "user-1" && userId !== "vega") {
        visits = visits.filter(v => v.userId === userId);
      }
    } else {
      const data = this.readLocalJson();
      visits = data.visits.filter(v => v.userId === userId || (!v.userId && (userId === "user-1" || userId === "vega")));
    }
    return visits;
  }

  public async addVisit(visit: Omit<Visit, "id">, userId: string): Promise<Visit> {
    const inserted: Visit = {
      ...visit,
      userId,
      createdAt: new Date().toISOString()
    } as Visit;

    if (this.isUsingMongo && this.db) {
      const res = await this.db.collection("visits").insertOne(inserted);
      return {
        ...inserted,
        id: res.insertedId.toString()
      };
    } else {
      const data = this.readLocalJson();
      inserted.id = Math.random().toString(36).substring(2, 11);
      data.visits.push(inserted);
      this.writeLocalJson(data);
      return inserted;
    }
  }

  public async updateVisit(id: string, updates: Partial<Visit>, userId: string): Promise<Visit | null> {
    if (this.isUsingMongo && this.db) {
      const filterQuery: any = { _id: new ObjectId(id) };
      if (userId !== "user-1" && userId !== "vega") {
        filterQuery.userId = userId;
      }
      await this.db.collection("visits").updateOne(
        filterQuery,
        { $set: updates }
      );
      const list = await this.getVisits(userId);
      return list.find((v) => v.id === id || v._id?.toString() === id) || null;
    } else {
      const data = this.readLocalJson();
      const idx = data.visits.findIndex((v) => v.id === id);
      if (idx === -1) return null;

      const item = data.visits[idx];
      const isOwner = item.userId === userId || (!item.userId && (userId === "user-1" || userId === "vega"));
      if (!isOwner) return null;

      data.visits[idx] = { ...data.visits[idx], ...updates };
      this.writeLocalJson(data);
      return data.visits[idx];
    }
  }

  public async deleteVisit(id: string, userId: string): Promise<boolean> {
    if (this.isUsingMongo && this.db) {
      const filterQuery: any = { _id: new ObjectId(id) };
      if (userId !== "user-1" && userId !== "vega") {
        filterQuery.userId = userId;
      }
      const res = await this.db.collection("visits").deleteOne(filterQuery);
      return res.deletedCount > 0;
    } else {
      const data = this.readLocalJson();
      const idx = data.visits.findIndex((v) => v.id === id);
      if (idx === -1) return false;

      const item = data.visits[idx];
      const isOwner = item.userId === userId || (!item.userId && (userId === "user-1" || userId === "vega"));
      if (!isOwner) return false;

      data.visits.splice(idx, 1);
      this.writeLocalJson(data);
      return true;
    }
  }

  // --- USERS ---
  public async getUsers(): Promise<User[]> {
    if (this.isUsingMongo && this.db) {
      const list = await this.db.collection("users").find({}).toArray();
      return list.map((item: any) => ({
        ...item,
        id: item._id.toString(),
      })) as User[];
    } else {
      const data = this.readLocalJson();
      let updated = false;
      const users = data.users.map((u, i) => {
        if (!u.id) {
          u.id = `user-${i + 1}`;
          updated = true;
        }
        return u;
      });
      if (updated) {
        data.users = users;
        this.writeLocalJson(data);
      }
      return users;
    }
  }

  public async validateUser(identifier: string, password?: string): Promise<User | null> {
    if (!password) return null;

    if (this.isUsingMongo && this.db) {
      let user = await this.db.collection("users").findOne({
        $or: [
          { username: identifier.toLowerCase() },
          { email: identifier.toLowerCase() }
        ]
      });
      if (!user && identifier.toLowerCase() === "vega") {
        const demoUser = defaultUsers.find(u => u.username === "vega") || {
          username: "vega",
          password: "123",
          name: "Carlos Eduardo",
          email: "carlos@metriacrm.com",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
          role: "Corretor Sênior",
          phone: "(11) 98765-4321"
        };
        await this.db.collection("users").insertOne(demoUser);
        user = await this.db.collection("users").findOne({ username: "vega" });
      }
      if (!user) return null;
      const isValid = verifyPassword(password, user.password || "");
      if (!isValid) return null;

      const { password: _, ...clean } = user;
      return { ...clean, id: user._id.toString() } as User;
    } else {
      const list = await this.getUsers();
      let user = list.find(
        (u) =>
          (u.username && u.username.toLowerCase() === identifier.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === identifier.toLowerCase())
      );
      if (!user && identifier.toLowerCase() === "vega") {
        const demoUser = defaultUsers.find(u => u.username === "vega") || {
          username: "vega",
          password: "123",
          name: "Carlos Eduardo",
          email: "carlos@metriacrm.com",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
          role: "Corretor Sênior",
          phone: "(11) 98765-4321"
        };
        const generatedId = "user-1";
        const insertedUser = { ...demoUser, id: generatedId };
        const data = this.readLocalJson();
        data.users.push(insertedUser);
        this.writeLocalJson(data);
        user = insertedUser;
      }
      if (!user) return null;
      const isValid = verifyPassword(password, user.password || "");
      if (!isValid) return null;

      const { password: _, ...clean } = user;
      return clean;
    }
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const fieldsToUpdate = { ...updates };
    if (fieldsToUpdate.password) {
      fieldsToUpdate.password = hashPassword(fieldsToUpdate.password);
    }

    if (this.isUsingMongo && this.db) {
      const { id: _, _id: __, ...fields } = fieldsToUpdate;
      await this.db.collection("users").updateOne(
        { _id: new ObjectId(id) },
        { $set: fields }
      );
      const list = await this.getUsers();
      const updated = list.find((u) => u.id === id || u._id?.toString() === id) || null;
      if (updated) {
        const { password: _, ...clean } = updated;
        return clean;
      }
      return null;
    } else {
      const data = this.readLocalJson();
      // First ensure IDs are assigned
      let idAssigned = false;
      const users = data.users.map((u, i) => {
        if (!u.id) {
          u.id = `user-${i + 1}`;
          idAssigned = true;
        }
        return u;
      });
      if (idAssigned) {
        data.users = users;
        this.writeLocalJson(data);
      }

      // Find by id, or fallback to index-based if id matches the index template, or username match as safeguard
      let idx = data.users.findIndex((u) => u.id === id);
      if (idx === -1 && id === "undefined") {
        // Safe fallback to first user for single-user dev environment
        idx = 0;
      }
      if (idx === -1) return null;
      
      data.users[idx] = { ...data.users[idx], ...fieldsToUpdate };
      this.writeLocalJson(data);
      const { password: _, ...clean } = data.users[idx];
      return clean;
    }
  }

  public async registerUser(user: Omit<User, "id">): Promise<User> {
    const hashedPassword = hashPassword(user.password || "");
    const newUser: User = {
      ...user,
      password: hashedPassword,
      username: user.username.toLowerCase(),
      email: user.email.toLowerCase(),
      avatarUrl: user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
    };

    let insertedUser: User;
    if (this.isUsingMongo && this.db) {
      const result = await this.db.collection("users").insertOne(newUser);
      insertedUser = { ...newUser, id: result.insertedId.toString() };
    } else {
      const data = this.readLocalJson();
      const generatedId = Math.random().toString(36).substring(2, 11);
      insertedUser = { ...newUser, id: generatedId };
      data.users.push(insertedUser);
      this.writeLocalJson(data);
    }

    // Seed properties, clients, tasks under the user's workspace
    await this.seedUserItems(insertedUser.id!);

    const { password: _, ...clean } = insertedUser;
    return clean;
  }
}

export const db = new DatabaseConnection();
