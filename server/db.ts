import { MongoClient, Db, ObjectId } from "mongodb";
import fs from "fs";
import path from "path";

export interface Property {
  id?: string;
  _id?: any;
  code?: string;
  ownerId?: string;
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
  videoLink?: string;
  amenities: string[];
  status: string; // 'DISPONÍVEL' | 'EM PROPOSTA' | 'VENDIDO' | 'ALUGADO'
  captadorName?: string;
  captadorPhone?: string;
  createdAt: string;
}

export interface Client {
  id?: string;
  _id?: any;
  clientType?: "PF" | "PJ";
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
  address?: string;
  pipelineStatus?: string;
  linkedPropertyId?: string;
  createdAt: string;
}

export interface Task {
  id?: string;
  _id?: any;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  title: string;
  clientName: string;
  description: string;
  type: string; // 'VISITA' | 'FOLLOW-UP' | 'CONTRATO' | 'OUTRO'
  completed: boolean;
  propertyTitle?: string;
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
  private readLocalJson(): { properties: Property[]; clients: Client[]; tasks: Task[]; users: User[] } {
    this.ensureLocalDbExists();
    try {
      const content = fs.readFileSync(LOCAL_DB_PATH, "utf8");
      const parsed = JSON.parse(content);
      return {
        properties: parsed.properties || [],
        clients: parsed.clients || [],
        tasks: parsed.tasks || [],
        users: parsed.users || defaultUsers,
      };
    } catch (e) {
      console.error("Erro lendo db.json local:", e);
      return { properties: [], clients: [], tasks: [], users: defaultUsers };
    }
  }

