import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db.js";
import { GoogleGenAI, Type } from "@google/genai";
import { initStorage, uploadImage, deleteImage } from "./server/storageService.js";

// Try to initialize Gemini AI safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini AI inicializado com sucesso.");
  } catch (err) {
    console.error("Erro ao inicializar Gemini AI:", err);
  }
} else {
  console.log("Nenhuma GEMINI_API_KEY encontrada nas variáveis de ambiente.");
}

async function generateContentWithRetry(fn: () => Promise<any>, retries = 2, delay = 1000): Promise<any> {
  try {
    return await fn();
  } catch (err: any) {
    const isTransient = err?.status === 503 || err?.status === 429 || String(err?.message || "").includes("503") || String(err?.message || "").includes("429");
    if (isTransient && retries > 0) {
      console.warn(`Gemini API retornou erro temporário (${err?.status || err?.message}). Tentando novamente em ${delay}ms... (Tentativas restantes: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateContentWithRetry(fn, retries - 1, delay * 2);
    }
    throw err;
  }
}

function getFallbackDescription(body: any) {
  const { 
    title, 
    type, 
    condition, 
    modality, 
    neighborhood, 
    city, 
    price,
    bedrooms, 
    suites, 
    bathrooms, 
    parkingSpots,
    area, 
    amenities 
  } = body;

  const formattedPrice = price 
    ? Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) 
    : "Sob Consulta";

  const cleanTitle = title || "Excelente Imóvel";
  const cleanType = type || "Imóvel";
  const cleanNeighborhood = neighborhood ? `no bairro ${neighborhood}` : "";
  const cleanCity = city ? `em ${city}` : "";
  const locStr = [cleanNeighborhood, cleanCity].filter(Boolean).join(" ");

  const features = [];
  if (area) features.push(`${area}m² de área útil`);
  if (bedrooms) features.push(`${bedrooms} ${bedrooms > 1 ? "dormitórios" : "dormitório"}`);
  if (suites) features.push(`${suites} ${suites > 1 ? "suítes" : "suíte"}`);
  if (bathrooms) features.push(`${bathrooms} ${bathrooms > 1 ? "banheiros" : "banheiro"}`);
  if (parkingSpots) features.push(`${parkingSpots} ${parkingSpots > 1 ? "vagas de garagem" : "vaga de garagem"}`);

  const featuresStr = features.length > 0 ? `composto por ${features.join(", ")}` : "";
  const amenitiesList = Array.isArray(amenities) && amenities.length > 0
    ? `\n\nDiferenciais e comodidades: ${amenities.join(", ")}.`
    : "";

  const professional = `Excelente oportunidade de ${modality === "Aluguel" ? "locação" : "aquisição"}: ${cleanTitle}. Este belíssimo(a) ${cleanType.toLowerCase()} está localizado(a) ${locStr}. Apresenta excelente distribuição interna ${featuresStr}. Conta com acabamentos de ótimo padrão, oferecendo conforto, segurança e bem-estar para toda a família.${amenitiesList}\n\nValor: ${formattedPrice}. Entre em contato para mais detalhes e agendamento de visitas de forma personalizada.`;

  const whatsapp = `✨ *OPORTUNIDADE ÚNICA* ✨\n\n🏡 *${cleanTitle}*\n📍 Localização: ${neighborhood || "Bairro sob consulta"}, ${city || "Cidade sob consulta"}\n\n📋 *Características do Imóvel:*\n` +
    (area ? `📏 Área: ${area}m²\n` : "") +
    (bedrooms ? `🛏️ Quartos: ${bedrooms} ${suites ? `(${suites} suítes)` : ""}\n` : "") +
    (bathrooms ? `🚿 Banheiros: ${bathrooms}\n` : "") +
    (parkingSpots ? `🚗 Vagas: ${parkingSpots}\n` : "") +
    `💰 Valor: *${formattedPrice}*\n\n` +
    (Array.isArray(amenities) && amenities.length > 0 ? `⭐️ *Diferenciais:* ${amenities.join(", ")}\n\n` : "") +
    `Quer saber mais ou agendar uma visita? Fale comigo por aqui! 📲`;

  const portal = `👉 ${cleanTitle}\n\nProcura por conforto, praticidade e uma excelente localização? Conheça este(a) incrível ${cleanType.toLowerCase()} ${locStr}.\n\n✅ Destaques do Imóvel:\n` +
    (area ? `- Área privativa de ${area}m²\n` : "") +
    (bedrooms ? `- ${bedrooms} quarto(s) ${suites ? `(sendo ${suites} suíte/s)` : ""}\n` : "") +
    (bathrooms ? `- ${bathrooms} banheiro(s)\n` : "") +
    (parkingSpots ? `- ${parkingSpots} vaga(s) de garagem\n` : "") +
    (Array.isArray(amenities) && amenities.length > 0 ? `\n🎁 Diferenciais & Lazer:\n` + amenities.map((a: string) => `• ${a}`).join("\n") + "\n" : "") +
    `\n💵 Investimento: ${formattedPrice}\n\nNão perca essa oportunidade única no mercado. Agende hoje mesmo sua visita com nossos corretores credenciados!`;

  return { professional, whatsapp, portal };
}

function getFallbackTasks(clients: any[] = [], properties: any[] = []) {
  const fallbackTasks = [];
  
  if (clients.length > 0) {
    const client = clients[0];
    fallbackTasks.push({
      title: `Acompanhar ${client.name}`,
      clientName: client.name,
      description: `Enviar mensagem de follow-up para ${client.name.split(" ")[0]} para entender o interesse atual em imóveis de perfil semelhante no mercado.`,
      time: "10:00",
      type: "FOLLOW-UP"
    });
  } else {
    fallbackTasks.push({
      title: "Prospectar novos clientes",
      clientName: "Novos contatos",
      description: "Revisar canais de captação e redes sociais para atrair novas oportunidades de leads para o Metria CRM.",
      time: "09:30",
      type: "FOLLOW-UP"
    });
  }

  if (properties.length > 0 && clients.length > 1) {
    const client = clients[1];
    const property = properties[0];
    fallbackTasks.push({
      title: `Sugerir imóvel para ${client.name}`,
      clientName: client.name,
      description: `Apresentar o imóvel "${property.title || "Imóvel cadastrado"}" localizado em ${property.neighborhood || "região de interesse"} como excelente opção para ${client.name.split(" ")[0]}.`,
      time: "14:30",
      type: "VISITA"
    });
  } else if (properties.length > 0) {
    const property = properties[0];
    fallbackTasks.push({
      title: "Otimizar anúncio de imóvel",
      clientName: "Geral",
      description: `Revisar fotos e detalhes de "${property.title || "Imóvel cadastrado"}" para melhorar o engajamento de portais imobiliários.`,
      time: "14:00",
      type: "OUTRO"
    });
  } else {
    fallbackTasks.push({
      title: "Cadastrar novos imóveis",
      clientName: "Geral",
      description: "Captar novos imóveis na região de foco e inseri-los no CRM para aumentar o portfólio de vendas.",
      time: "11:00",
      type: "OUTRO"
    });
  }

  if (clients.length > 2) {
    const client = clients[2];
    fallbackTasks.push({
      title: `Agendar café com ${client.name}`,
      clientName: client.name,
      description: `Convidar ${client.name.split(" ")[0]} para uma conversa informal a fim de estreitar o relacionamento de longo prazo.`,
      time: "16:00",
      type: "FOLLOW-UP"
    });
  } else {
    fallbackTasks.push({
      title: "Revisar metas da semana",
      clientName: "Geral",
      description: "Analisar o funil de vendas, relatórios de comissão e planejar as visitas da semana no CRM.",
      time: "16:30",
      type: "CONTRATO"
    });
  }

  return fallbackTasks;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize storage
  initStorage();

  app.use(express.json({ limit: "10mb" }));
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Middleware to require authentication on private API endpoints
  const requireAuth = (req: any, res: any, next: any) => {
    let token = null;

    // 1. Check Authorization Header
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // 2. Check session_id Cookie
    if (!token) {
      const cookieHeader = req.headers.cookie || "";
      const match = cookieHeader.match(/(?:^|;\s*)session_id=([^;]+)/);
      token = match ? match[1] : null;
    }

    if (!token) {
      return res.status(401).json({ error: "Sessão expirada ou não autorizado. Por favor, faça login." });
    }

    const session = db.getSession(token);
    if (!session) {
      return res.status(401).json({ error: "Sessão inválida ou expirada. Por favor, faça login." });
    }

    req.userId = session.userId;
    next();
  };

  // --- API ROUTES ---

  // Database Connection Status
  app.get("/api/status", (req, res) => {
    res.json({
      dbType: db.isMongoActive() ? "MongoDB Atlas" : "JSON Local (Fallback)",
      mongoActive: db.isMongoActive(),
      geminiActive: !!ai,
    });
  });

  // --- PROPERTIES (IMÓVEIS) ---

  // Get all properties
  app.get("/api/properties", requireAuth, async (req: any, res) => {
    try {
      let list = await db.getProperties(req.userId);
      
      const { modality, search } = req.query;
      
      if (modality && modality !== "Todos") {
        list = list.filter((p) => p.modality.toLowerCase() === String(modality).toLowerCase());
      }
      
      if (search) {
        const query = String(search).toLowerCase();
        list = list.filter(
          (p) =>
            p.title.toLowerCase().includes(query) ||
            p.neighborhood.toLowerCase().includes(query) ||
            p.city.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query)
        );
      }

      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Middleware to validate MongoDB ObjectId
  const validateId = (req: any, res: any, next: any) => {
    const { id } = req.params;
    if (id && db.isMongoActive() && !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ error: "Formato de ID inválido" });
    }
    next();
  };

  // Get property by ID
  app.get("/api/properties/:id", requireAuth, validateId, async (req: any, res) => {
    try {
      const property = await db.getPropertyById(req.params.id, req.userId);
      if (!property) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }
      res.json(property);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Upload image to server disk
  app.post("/api/upload", requireAuth, async (req: any, res) => {
    try {
      const { dataUrl } = req.body;
      if (!dataUrl) {
        return res.status(400).json({ error: "O parâmetro dataUrl é obrigatório." });
      }
      const publicUrl = await uploadImage(dataUrl);
      res.json({ url: publicUrl });
    } catch (err: any) {
      console.error("Erro no upload de imagem:", err);
      res.status(500).json({ error: `Falha ao processar upload da foto: ${err.message}` });
    }
  });

  // Add new property
  app.post("/api/properties", requireAuth, async (req: any, res) => {
    try {
      const newProp = await db.addProperty(req.body, req.userId);
      res.status(201).json(newProp);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update property
  app.put("/api/properties/:id", requireAuth, validateId, async (req: any, res) => {
    try {
      const updated = await db.updateProperty(req.params.id, req.body, req.userId);
      if (!updated) {
        return res.status(404).json({ error: "Imóvel não encontrado para atualização ou permissão negada" });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete property
  app.delete("/api/properties/:id", requireAuth, validateId, async (req: any, res) => {
    try {
      const success = await db.deleteProperty(req.params.id, req.userId);
      if (!success) {
        return res.status(404).json({ error: "Imóvel não encontrado para exclusão ou permissão negada" });
      }
      res.json({ message: "Imóvel excluído com sucesso" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- CLIENTS (CLIENTES) ---

  // Get all clients
  app.get("/api/clients", requireAuth, async (req: any, res) => {
    try {
      let list = await db.getClients(req.userId);
      
      const { profileType, search } = req.query;
      
      if (profileType && profileType !== "Todos") {
        list = list.filter((c) => c.profileType.toLowerCase() === String(profileType).toLowerCase());
      }
      
      if (search) {
        const query = String(search).toLowerCase();
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.phone.includes(query) ||
            c.email.toLowerCase().includes(query) ||
            c.observations.toLowerCase().includes(query)
        );
      }

      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get client by ID
  app.get("/api/clients/:id", requireAuth, validateId, async (req: any, res) => {
    try {
      const client = await db.getClientById(req.params.id, req.userId);
      if (!client) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      res.json(client);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add new client
  app.post("/api/clients", requireAuth, async (req: any, res) => {
    try {
      const newClient = await db.addClient(req.body, req.userId);
      res.status(201).json(newClient);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update client
  app.put("/api/clients/:id", requireAuth, validateId, async (req: any, res) => {
    try {
      const clientId = req.params.id;
      const oldClient = await db.getClientById(clientId, req.userId);
      
      if (oldClient) {
        // Fetch current user
        const users = await db.getUsers();
        const user = users.find(u => u.id === req.userId || u._id?.toString() === req.userId);
        const userName = user?.name || user?.username;

        // Start with body history or old client history or default creation
        const existingHistory = req.body.history || oldClient.history || [
          {
            id: Math.random().toString(36).substring(2, 11),
            type: "creation",
            date: oldClient.createdAt || new Date().toISOString(),
            description: "Lead criado no sistema",
          }
        ];

        const additionalEntries = [];

        // Check status change
        if (req.body.status !== undefined && req.body.status !== oldClient.status) {
          additionalEntries.push({
            id: Math.random().toString(36).substring(2, 11),
            type: "status_change",
            date: new Date().toISOString(),
            description: `Status alterado de "${oldClient.status || "Sem Status"}" para "${req.body.status}"`,
            userName
          });
        }

        // Check pipeline status change
        if (req.body.pipelineStatus !== undefined && req.body.pipelineStatus !== oldClient.pipelineStatus) {
          additionalEntries.push({
            id: Math.random().toString(36).substring(2, 11),
            type: "pipeline_change",
            date: new Date().toISOString(),
            description: `Etapa do pipeline alterada de "${oldClient.pipelineStatus || "Sem etapa"}" para "${req.body.pipelineStatus}"`,
            userName
          });
        }

        // Check for Loss reason
        if (
          (req.body.status === "Perdido" || req.body.pipelineStatus === "Perdido") &&
          req.body.lossReason &&
          req.body.lossReason !== oldClient.lossReason
        ) {
          additionalEntries.push({
            id: Math.random().toString(36).substring(2, 11),
            type: "loss",
            date: new Date().toISOString(),
            description: `Motivo de perda registrado: "${req.body.lossReason}"`,
            userName
          });
        }

        if (additionalEntries.length > 0) {
          req.body.history = [...existingHistory, ...additionalEntries];
        } else if (!req.body.history) {
          req.body.history = existingHistory;
        }
      }

      const updated = await db.updateClient(clientId, req.body, req.userId);
      if (!updated) {
        return res.status(404).json({ error: "Cliente não encontrado para atualização ou permissão negada" });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete client
  app.delete("/api/clients/:id", requireAuth, validateId, async (req: any, res) => {
    try {
      const success = await db.deleteClient(req.params.id, req.userId);
      if (!success) {
        return res.status(404).json({ error: "Cliente não encontrado para exclusão ou permissão negada" });
      }
      res.json({ message: "Cliente excluído com sucesso" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- TASKS (TAREFAS) ---

  // Get all tasks
  app.get("/api/tasks", requireAuth, async (req: any, res) => {
    try {
      let list = await db.getTasks(req.userId);
      
      const { date } = req.query;
      if (date) {
        list = list.filter((t) => t.date === String(date));
      }
      
      // Sort tasks by time ascending
      list.sort((a, b) => a.time.localeCompare(b.time));

      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add new task
  app.post("/api/tasks", requireAuth, async (req: any, res) => {
    try {
      const newTask = await db.addTask(req.body, req.userId);
      
      // Auto-record in client history
      if (req.body.clientId || req.body.clientName) {
        const clients = await db.getClients(req.userId);
        const client = clients.find(c => 
          (req.body.clientId && (c.id === req.body.clientId || c._id?.toString() === req.body.clientId)) ||
          (req.body.clientName && c.name.toLowerCase() === req.body.clientName.toLowerCase())
        );
        if (client && client.id) {
          const users = await db.getUsers();
          const user = users.find(u => u.id === req.userId || u._id?.toString() === req.userId);
          const userName = user?.name || user?.username;

          const historyEntry = {
            id: Math.random().toString(36).substring(2, 11),
            type: "task_created",
            date: new Date().toISOString(),
            description: `Tarefa criada: "${req.body.title}" marcada para ${req.body.date.split("-").reverse().join("/")} às ${req.body.time}`,
            userName
          };

          const existingHistory = client.history || [
            {
              id: Math.random().toString(36).substring(2, 11),
              type: "creation",
              date: client.createdAt || new Date().toISOString(),
              description: "Lead criado no sistema",
            }
          ];

          await db.updateClient(client.id, {
            history: [...existingHistory, historyEntry]
          }, req.userId);
        }
      }

      res.status(201).json(newTask);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update task
  app.put("/api/tasks/:id", requireAuth, validateId, async (req: any, res) => {
    try {
      // Get the original task before updating to check for status change (completion)
      const tasksBefore = await db.getTasks(req.userId);
      const originalTask = tasksBefore.find(t => t.id === req.params.id || t._id?.toString() === req.params.id);

      const updated = await db.updateTask(req.params.id, req.body, req.userId);
      if (!updated) {
        return res.status(404).json({ error: "Tarefa não encontrada para atualização ou permissão negada" });
      }

      // If the task was newly marked completed
      if (originalTask && !originalTask.completed && req.body.completed === true) {
        const clients = await db.getClients(req.userId);
        const client = clients.find(c => 
          (originalTask.clientId && (c.id === originalTask.clientId || c._id?.toString() === originalTask.clientId)) ||
          (originalTask.clientName && c.name.toLowerCase() === originalTask.clientName.toLowerCase())
        );
        if (client && client.id) {
          const users = await db.getUsers();
          const user = users.find(u => u.id === req.userId || u._id?.toString() === req.userId);
          const userName = user?.name || user?.username;

          const historyEntry = {
            id: Math.random().toString(36).substring(2, 11),
            type: "task_completed",
            date: new Date().toISOString(),
            description: `Tarefa concluída: "${originalTask.title}"`,
            userName
          };

          const existingHistory = client.history || [
            {
              id: Math.random().toString(36).substring(2, 11),
              type: "creation",
              date: client.createdAt || new Date().toISOString(),
              description: "Lead criado no sistema",
            }
          ];

          await db.updateClient(client.id, {
            history: [...existingHistory, historyEntry]
          }, req.userId);
        }
      }

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete task
  app.delete("/api/tasks/:id", requireAuth, validateId, async (req: any, res) => {
    try {
      const success = await db.deleteTask(req.params.id, req.userId);
      if (!success) {
        return res.status(404).json({ error: "Tarefa não encontrada para exclusão ou permissão negada" });
      }
      res.json({ message: "Tarefa excluída com sucesso" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- PROPOSALS (PROPOSTAS) ---

  // Get all proposals
  app.get("/api/proposals", requireAuth, async (req: any, res) => {
    try {
      const list = await db.getProposals(req.userId);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create proposal
  app.post("/api/proposals", requireAuth, async (req: any, res) => {
    try {
      const proposal = await db.addProposal(req.body, req.userId);
      
      // Auto-record in client history
      if (req.body.clientId) {
        const client = await db.getClientById(req.body.clientId, req.userId);
        if (client && client.id) {
          const users = await db.getUsers();
          const user = users.find(u => u.id === req.userId || u._id?.toString() === req.userId);
          const userName = user?.name || user?.username;

          const historyEntry = {
            id: Math.random().toString(36).substring(2, 11),
            type: "proposal_sent",
            date: new Date().toISOString(),
            description: `Proposta enviada para o imóvel "${req.body.propertyTitle || "Imóvel"}" no valor de R$ ${(req.body.proposedValue || 0).toLocaleString("pt-BR")}`,
            userName
          };

          const existingHistory = client.history || [
            {
              id: Math.random().toString(36).substring(2, 11),
              type: "creation",
              date: client.createdAt || new Date().toISOString(),
              description: "Lead criado no sistema",
            }
          ];

          await db.updateClient(client.id, {
            history: [...existingHistory, historyEntry]
          }, req.userId);
        }
      }

      res.status(201).json(proposal);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update proposal
  app.put("/api/proposals/:id", requireAuth, validateId, async (req: any, res) => {
    try {
      const updated = await db.updateProposal(req.params.id, req.body, req.userId);
      if (!updated) {
        return res.status(404).json({ error: "Proposta não encontrada para atualização" });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete proposal
  app.delete("/api/proposals/:id", requireAuth, validateId, async (req: any, res) => {
    try {
      const success = await db.deleteProposal(req.params.id, req.userId);
      if (!success) {
        return res.status(404).json({ error: "Proposta não encontrada para exclusão" });
      }
      res.json({ message: "Proposta excluída com sucesso" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- VISITS (VISITAS) ---

  // Get all visits
  app.get("/api/visits", requireAuth, async (req: any, res) => {
    try {
      const list = await db.getVisits(req.userId);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create visit
  app.post("/api/visits", requireAuth, async (req: any, res) => {
    try {
      const visit = await db.addVisit(req.body, req.userId);
      
      // Auto-record in client history
      if (req.body.clientId) {
        const client = await db.getClientById(req.body.clientId, req.userId);
        if (client && client.id) {
          const users = await db.getUsers();
          const user = users.find(u => u.id === req.userId || u._id?.toString() === req.userId);
          const userName = user?.name || user?.username;

          const historyEntry = {
            id: Math.random().toString(36).substring(2, 11),
            type: "visit_scheduled",
            date: new Date().toISOString(),
            description: `Visita agendada para o imóvel "${req.body.propertyTitle || "Imóvel"}" no dia ${req.body.date.split("-").reverse().join("/")} às ${req.body.time}`,
            userName
          };

          const existingHistory = client.history || [
            {
              id: Math.random().toString(36).substring(2, 11),
              type: "creation",
              date: client.createdAt || new Date().toISOString(),
              description: "Lead criado no sistema",
            }
          ];

          await db.updateClient(client.id, {
            history: [...existingHistory, historyEntry]
          }, req.userId);
        }
      }

      res.status(201).json(visit);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update visit
  app.put("/api/visits/:id", requireAuth, validateId, async (req: any, res) => {
    try {
      const updated = await db.updateVisit(req.params.id, req.body, req.userId);
      if (!updated) {
        return res.status(404).json({ error: "Visita não encontrada para atualização" });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete visit
  app.delete("/api/visits/:id", requireAuth, validateId, async (req: any, res) => {
    try {
      const success = await db.deleteVisit(req.params.id, req.userId);
      if (!success) {
        return res.status(404).json({ error: "Visita não encontrada para exclusão" });
      }
      res.json({ message: "Visita excluída com sucesso" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- AI FEATURES (GEMINI) ---

  // Generate elegant property descriptions (3 versions: Professional, WhatsApp, and Portal)
  app.post("/api/ai/generate-description", requireAuth, async (req: any, res) => {
    if (!ai) {
      return res.status(400).json({
        error: "O serviço de inteligência artificial não está configurado. Por favor, configure GEMINI_API_KEY.",
      });
    }

    try {
      const { 
        title, 
        type, 
        condition, 
        modality, 
        neighborhood, 
        city, 
        price,
        bedrooms, 
        suites, 
        bathrooms, 
        parkingSpots,
        area, 
        amenities 
      } = req.body;

      const formattedPrice = price 
        ? Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) 
        : "Sob Consulta";

      const prompt = `Você é um redator imobiliário sênior focado no mercado brasileiro.
Crie três descrições distintas e vendedoras para o seguinte imóvel, respeitando rigorosamente as diretrizes abaixo.

Dados do Imóvel:
- Título do Anúncio: ${title || "Excelente Imóvel"}
- Tipo de Imóvel: ${type || "Não especificado"}
- Condição: ${condition || "Não informada"}
- Finalidade: ${modality || "Venda"}
- Preço/Valor: ${formattedPrice}
- Localização: Bairro ${neighborhood || "não informado"}, Cidade ${city || "não informada"}
- Dormitórios/Quartos: ${bedrooms || 0}
- Suítes: ${suites || 0}
- Banheiros Totais: ${bathrooms || 0}
- Vagas de Garagem: ${parkingSpots || 0}
- Área Útil/Privativa: ${area || 0}m²
- Diferenciais/Lazer/Comodidades: ${Array.isArray(amenities) && amenities.length > 0 ? amenities.join(", ") : "Nenhum diferencial explícito cadastrado"}

DIRETRIZES DE OURO (MUITO IMPORTANTE):
1. NÃO invente características adicionais que não estejam descritas acima (por exemplo: não diga que tem piscina, churrasqueira, vista para o mar ou acabamento em porcelanato se isso não constar na lista de diferencias ou dados fornecidos).
2. Escreva com um tom Comercial, Natural, sem clichês infantis ou promessas exageradas, adaptado ao vocabulário do mercado imobiliário brasileiro de alta qualidade.
3. Se um campo estiver zerado ou não informado, não cite ou simplesmente não invente dados (ex: se não houver suítes, não diga que é uma suíte).

Gere exatamente três versões do texto:

Versão 1: Descrição Profissional (campo: "professional")
- Foco em elegância, clareza técnica e descrição minuciosa e fluida.
- Ideal para propostas formais e apresentações impressas ou PDFs.
- Use parágrafos bem construídos que transmitam sofisticação e segurança técnica.

Versão 2: Descrição Curta para WhatsApp (campo: "whatsapp")
- Texto direto, convidativo e escaneável para leitura rápida no celular.
- Use emojis apropriados de forma moderada e elegante.
- Inclua quebras de linha para ficar leve.
- Conclua com uma sugestão simpática de contato para agendar uma visita.

Versão 3: Descrição para Portal Imobiliário (campo: "portal")
- Uma estrutura excelente com gancho chamativo no início.
- Seguido de uma seção de tópicos/bullet-points curtos listando as principais características do imóvel (quartos, banheiros, vagas, diferenciais).
- Conclua com uma Chamada para Ação (CTA) clara para portais de anúncios imobiliários (ZAP, VivaReal, etc.).`;

      try {
        const response = await generateContentWithRetry(() => ai!.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                professional: {
                  type: Type.STRING,
                  description: "Descrição de tom profissional e parágrafos elegantes para propostas."
                },
                whatsapp: {
                  type: Type.STRING,
                  description: "Descrição curta e direta para envio por WhatsApp com emojis elegantes e quebra de linha."
                },
                portal: {
                  type: Type.STRING,
                  description: "Descrição vendedora dividida em seções e bullet-points para portais imobiliários."
                }
              },
              required: ["professional", "whatsapp", "portal"]
            }
          }
        }));

        const resultText = response.text || "{}";
        const parsed = JSON.parse(resultText);
        res.json(parsed);
      } catch (innerErr) {
        console.warn("Erro ao chamar o Gemini para descrição do imóvel, usando fallback estático:", innerErr);
        const fallback = getFallbackDescription(req.body);
        res.json(fallback);
      }
    } catch (err: any) {
      console.error("Erro na geração de descrição por IA:", err);
      res.status(500).json({ error: `Falha na IA: ${err.message}` });
    }
  });

  // Suggest daily action steps based on client profiles or property pipeline
  app.post("/api/ai/suggest-tasks", requireAuth, async (req: any, res) => {
    if (!ai) {
      return res.status(400).json({
        error: "O serviço de inteligência artificial não está configurado. Por favor, configure GEMINI_API_KEY.",
      });
    }

    try {
      const { clients, properties } = req.body;

      const prompt = `Você é um consultor e coach especialista em vendas e CRM imobiliário.
Análise a lista de contatos/leads recentes e recomende 3 tarefas estratégicas prioritárias para o corretor realizar hoje para aumentar suas conversões de vendas ou locações.

Contatos Recentes:
${JSON.stringify(clients, null, 2)}

Imóveis Disponíveis:
${JSON.stringify(properties, null, 2)}

Formato da resposta: Retorne apenas um JSON válido no formato de lista com 3 itens de tarefa. Cada item deve ter:
- "title": Título curto e direto da ação (ex: "Ligar para Beatriz Oliveira")
- "clientName": Nome do cliente envolvido
- "description": Motivo estratégico da ação e o que falar (ex: "Sugerir o novo Apartamento em Ipanema que se encaixa perfeitamente no orçamento de R$ 2.4M.")
- "time": Sugestão de horário (ex: "10:00", "15:30")
- "type": Tipo de tarefa ("VISITA" ou "FOLLOW-UP" ou "CONTRATO" ou "OUTRO")

Exemplo de formato esperado:
[
  { "title": "...", "clientName": "...", "description": "...", "time": "...", "type": "..." }
]`;

      try {
        const response = await generateContentWithRetry(() => ai!.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        }));

        const parsedTasks = JSON.parse(response.text || "[]");
        res.json(parsedTasks);
      } catch (innerErr) {
        console.warn("Erro ao chamar o Gemini para sugestão de tarefas, usando fallback estruturado:", innerErr);
        const fallback = getFallbackTasks(clients, properties);
        res.json(fallback);
      }
    } catch (err: any) {
      res.status(500).json({ error: `Falha na IA: ${err.message}` });
    }
  });

  // Next Best Action (Próxima Melhor Ação) Recommendation Engine
  app.post("/api/ai/next-best-actions", requireAuth, async (req: any, res) => {
    try {
      const { clients = [], tasks = [], proposals = [], visits = [] } = req.body;

      const todayStr = new Date().toISOString().split("T")[0];
      const now = new Date();
      const currentHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const rawCandidates: any[] = [];

      // 1. Leads sem contato
      const leadsSemContato = clients.filter((c: any) => {
        const isNew = String(c.status || "").toLowerCase() === "novo" || String(c.profileType || "").toLowerCase() === "lead";
        const isActive = !["ganho", "perdido"].includes(String(c.status || "").toLowerCase());
        const hasCompletedTask = tasks.some((t: any) => t.completed && (t.clientId === c.id || t.clientId === c._id));
        const hasHistoryContact = c.history?.some((h: any) => 
          ["whatsapp", "task_completed", "visit_scheduled", "proposal_sent"].includes(h.type)
        );
        return isNew && isActive && !hasCompletedTask && !hasHistoryContact;
      });

      leadsSemContato.forEach((c: any) => {
        rawCandidates.push({
          clientId: c.id || c._id,
          clientName: c.name,
          category: "Leads sem contato",
          reason: `Lead novo cadastrado no CRM sem nenhuma atividade ou primeiro contato registrado.`,
          suggestion: `Fazer primeiro contato via WhatsApp para se apresentar e entender o perfil de busca do cliente.`,
          actionType: "whatsapp",
          priority: "Alta",
          actionPayload: {
            phone: c.phone || "",
            message: `Olá, ${c.name.split(" ")[0]}! Tudo bem? Me chamo corretor da Metria CRM. Vi que você tem interesse em encontrar um imóvel. Gostaria de entender melhor quais são suas preferências (tipo de imóvel, localização, quantidade de quartos) para eu selecionar as melhores opções da nossa carteira para você. Como está o seu tempo esta semana?`,
            taskTitle: `Fazer primeiro contato com ${c.name}`,
            taskDescription: `Entrar em contato para qualificar as preferências do lead novo.`,
            taskType: "Ligar"
          }
        });
      });

      // 2. Follow-ups atrasados
      const followupsAtrasados = tasks.filter((t: any) => {
        if (t.completed) return false;
        if (t.date < todayStr) return true;
        if (t.date === todayStr && t.time < currentHM) return true;
        return false;
      });

      followupsAtrasados.forEach((t: any) => {
        const client = clients.find((c: any) => c.id === t.clientId || c._id === t.clientId || c.name === t.clientName);
        rawCandidates.push({
          clientId: client?.id || client?._id || "unknown",
          clientName: t.clientName,
          category: "Follow-ups atrasados",
          reason: `A tarefa de follow-up "${t.title}" está atrasada desde ${t.date.split("-").reverse().join("/")} às ${t.time}.`,
          suggestion: `Colocar a agenda em dia realizando o contato com o cliente para evitar o esfriamento da negociação.`,
          actionType: "whatsapp",
          priority: "Alta",
          actionPayload: {
            phone: client?.phone || "",
            message: `Olá, ${t.clientName.split(" ")[0]}! Espero que esteja bem. Estou entrando em contato para retomarmos nossa conversa sobre as opções de imóveis que estávamos analisando. Você conseguiu um tempo para dar uma olhada nelas?`,
            taskTitle: `Retomar follow-up: ${t.title}`,
            taskDescription: `Follow-up comercial anteriormente atrasado.`,
            taskType: "Cobrar retorno"
          }
        });
      });

      // 3. Propostas abertas
      const propostasAbertas = proposals.filter((p: any) => 
        ["pendente", "em análise", "em analise"].includes(String(p.status || "").toLowerCase())
      );

      propostasAbertas.forEach((p: any) => {
        const client = clients.find((c: any) => c.id === p.clientId || c._id === p.clientId || c.name === p.clientName);
        rawCandidates.push({
          clientId: p.clientId,
          clientName: p.clientName,
          category: "Propostas abertas",
          reason: `Há uma proposta em análise/pendente para o imóvel "${p.propertyTitle}" enviada em ${p.date.split("-").reverse().join("/")}.`,
          suggestion: `Entrar em contato para cobrar um posicionamento e dar andamento aos trâmites de fechamento do negócio.`,
          actionType: "whatsapp",
          priority: "Crítica",
          actionPayload: {
            phone: client?.phone || "",
            message: `Olá, ${p.clientName.split(" ")[0]}! Passando para saber se você teve alguma resposta ou conseguiu analisar a proposta que enviamos para o imóvel ${p.propertyTitle}? Ficou com alguma dúvida sobre as condições ou fluxo de pagamentos?`,
            taskTitle: `Cobrar proposta ${p.clientName}`,
            taskDescription: `Cobrar andamento da proposta de R$ ${p.proposedValue?.toLocaleString("pt-BR")} para o imóvel ${p.propertyTitle}`,
            taskType: "Enviar proposta"
          }
        });
      });

      // 4. Visitas realizadas sem retorno
      const visitasSemRetorno = visits.filter((v: any) => {
        if (String(v.status || "").toLowerCase() !== "realizada") return false;
        const hasFeedback = v.feedback && v.feedback.trim().length > 0;
        const clientTasks = tasks.filter((t: any) => t.clientId === v.clientId);
        const hasCompletedAfter = clientTasks.some((t: any) => t.completed && t.date >= v.date);
        return !hasFeedback && !hasCompletedAfter;
      });

      visitasSemRetorno.forEach((v: any) => {
        const client = clients.find((c: any) => c.id === v.clientId || c._id === v.clientId || c.name === v.clientName);
        rawCandidates.push({
          clientId: v.clientId,
          clientName: v.clientName,
          category: "Visitas realizadas sem retorno",
          reason: `Visita ao imóvel "${v.propertyTitle}" foi realizada no dia ${v.date.split("-").reverse().join("/")}, mas ainda não há feedback ou atividade registrada.`,
          suggestion: `Enviar uma mensagem de pós-visita para colher as impressões do cliente e verificar interesse em avançar.`,
          actionType: "whatsapp",
          priority: "Alta",
          actionPayload: {
            phone: client?.phone || "",
            message: `Olá, ${v.clientName.split(" ")[0]}! Como vai? Passando para saber o que você achou da visita que fizemos ao imóvel ${v.propertyTitle} no dia ${v.date.split("-").reverse().join("/")}. Acredita que o imóvel atende ao que busca ou gostaria de ver outras opções semelhantes?`,
            taskTitle: `Colher feedback pós-visita de ${v.clientName}`,
            taskDescription: `Entrar em contato para colher impressões sobre a visita no imóvel ${v.propertyTitle}`,
            taskType: "Cobrar retorno"
          }
        });
      });

      // 5. Clientes quentes
      const clientesQuentes = clients.filter((c: any) => {
        const isActive = !["ganho", "perdido"].includes(String(c.status || "").toLowerCase());
        const isHot = String(c.temperature || "").toLowerCase() === "quente" || String(c.closingProbability || "").toLowerCase() === "alta";
        return isActive && isHot;
      });

      clientesQuentes.forEach((c: any) => {
        // Only include if not already in previous high-priority categories to avoid duplicate clients
        if (rawCandidates.some(r => r.clientId === (c.id || c._id))) return;

        rawCandidates.push({
          clientId: c.id || c._id,
          clientName: c.name,
          category: "Clientes quentes",
          reason: `Cliente quente com alta probabilidade de fechamento ativo no CRM.`,
          suggestion: `Manter o cliente engajado oferecendo suporte imediato ou novas informações do andamento da negociação.`,
          actionType: "whatsapp",
          priority: "Alta",
          actionPayload: {
            phone: c.phone || "",
            message: `Olá, ${c.name.split(" ")[0]}! Tudo bem? Passando para te desejar uma excelente semana e reforçar que estou à disposição para ajudar no que for preciso sobre a sua busca imobiliária. Conseguiu pensar mais sobre as opções que enviamos?`,
            taskTitle: `Manter engajamento: ${c.name}`,
            taskDescription: `Engajamento com lead quente / alta probabilidade.`,
            taskType: "Ligar"
          }
        });
      });

      // 6. Negociações paradas
      const negociacoesParadas = clients.filter((c: any) => {
        const isActive = String(c.status || "").toLowerCase() === "em atendimento" || c.pipelineStatus;
        if (!isActive) return false;
        
        let lastActivity = c.updatedAt ? Date.parse(c.updatedAt) : (c.createdAt ? Date.parse(c.createdAt) : Date.now());
        if (c.history && c.history.length > 0) {
          c.history.forEach((h: any) => {
            const hDate = Date.parse(h.date);
            if (!isNaN(hDate) && hDate > lastActivity) {
              lastActivity = hDate;
            }
          });
        }
        const diffHours = (Date.now() - lastActivity) / (1000 * 60 * 60);
        return diffHours > 48;
      });

      negociacoesParadas.forEach((c: any) => {
        if (rawCandidates.some(r => r.clientId === (c.id || c._id))) return;

        rawCandidates.push({
          clientId: c.id || c._id,
          clientName: c.name,
          category: "Negociações paradas",
          reason: `Cliente em atendimento está sem novas interações ou registros comerciais há mais de 48 horas.`,
          suggestion: `Reativar contato sugerindo uma rápida conversa ou apresentando uma nova excelente oportunidade.`,
          actionType: "whatsapp",
          priority: "Média",
          actionPayload: {
            phone: c.phone || "",
            message: `Olá, ${c.name.split(" ")[0]}! Como vão as coisas? Acabou de entrar em nossa carteira uma nova oportunidade incrível que tem tudo a ver com o seu perfil. Posso te enviar as fotos e a ficha técnica?`,
            taskTitle: `Reativar contato com ${c.name}`,
            taskDescription: `Negociação estagnada há mais de 48 horas. Reativar interesse.`,
            taskType: "Enviar imóvel"
          }
        });
      });

      // 7. Tarefas do dia
      const tarefasDoDia = tasks.filter((t: any) => !t.completed && t.date === todayStr);
      tarefasDoDia.forEach((t: any) => {
        const client = clients.find((c: any) => c.id === t.clientId || c._id === t.clientId || c.name === t.clientName);
        if (rawCandidates.some(r => r.clientId === client?.id || r.clientId === client?._id)) return;

        rawCandidates.push({
          clientId: client?.id || client?._id || "unknown",
          clientName: t.clientName,
          category: "Tarefas do dia",
          reason: `Você tem a atividade "${t.title}" agendada para hoje às ${t.time}.`,
          suggestion: `Executar o follow-up planejado no cronograma diário do CRM.`,
          actionType: "whatsapp",
          priority: "Média",
          actionPayload: {
            phone: client?.phone || "",
            message: `Olá, ${t.clientName.split(" ")[0]}! Tudo bem? Estou entrando em contato conforme havíamos combinado hoje para conversarmos sobre os próximos passos da busca de imóvel. Como está sua agenda hoje?`,
            taskTitle: t.title,
            taskDescription: t.description,
            taskType: t.type
          }
        });
      });

      // Limit to 5 recommendations
      let finalRecommendations = rawCandidates.slice(0, 6);

      // If no raw candidates, generate standard rule-based proactive suggestions
      if (finalRecommendations.length === 0) {
        finalRecommendations = [
          {
            clientId: "proactive-1",
            clientName: "Novos Clientes",
            category: "Prospecção",
            reason: "Nenhuma pendência crítica ou atrasada foi detectada em sua carteira de clientes no momento.",
            suggestion: "Aproveite o tempo livre para cadastrar novos leads ou realizar prospecção ativa de novos imóveis.",
            actionType: "open_client",
            priority: "Média",
            actionPayload: {
              phone: "",
              message: ""
            }
          },
          {
            clientId: "proactive-2",
            clientName: "Carteira Imobiliária",
            category: "Gestão de Carteira",
            reason: "Todos os seus atendimentos e follow-ups estão rigorosamente em dia hoje.",
            suggestion: "Revise seus imóveis cadastrados para verificar se há fotos pendentes ou descrições que possam ser otimizadas com IA.",
            actionType: "open_client",
            priority: "Média",
            actionPayload: {
              phone: "",
              message: ""
            }
          }
        ];
      }

      // If Gemini is active and we have real data (not just fallback proactives), enhance with AI!
      if (ai && rawCandidates.length > 0) {
        try {
          const prompt = `Você é um mentor e assistente de inteligência artificial de elite para corretores imobiliários brasileiros no Metria CRM.
Sua tarefa é analisar os seguintes candidatos de "Próxima Melhor Ação" identificados nas bases de dados do CRM e refinar o motivo (reason) e a sugestão (suggestion) para cada um deles.

Crie recomendações de altíssimo nível, escritas de forma natural, comercial, empática e direta, sem clichês exagerados ou jargões artificiais ("AI slop").
IMPORTANTE: Nunca invente informações de imóveis, valores ou datas que não existam nos dados do candidato abaixo. Se a informação não estiver presente, limite-se a usar o que foi fornecido ou escreva de forma geral sem inventar dados específicos.

Aqui estão os dados dos candidatos identificados:
${JSON.stringify(finalRecommendations, null, 2)}

Por favor, retorne um JSON correspondente a uma lista de objetos, onde cada objeto mantém o "clientId", "clientName", "actionType" e a estrutura de "actionPayload" fornecidos, mas aprimora e enriquece os seguintes campos:
- "reason": Um motivo convincente e claro de por que agir hoje (ex: "João está há 3 dias sem retorno após a visita no imóvel 'Apartamento Jardins'").
- "suggestion": Uma sugestão direta e estratégica de ação comercial (ex: "Enviar uma mensagem simpática pelo WhatsApp perguntando o que achou dos acabamentos e do sol da manhã para colher feedback.").
- "priority": Prioridade recalculada ("Crítica", "Alta" ou "Média") com base na gravidade ou calor do lead.
- "actionPayload.message": Escreva um texto pré-formatado ideal e extremamente natural para ser enviado via WhatsApp no mercado brasileiro, sem parecer um robô, citando os dados reais e perguntando de forma leve.

Retorne APENAS o array JSON válido no formato esperado.`;

          const response = await generateContentWithRetry(() => ai!.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    clientId: { type: Type.STRING },
                    clientName: { type: Type.STRING },
                    category: { type: Type.STRING },
                    reason: { type: Type.STRING, description: "Explicação em tom comercial do motivo da recomendação." },
                    suggestion: { type: Type.STRING, description: "Sugestão prática do que o corretor deve fazer." },
                    actionType: { type: Type.STRING },
                    priority: { type: Type.STRING, description: "Grau de prioridade: Crítica, Alta ou Média." },
                    actionPayload: {
                      type: Type.OBJECT,
                      properties: {
                        phone: { type: Type.STRING },
                        message: { type: Type.STRING, description: "Mensagem pré-formatada para WhatsApp personalizada com o primeiro nome do cliente, natural e direta." },
                        taskTitle: { type: Type.STRING },
                        taskDescription: { type: Type.STRING },
                        taskType: { type: Type.STRING }
                      },
                      required: ["phone"]
                    }
                  },
                  required: ["clientId", "clientName", "reason", "suggestion", "actionType", "priority", "actionPayload"]
                }
              }
            }
          }));

          if (response.text) {
            const parsed = JSON.parse(response.text);
            if (Array.isArray(parsed) && parsed.length > 0) {
              finalRecommendations = parsed;
            }
          }
        } catch (aiErr) {
          console.error("Erro ao chamar o Gemini para refinar ações, usando fallback de regras:", aiErr);
          // Fall back gracefully to finalRecommendations (which has the beautifully constructed rule-based data)
        }
      }

      res.json(finalRecommendations);
    } catch (err: any) {
      console.error("Erro na rota Next Best Action:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- USER AUTHENTICATION & PROFILE ---

  // Get current authenticated user
  app.get("/api/auth/me", async (req, res) => {
    try {
      let token = null;

      // 1. Check Authorization Header
      const authHeader = req.headers.authorization || "";
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }

      // 2. Check session_id Cookie
      if (!token) {
        const cookieHeader = req.headers.cookie || "";
        const match = cookieHeader.match(/(?:^|;\s*)session_id=([^;]+)/);
        token = match ? match[1] : null;
      }

      if (!token) {
        return res.status(401).json({ error: "Sessão expirada ou não autenticado." });
      }

      const session = db.getSession(token);
      if (!session) {
        return res.status(401).json({ error: "Sessão inválida ou expirada." });
      }

      const users = await db.getUsers();
      const user = users.find(u => u.id === session.userId || u._id?.toString() === session.userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado." });
      }

      const { password: _, ...clean } = user;
      res.json(clean);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Nome de usuário/e-mail e senha são obrigatórios." });
      }

      const user = await db.validateUser(username, password);
      if (!user) {
        return res.status(401).json({ error: "E-mail, usuário ou senha incorretos." });
      }

      const sessionToken = db.createSession(user.id!);
      res.cookie("session_id", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/"
      });

      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Register a new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, name, email, avatarUrl, role, phone } = req.body;
      if (!username || !password || !name || !email) {
        return res.status(400).json({ error: "Campos obrigatórios: usuário, senha, nome e e-mail" });
      }
      
      const allUsers = await db.getUsers();
      const usernameExists = allUsers.some(u => u.username.toLowerCase() === username.toLowerCase());
      if (usernameExists) {
        return res.status(400).json({ error: "Este nome de usuário já está em uso." });
      }

      const emailExists = allUsers.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        return res.status(400).json({ error: "Este endereço de e-mail já está em uso." });
      }

      const newUser = await db.registerUser({
        username,
        password,
        name,
        email,
        avatarUrl,
        role,
        phone
      });

      const sessionToken = db.createSession(newUser.id!);
      res.cookie("session_id", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/"
      });

      res.status(201).json(newUser);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    try {
      const cookieHeader = req.headers.cookie || "";
      const match = cookieHeader.match(/session_id=([^;]+)/);
      const token = match ? match[1] : null;

      if (token) {
        db.deleteSession(token);
      }

      res.clearCookie("session_id", { path: "/" });
      res.json({ message: "Logout realizado com sucesso." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update user profile (Only authenticated and owner)
  app.put("/api/auth/update/:id", requireAuth, validateId, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      if (req.userId !== id) {
        return res.status(403).json({ error: "Você não tem permissão para atualizar o perfil de outro usuário." });
      }

      const updated = await db.updateUser(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- VITE MIDDLEWARE / STATIC FILES ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Metria CRM Server running on http://localhost:${PORT}`);
  });
}

startServer();
