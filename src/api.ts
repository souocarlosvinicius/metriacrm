import { getInitialDemoData } from "./demoData";

// Helper to check if the current session is a Demo mode session
function isDemoSession(): boolean {
  const saved = localStorage.getItem("vega_crm_user");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return parsed && parsed.isDemo === true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

// Lazy initialization of demo data in localStorage
const getLocalData = (key: string, initialFetcher: () => any) => {
  const existing = localStorage.getItem(key);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {
      console.error(`Error parsing ${key}`, e);
    }
  }
  const initial = initialFetcher();
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
};

const saveLocalData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initial state helpers
const getInitialProps = () => getInitialDemoData().properties;
const getInitialClients = () => getInitialDemoData().clients;
const getInitialProposals = () => getInitialDemoData().proposals;
const getInitialVisits = () => getInitialDemoData().visits;
const getInitialTasks = () => getInitialDemoData().tasks;

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  // If NOT demo session, proceed with real API call
  if (!isDemoSession() && !url.includes("/api/demo/reset") && !url.includes("isDemo=true")) {
    if (url.startsWith("/api/")) {
      const saved = localStorage.getItem("vega_crm_user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.sessionToken) {
            init = init || {};
            const headers = new Headers(init.headers || {});
            if (!headers.has("Authorization")) {
              headers.set("Authorization", `Bearer ${parsed.sessionToken}`);
            }
            init.headers = headers;
          }
        } catch (e) {
          console.error("Error parsing user session for fetch interceptor:", e);
        }
      }
    }
    return window.fetch(input, init);
  }

  // --- DEMO MODE ACTIVE: INTERCEPTING ALL API CALLS ---
  const method = (init?.method || "GET").toUpperCase();
  const urlObj = new URL(url, "http://localhost");
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;

  let body: any = null;
  if (init?.body) {
    try {
      body = JSON.parse(init.body as string);
    } catch (e) {
      // body is not JSON
    }
  }

  // Helper to construct a mock JSON response
  const mockResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" }
    });
  };

  // Helper to get active user details
  const getDemoUser = () => {
    const saved = localStorage.getItem("vega_crm_user");
    return saved ? JSON.parse(saved) : { name: "Carlos Brito", username: "carlos_demo" };
  };

  // 1. SYSTEM STATUS
  if (pathname === "/api/status") {
    return mockResponse({
      dbType: "Demonstração Offline Local",
      mongoActive: false,
      geminiActive: true
    });
  }

  // 2. DEMO RESET ENDPOINT
  if (pathname === "/api/demo/reset") {
    localStorage.removeItem("demo_properties");
    localStorage.removeItem("demo_clients");
    localStorage.removeItem("demo_proposals");
    localStorage.removeItem("demo_visits");
    localStorage.removeItem("demo_tasks");

    // Pre-initialize fresh demo data
    getLocalData("demo_properties", getInitialProps);
    getLocalData("demo_clients", getInitialClients);
    getLocalData("demo_proposals", getInitialProposals);
    getLocalData("demo_visits", getInitialVisits);
    getLocalData("demo_tasks", getInitialTasks);

    return mockResponse({ success: true, message: "Dados de demonstração resetados com sucesso!" });
  }

  // 3. PROPERTIES
  if (pathname === "/api/properties") {
    const list = getLocalData("demo_properties", getInitialProps);
    if (method === "GET") {
      const modality = searchParams.get("modality");
      const search = searchParams.get("search");
      let filtered = [...list];

      if (modality && modality !== "Todos") {
        filtered = filtered.filter((p: any) => p.modality?.toLowerCase() === modality.toLowerCase());
      }
      if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter((p: any) => 
          p.title?.toLowerCase().includes(query) ||
          p.neighborhood?.toLowerCase().includes(query) ||
          p.city?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
        );
      }
      return mockResponse(filtered);
    } else if (method === "POST") {
      const newProp = {
        ...body,
        id: `demo-prop-${Date.now()}`,
        code: `IM-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString()
      };
      list.unshift(newProp);
      saveLocalData("demo_properties", list);
      return mockResponse(newProp, 201);
    }
  }

  const propMatch = pathname.match(/^\/api\/properties\/([^\/]+)$/);
  if (propMatch) {
    const id = propMatch[1];
    const list = getLocalData("demo_properties", getInitialProps);
    if (method === "GET") {
      const item = list.find((p: any) => p.id === id || p._id === id);
      return item ? mockResponse(item) : mockResponse({ error: "Imóvel não encontrado" }, 404);
    } else if (method === "PUT") {
      const index = list.findIndex((p: any) => p.id === id || p._id === id);
      let updated = body;
      if (index !== -1) {
        updated = { ...list[index], ...body, id };
        list[index] = updated;
        saveLocalData("demo_properties", list);
      }
      return mockResponse(updated);
    } else if (method === "DELETE") {
      const updatedList = list.filter((p: any) => p.id !== id && p._id !== id);
      saveLocalData("demo_properties", updatedList);
      return mockResponse({ success: true });
    }
  }

  // 4. CLIENTS
  if (pathname === "/api/clients") {
    const list = getLocalData("demo_clients", getInitialClients);
    if (method === "GET") {
      return mockResponse(list);
    } else if (method === "POST") {
      const newClient = {
        ...body,
        id: `demo-client-${Date.now()}`,
        status: body.status || "Novo",
        createdAt: body.createdAt || new Date().toISOString(),
        history: body.history || [
          {
            id: Math.random().toString(36).substring(2, 11),
            type: "creation",
            date: new Date().toISOString(),
            description: "Lead criado no sistema",
            userName: getDemoUser().name
          }
        ]
      };
      list.unshift(newClient);
      saveLocalData("demo_clients", list);
      return mockResponse(newClient, 201);
    }
  }

  const clientMatch = pathname.match(/^\/api\/clients\/([^\/]+)$/);
  if (clientMatch) {
    const id = clientMatch[1];
    const list = getLocalData("demo_clients", getInitialClients);
    if (method === "GET") {
      const item = list.find((c: any) => c.id === id || c._id === id);
      return item ? mockResponse(item) : mockResponse({ error: "Cliente não encontrado" }, 404);
    } else if (method === "PUT") {
      const index = list.findIndex((c: any) => c.id === id || c._id === id);
      let updated = body;
      if (index !== -1) {
        const oldClient = list[index];
        const userName = getDemoUser().name;
        
        // Dynamic audit trail history logging
        const existingHistory = body.history || oldClient.history || [
          {
            id: Math.random().toString(36).substring(2, 11),
            type: "creation",
            date: oldClient.createdAt || new Date().toISOString(),
            description: "Lead criado no sistema"
          }
        ];

        const additionalEntries = [];

        if (body.status !== undefined && body.status !== oldClient.status) {
          additionalEntries.push({
            id: Math.random().toString(36).substring(2, 11),
            type: "status_change",
            date: new Date().toISOString(),
            description: `Status alterado de "${oldClient.status || "Sem Status"}" para "${body.status}"`,
            userName
          });
        }

        if (body.pipelineStatus !== undefined && body.pipelineStatus !== oldClient.pipelineStatus) {
          additionalEntries.push({
            id: Math.random().toString(36).substring(2, 11),
            type: "pipeline_change",
            date: new Date().toISOString(),
            description: `Etapa do pipeline alterada de "${oldClient.pipelineStatus || "Sem etapa"}" para "${body.pipelineStatus}"`,
            userName
          });
        }

        if (
          (body.status === "Perdido" || body.pipelineStatus === "Perdido") &&
          body.lossReason &&
          body.lossReason !== oldClient.lossReason
        ) {
          additionalEntries.push({
            id: Math.random().toString(36).substring(2, 11),
            type: "loss",
            date: new Date().toISOString(),
            description: `Motivo de perda registrado: "${body.lossReason}"`,
            userName
          });
        }

        let finalHistory = existingHistory;
        if (additionalEntries.length > 0) {
          finalHistory = [...existingHistory, ...additionalEntries];
        }

        updated = { ...oldClient, ...body, id, history: finalHistory, updatedAt: new Date().toISOString() };
        list[index] = updated;
        saveLocalData("demo_clients", list);
      }
      return mockResponse(updated);
    } else if (method === "DELETE") {
      const updatedList = list.filter((c: any) => c.id !== id && c._id !== id);
      saveLocalData("demo_clients", updatedList);
      return mockResponse({ success: true });
    }
  }

  // 5. PROPOSALS
  if (pathname === "/api/proposals") {
    const list = getLocalData("demo_proposals", getInitialProposals);
    if (method === "GET") {
      return mockResponse(list);
    } else if (method === "POST") {
      const newProposal = {
        ...body,
        id: `demo-proposal-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      list.unshift(newProposal);
      saveLocalData("demo_proposals", list);
      return mockResponse(newProposal, 201);
    }
  }

  const proposalMatch = pathname.match(/^\/api\/proposals\/([^\/]+)$/);
  if (proposalMatch) {
    const id = proposalMatch[1];
    const list = getLocalData("demo_proposals", getInitialProposals);
    if (method === "PUT") {
      const index = list.findIndex((p: any) => p.id === id || p._id === id);
      let updated = body;
      if (index !== -1) {
        updated = { ...list[index], ...body, id };
        list[index] = updated;
        saveLocalData("demo_proposals", list);
      }
      return mockResponse(updated);
    } else if (method === "DELETE") {
      const updatedList = list.filter((p: any) => p.id !== id && p._id !== id);
      saveLocalData("demo_proposals", updatedList);
      return mockResponse({ success: true });
    }
  }

  // 6. VISITS
  if (pathname === "/api/visits") {
    const list = getLocalData("demo_visits", getInitialVisits);
    if (method === "GET") {
      return mockResponse(list);
    } else if (method === "POST") {
      const newVisit = {
        ...body,
        id: `demo-visit-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      list.unshift(newVisit);
      saveLocalData("demo_visits", list);
      return mockResponse(newVisit, 201);
    }
  }

  const visitMatch = pathname.match(/^\/api\/visits\/([^\/]+)$/);
  if (visitMatch) {
    const id = visitMatch[1];
    const list = getLocalData("demo_visits", getInitialVisits);
    if (method === "PUT") {
      const index = list.findIndex((v: any) => v.id === id || v._id === id);
      let updated = body;
      if (index !== -1) {
        updated = { ...list[index], ...body, id };
        list[index] = updated;
        saveLocalData("demo_visits", list);
      }
      return mockResponse(updated);
    } else if (method === "DELETE") {
      const updatedList = list.filter((v: any) => v.id !== id && v._id !== id);
      saveLocalData("demo_visits", updatedList);
      return mockResponse({ success: true });
    }
  }

  // 7. TASKS
  if (pathname === "/api/tasks") {
    const list = getLocalData("demo_tasks", getInitialTasks);
    if (method === "GET") {
      return mockResponse(list);
    } else if (method === "POST") {
      const newTask = {
        ...body,
        id: `demo-task-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      list.unshift(newTask);
      saveLocalData("demo_tasks", list);
      return mockResponse(newTask, 201);
    }
  }

  const taskMatch = pathname.match(/^\/api\/tasks\/([^\/]+)$/);
  if (taskMatch) {
    const id = taskMatch[1];
    const list = getLocalData("demo_tasks", getInitialTasks);
    if (method === "PUT") {
      const index = list.findIndex((t: any) => t.id === id || t._id === id);
      let updated = body;
      if (index !== -1) {
        updated = { ...list[index], ...body, id };
        list[index] = updated;
        saveLocalData("demo_tasks", list);
      }
      return mockResponse(updated);
    } else if (method === "DELETE") {
      const updatedList = list.filter((t: any) => t.id !== id && t._id !== id);
      saveLocalData("demo_tasks", updatedList);
      return mockResponse({ success: true });
    }
  }

  // 8. PROFILE / AUTH UPDATE
  const authMatch = pathname.match(/^\/api\/auth\/update\/([^\/]+)$/);
  if (authMatch) {
    const id = authMatch[1];
    const user = getDemoUser();
    const updatedUser = { ...user, ...body, id };
    localStorage.setItem("vega_crm_user", JSON.stringify(updatedUser));
    return mockResponse(updatedUser);
  }

  // 9. IMAGE UPLOAD
  if (pathname === "/api/upload") {
    return mockResponse({ url: body?.dataUrl || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80" });
  }

  // 10. AI GENERATE PROPERTY DESCRIPTION
  if (pathname === "/api/ai/generate-description") {
    const { title, type, condition, modality, neighborhood, city, price, bedrooms, suites, bathrooms, parkingSpots, area, amenities } = body;
    const priceStr = price ? Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "Sob Consulta";
    const amenitiesStr = amenities && amenities.length > 0 ? amenities.join(", ") : "Lazer completo, segurança 24h";

    const professional = `Excelente oportunidade imobiliária em região valorizada. Apresentamos este primoroso ${type || "Imóvel"} de ${condition || "excelente estado"}, com acabamentos impecáveis e excelente aproveitamento de espaços. Situado no cobiçado bairro ${neighborhood || "Bairro Nobre"} de ${city || "Uberlândia"}, ele conta com ${area || 100}m² de área privativa muito bem distribuída. Dispõe de ${bedrooms || 3} dormitórios generosos, sendo ${suites || 1} suíte(s), ideal para garantir total privacidade e bem-estar. O condomínio oferece infraestrutura robusta incluindo: ${amenitiesStr}. Oferecido para ${modality || "Venda"} por apenas ${priceStr}. Agende sua visita e conheça todos os diferenciais!`;

    const whatsapp = `🚀 *OPORTUNIDADE DE OURO!* 🚀\n\nConfira esse espetacular *${type || "Imóvel"}* em *${neighborhood || "Bairro Nobre"}* (${city || "Uberlândia"})!\n\n✨ *Diferenciais de peso:*\n• Espaço: ${area || 100}m² de conforto total\n• Quartos: ${bedrooms || 3} amplos (${suites || 1} suíte privativa)\n• Vagas: ${parkingSpots || 1} vaga(s) reservada(s)\n• Lazer do condomínio: ${amenitiesStr}\n\n💵 *Preço Incrível:* ${priceStr}\n\nPerfeito para morar ou investir com alta rentabilidade. Fale comigo agora e agende sua visita! 📲`;

    const portal = `Diga olá para a sua nova conquista! Amplo e moderno ${type || "Imóvel"} de ${area || 100}m² privativos, em localização estratégica e privilegiada dentro do bairro ${neighborhood || "Bairro Nobre"}. Living acolhedor para dois ambientes com excelente iluminação natural, copa-cozinha equipada com excelentes armários planejados, área de serviços independente e ${parkingSpots || 1} vagas de garagem exclusivas. Planta versátil de ${bedrooms || 3} dormitórios com ${suites || 1} suíte acolhedora. Segurança 24 horas e lazer agradável (${amenitiesStr}). Oportunidade por ${priceStr}. Aceita financiamento bancário imediato.`;

    return mockResponse({ professional, whatsapp, portal });
  }

  // 11. AI SUGGEST TASKS
  if (pathname === "/api/ai/suggest-tasks") {
    const clientsList = getLocalData("demo_clients", getInitialClients);
    const marian = clientsList.find((c: any) => c.name.includes("Mariana")) || { name: "Mariana Alencar Silva" };
    const thiago = clientsList.find((c: any) => c.name.includes("Thiago")) || { name: "Thiago Vasconcelos" };
    const aline = clientsList.find((c: any) => c.name.includes("Aline")) || { name: "Aline Torres" };

    return mockResponse([
      {
        title: `Seguir com Mariana Alencar`,
        clientName: marian.name,
        description: "Oferecer a luxuosa Casa no Jardins Madri (Goiânia). Ela demonstrou alta qualificação e busca um condomínio fechado seguro para seus filhos.",
        time: "10:30",
        type: "FOLLOW-UP"
      },
      {
        title: `Minuta de contrato para Aline`,
        clientName: aline.name,
        description: "Entrar em contato para agilizar o envio das certidões negativas restantes e fechar a aprovação jurídica do aluguel comercial.",
        time: "14:15",
        type: "CONTRATO"
      },
      {
        title: `Marcar visita com Thiago`,
        clientName: thiago.name,
        description: "Apresentar a Cobertura Duplex no Jardim Botânico. Ele é investidor quente e busca um imóvel elegante com piscina privativa.",
        time: "16:45",
        type: "VISITA"
      }
    ]);
  }

  // 12. AI NEXT BEST ACTIONS ENGINE (algorithmic replication)
  if (pathname === "/api/ai/next-best-actions") {
    const clientsList = getLocalData("demo_clients", getInitialClients);
    const tasksList = getLocalData("demo_tasks", getInitialTasks);
    const proposalsList = getLocalData("demo_proposals", getInitialProposals);
    const visitsList = getLocalData("demo_visits", getInitialVisits);

    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();
    const currentHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const rawCandidates: any[] = [];

    // 12.1 Leads sem contato
    const leadsSemContato = clientsList.filter((c: any) => {
      const isNew = String(c.status || "").toLowerCase() === "novo" || String(c.profileType || "").toLowerCase() === "lead";
      const isActive = !["ganho", "perdido"].includes(String(c.status || "").toLowerCase());
      const hasCompletedTask = tasksList.some((t: any) => t.completed && (t.clientId === c.id || t.clientId === c._id));
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

    // 12.2 Follow-ups atrasados
    const followupsAtrasados = tasksList.filter((t: any) => {
      if (t.completed) return false;
      if (t.date < todayStr) return true;
      if (t.date === todayStr && t.time < currentHM) return true;
      return false;
    });

    followupsAtrasados.forEach((t: any) => {
      const client = clientsList.find((c: any) => c.id === t.clientId || c._id === t.clientId || c.name === t.clientName);
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

    // 12.3 Propostas abertas
    const propostasAbertas = proposalsList.filter((p: any) => 
      ["pendente", "em análise", "em analise"].includes(String(p.status || "").toLowerCase())
    );

    propostasAbertas.forEach((p: any) => {
      const client = clientsList.find((c: any) => c.id === p.clientId || c._id === p.clientId || c.name === p.clientName);
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

    // 12.4 Visitas realizadas sem retorno
    const visitasSemRetorno = visitsList.filter((v: any) => {
      if (String(v.status || "").toLowerCase() !== "realizada") return false;
      const hasFeedback = v.feedback && v.feedback.trim().length > 0;
      return !hasFeedback;
    });

    visitasSemRetorno.forEach((v: any) => {
      const client = clientsList.find((c: any) => c.id === v.clientId || c._id === v.clientId || c.name === v.clientName);
      rawCandidates.push({
        clientId: v.clientId,
        clientName: v.clientName,
        category: "Visitas realizadas sem feedback",
        reason: `A visita ao imóvel "${v.propertyTitle}" foi realizada no dia ${v.date.split("-").reverse().join("/")}, mas ainda não foi colhido feedback estruturado do cliente.`,
        suggestion: `Saber a opinião do cliente pós-visita para qualificar interesse ou direcionar para outro imóvel compatível.`,
        actionType: "whatsapp",
        priority: "Média",
        actionPayload: {
          phone: client?.phone || "",
          message: `Olá, ${v.clientName.split(" ")[0]}! Tudo bem? Gostaria de saber o que você achou do imóvel ${v.propertyTitle} que visitamos recentemente? A planta, a incidência de sol e o condomínio atenderam o que você esperava? Ficaria feliz em ouvir seu feedback!`,
          taskTitle: `Registrar feedback da visita: ${v.clientName}`,
          taskDescription: `Entrar em contato para colher feedback detalhado sobre a visita ao imóvel ${v.propertyTitle}`,
          taskType: "Cobrar retorno"
        }
      });
    });

    return mockResponse(rawCandidates.slice(0, 5));
  }

  return mockResponse({ error: "Endpoint não suportado no modo de demonstração local." }, 404);
}