  private writeLocalJson(data: { properties: Property[]; clients: Client[]; tasks: Task[]; users?: User[] }) {
    this.ensureLocalDbExists();
    try {
      const existing = this.readLocalJson();
      const payload = {
        properties: data.properties,
        clients: data.clients,
        tasks: data.tasks,
        users: data.users || existing.users || defaultUsers,
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

  // --- PROPERTIES ---
  public async getProperties(): Promise<Property[]> {
    let properties: Property[] = [];
    if (this.isUsingMongo && this.db) {
      const list = await this.db.collection("properties").find({}).toArray();
      properties = list.map((item: any) => ({
        ...item,
        id: item._id.toString(),
      })) as Property[];
    } else {
      const data = this.readLocalJson();
      properties = data.properties;
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
      data.properties = updated;
      this.writeLocalJson(data);
    }
    return updated;
  }

  public async getPropertyById(id: string): Promise<Property | null> {
    const list = await this.getProperties();
    return list.find((p) => p.id === id || p._id?.toString() === id) || null;
  }

  public async addProperty(prop: Omit<Property, "id">): Promise<Property> {
    let code = prop.code;
    if (!code) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      code = `IM-${randomNum}`;
    }

    const newProp: Property = {
      ...prop,
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

  public async updateProperty(id: string, updates: Partial<Property>): Promise<Property | null> {
    if (this.isUsingMongo && this.db) {
      await this.db.collection("properties").updateOne(
        { _id: new ObjectId(id) },
        { $set: updates }
      );
      return this.getPropertyById(id);
    } else {
      const data = this.readLocalJson();
      const idx = data.properties.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      data.properties[idx] = { ...data.properties[idx], ...updates };
      this.writeLocalJson(data);
      return data.properties[idx];
    }
  }

  public async deleteProperty(id: string): Promise<boolean> {
    if (this.isUsingMongo && this.db) {
      const res = await this.db.collection("properties").deleteOne({ _id: new ObjectId(id) });
      return res.deletedCount > 0;
    } else {
      const data = this.readLocalJson();
      const initialLength = data.properties.length;
      data.properties = data.properties.filter((p) => p.id !== id);
      this.writeLocalJson(data);
      return data.properties.length < initialLength;
    }
  }

  // --- CLIENTS ---
  public async getClients(): Promise<Client[]> {
    if (this.isUsingMongo && this.db) {
      const list = await this.db.collection("clients").find({}).toArray();
      return list.map((item: any) => ({
        ...item,
        id: item._id.toString(),
      })) as Client[];
    } else {
      const data = this.readLocalJson();
      return data.clients;
    }
  }

  public async getClientById(id: string): Promise<Client | null> {
    const list = await this.getClients();
    return list.find((c) => c.id === id || c._id?.toString() === id) || null;
  }

  public async addClient(client: Omit<Client, "id">): Promise<Client> {
    const newClient: Client = {
      ...client,
      status: client.status || "Novo",
      createdAt: client.createdAt || new Date().toISOString(),
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

  public async updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    if (this.isUsingMongo && this.db) {
      await this.db.collection("clients").updateOne(
        { _id: new ObjectId(id) },
        { $set: updates }
      );
      return this.getClientById(id);
    } else {
      const data = this.readLocalJson();
      const idx = data.clients.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      data.clients[idx] = { ...data.clients[idx], ...updates };
      this.writeLocalJson(data);
      return data.clients[idx];
    }
  }

  public async deleteClient(id: string): Promise<boolean> {
    if (this.isUsingMongo && this.db) {
      const res = await this.db.collection("clients").deleteOne({ _id: new ObjectId(id) });
      return res.deletedCount > 0;
    } else {
      const data = this.readLocalJson();
      const initialLength = data.clients.length;
      data.clients = data.clients.filter((c) => c.id !== id);
      this.writeLocalJson(data);
      return data.clients.length < initialLength;
    }
  }

  // --- TASKS ---
  public async getTasks(): Promise<Task[]> {
    if (this.isUsingMongo && this.db) {
      const list = await this.db.collection("tasks").find({}).toArray();
      return list.map((item: any) => ({
        ...item,
        id: item._id.toString(),
      })) as Task[];
    } else {
      const data = this.readLocalJson();
      return data.tasks;
    }
  }

  public async addTask(task: Omit<Task, "id">): Promise<Task> {
    const newTask: Task = {
      ...task,
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

  public async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    if (this.isUsingMongo && this.db) {
      await this.db.collection("tasks").updateOne(
        { _id: new ObjectId(id) },
        { $set: updates }
      );
      // Retrieve task
      const list = await this.getTasks();
      return list.find((t) => t.id === id || t._id?.toString() === id) || null;
    } else {
      const data = this.readLocalJson();
      const idx = data.tasks.findIndex((t) => t.id === id);
      if (idx === -1) return null;
      data.tasks[idx] = { ...data.tasks[idx], ...updates };
      this.writeLocalJson(data);
      return data.tasks[idx];
    }
  }

  public async deleteTask(id: string): Promise<boolean> {
    if (this.isUsingMongo && this.db) {
      const res = await this.db.collection("tasks").deleteOne({ _id: new ObjectId(id) });
      return res.deletedCount > 0;
    } else {
      const data = this.readLocalJson();
      const initialLength = data.tasks.length;
      data.tasks = data.tasks.filter((t) => t.id !== id);
      this.writeLocalJson(data);
      return data.tasks.length < initialLength;
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
      return data.users;
    }
  }

  public async validateUser(username: string, password?: string): Promise<User | null> {
    const list = await this.getUsers();
    const user = list.find(u => u.username.toLowerCase() === username.toLowerCase() && (!password || u.password === password));
    if (user) {
      const { password: _, ...cleanUser } = user;
      return cleanUser;
    }
    return null;
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (this.isUsingMongo && this.db) {
      const { id: _, _id: __, ...fields } = updates;
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
      const idx = data.users.findIndex((u) => u.id === id);
      if (idx === -1) return null;
      data.users[idx] = { ...data.users[idx], ...updates };
      this.writeLocalJson(data);
      const { password: _, ...clean } = data.users[idx];
      return clean;
    }
  }

  public async registerUser(user: Omit<User, "id">): Promise<User> {
    const newUser: User = {
      ...user,
      avatarUrl: user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
    };

    if (this.isUsingMongo && this.db) {
      const result = await this.db.collection("users").insertOne(newUser);
      const inserted = { ...newUser, id: result.insertedId.toString() };
      const { password: _, ...clean } = inserted;
      return clean;
    } else {
      const data = this.readLocalJson();
      const generatedId = Math.random().toString(36).substring(2, 11);
      const inserted = { ...newUser, id: generatedId };
      data.users.push(inserted);
      this.writeLocalJson(data);
      const { password: _, ...clean } = inserted;
      return clean;
    }
  }
}

export const db = new DatabaseConnection();
