import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db.js";
import { GoogleGenAI } from "@google/genai";

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware to require authentication on private API endpoints
  const requireAuth = (req: any, res: any, next: any) => {
    const cookieHeader = req.headers.cookie || "";
    const match = cookieHeader.match(/session_id=([^;]+)/);
    const token = match ? match[1] : null;

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

  // Get property by ID
  app.get("/api/properties/:id", requireAuth, async (req: any, res) => {
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
  app.put("/api/properties/:id", requireAuth, async (req: any, res) => {
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
  app.delete("/api/properties/:id", requireAuth, async (req: any, res) => {
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
  app.get("/api/clients/:id", requireAuth, async (req: any, res) => {
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
  app.put("/api/clients/:id", requireAuth, async (req: any, res) => {
    try {
      const updated = await db.updateClient(req.params.id, req.body, req.userId);
      if (!updated) {
        return res.status(404).json({ error: "Cliente não encontrado para atualização ou permissão negada" });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete client
  app.delete("/api/clients/:id", requireAuth, async (req: any, res) => {
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
      res.status(201).json(newTask);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update task
  app.put("/api/tasks/:id", requireAuth, async (req: any, res) => {
    try {
      const updated = await db.updateTask(req.params.id, req.body, req.userId);
      if (!updated) {
        return res.status(404).json({ error: "Tarefa não encontrada para atualização ou permissão negada" });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete task
  app.delete("/api/tasks/:id", requireAuth, async (req: any, res) => {
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
      res.status(211).json(proposal);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update proposal
  app.put("/api/proposals/:id", requireAuth, async (req: any, res) => {
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
  app.delete("/api/proposals/:id", requireAuth, async (req: any, res) => {
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
      res.status(211).json(visit);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update visit
  app.put("/api/visits/:id", requireAuth, async (req: any, res) => {
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
  app.delete("/api/visits/:id", requireAuth, async (req: any, res) => {
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

  // Generate elegant property descriptions
  app.post("/api/ai/generate-description", requireAuth, async (req: any, res) => {
    if (!ai) {
      return res.status(400).json({
        error: "O serviço de inteligência artificial não está configurado. Por favor, configure GEMINI_API_KEY.",
      });
    }

    try {
      const { title, type, condition, modality, neighborhood, city, bedrooms, suites, bathrooms, area, amenities } = req.body;

      const prompt = `Você é um redator imobiliário sênior focado no mercado de alto padrão brasileiro.
Escreva um anúncio imobiliário extremamente sedutor, profissional e bem formatado para o seguinte imóvel:

Título: ${title || "Imóvel Premium"}
Tipo de Imóvel: ${type || "Apartamento"}
Condição: ${condition || "Novo"}
Modalidade: ${modality || "Venda"}
Bairro/Localidade: ${neighborhood || "Bairro nobre"}
Cidade: ${city || "São Paulo / SP"}
Quartos: ${bedrooms || 0} (${suites || 0} suítes)
Banheiros: ${bathrooms || 0}
Área: ${area || 0}m²
Comodidades/Lazer: ${Array.isArray(amenities) ? amenities.join(", ") : "Área de lazer de qualidade"}

Diretrizes da Redação:
1. Comece com um gancho envolvente focado no estilo de vida e nas vantagens da localização.
2. Destaque os detalhes arquitetônicos e de conforto (ex: iluminação natural, acabamentos modernos, aproveitamento de espaço).
3. Crie uma seção com marcadores ou tópicos curtos chamada "Destaques do Imóvel" listando as especificações técnicas de forma chique.
4. Finalize com uma chamada para ação (CTA) convidativa para agendar uma visita e fechar negócio.
5. Escreva estritamente em português de Portugal/Brasil correto e refinado, sem gírias infantis ou termos exagerados de 'AI slop'. Use o tom 'Emerald Estate Professional' (confiança, estabilidade e elegância).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ description: response.text });
    } catch (err: any) {
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

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsedTasks = JSON.parse(response.text || "[]");
      res.json(parsedTasks);
    } catch (err: any) {
      res.status(500).json({ error: `Falha na IA: ${err.message}` });
    }
  });

  // --- USER AUTHENTICATION & PROFILE ---

  // Get current authenticated user
  app.get("/api/auth/me", async (req, res) => {
    try {
      const cookieHeader = req.headers.cookie || "";
      const match = cookieHeader.match(/session_id=([^;]+)/);
      const token = match ? match[1] : null;

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
  app.put("/api/auth/update/:id", requireAuth, async (req: any, res) => {
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
