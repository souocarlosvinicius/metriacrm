import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  ArrowLeft, 
  ArrowRight, 
  Link as LinkIcon, 
  Unlink, 
  Plus, 
  Home, 
  DollarSign, 
  Search, 
  X, 
  Check, 
  SlidersHorizontal,
  FolderSync,
  ChevronRight,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  FileText,
  BadgeAlert
} from "lucide-react";
import { Client, Property } from "../types";

// Funnel stages in correct chronological order
const PIPELINE_STAGES = [
  "Em Atendimento",
  "Em Visita",
  "Em Proposta",
  "Fase de Contrato",
  "Contrato Assinado",
  "Fase de Documentação",
  "Finalização do Processo"
];

// Helper to get visual theme colors and icon for each stage to make it beautiful
const getStageDetails = (stage: string) => {
  switch (stage) {
    case "Em Atendimento":
      return { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-600 dark:text-blue-400", label: "Atendimento" };
    case "Em Visita":
      return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-600 dark:text-amber-400", label: "Visita" };
    case "Em Proposta":
      return { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-600 dark:text-purple-400", label: "Proposta" };
    case "Fase de Contrato":
      return { bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-600 dark:text-indigo-400", label: "Fase Contrato" };
    case "Contrato Assinado":
      return { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", label: "Assinado" };
    case "Fase de Documentação":
      return { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-600 dark:text-teal-400", label: "Documentação" };
    case "Finalização do Processo":
      return { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-600 dark:text-green-400", label: "Finalizado" };
    default:
      return { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-600", label: "Indefinido" };
  }
};

interface PipelineViewProps {
  clients: Client[];
  properties: Property[];
  onUpdateClient: (client: Client) => Promise<void>;
  onSelectClient: (client: Client) => void;
  onAddClient: (client: Omit<Client, "id">) => Promise<void>;
}

export default function PipelineView({ 
  clients, 
  properties, 
  onUpdateClient, 
  onSelectClient,
  onAddClient 
}: PipelineViewProps) {
  const [linkingClient, setLinkingClient] = useState<Client | null>(null);
  const [propertySearch, setPropertySearch] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Quick Client Add states
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newProfileType, setNewProfileType] = useState("Lead");
  const [newObjective, setNewObjective] = useState("Venda");
  const [newPropType, setNewPropType] = useState("Apartamento");
  const [newStage, setNewStage] = useState("Em Atendimento");
  const [isSubmittingQuickAdd, setIsSubmittingQuickAdd] = useState(false);

  // Handle stage movement
  const moveStage = async (client: Client, direction: "prev" | "next") => {
    const currentStage = client.pipelineStatus || "Em Atendimento";
    const currentIndex = PIPELINE_STAGES.indexOf(currentStage);
    
    let newIndex = currentIndex;
    if (direction === "prev" && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === "next" && currentIndex < PIPELINE_STAGES.length - 1) {
      newIndex = currentIndex + 1;
    }

    if (newIndex !== currentIndex) {
      const updated: Client = {
        ...client,
        pipelineStatus: PIPELINE_STAGES[newIndex],
        status: PIPELINE_STAGES[newIndex] === "Finalização do Processo" ? "Ganho" : client.status
      };
      await onUpdateClient(updated);
    }
  };

  // Set precise stage dropdown
  const setSpecificStage = async (client: Client, stage: string) => {
    const updated: Client = {
      ...client,
      pipelineStatus: stage,
      status: stage === "Finalização do Processo" ? "Ganho" : client.status
    };
    await onUpdateClient(updated);
  };

  // Link property
  const handleLinkProperty = async (client: Client, propertyId: string | undefined) => {
    const updated: Client = {
      ...client,
      linkedPropertyId: propertyId
    };
    await onUpdateClient(updated);
    setLinkingClient(null);
    setPropertySearch("");
  };

  // Quick create client in pipeline
  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) {
      alert("Nome e telefone são necessários!");
      return;
    }

    setIsSubmittingQuickAdd(true);
    try {
      const budgetVal = Number(newBudget) || 0;
      const clientPayload: Omit<Client, "id"> = {
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || "contato@exemplo.com",
        document: "",
        profileType: newProfileType,
        objective: newObjective,
        propertyType: newPropType,
        minBudget: Math.floor(budgetVal * 0.8),
        maxBudget: budgetVal || 1000000,
        observations: "Criado rapidamente pela Esteira de Vendas.",
        status: newStage === "Finalização do Processo" ? "Ganho" : "Em Atendimento",
        pipelineStatus: newStage,
        createdAt: new Date().toISOString()
      };

      await onAddClient(clientPayload);
      
      // Reset
      setNewName("");
      setNewPhone("");
      setNewEmail("");
      setNewBudget("");
      setShowQuickAdd(false);
    } catch (err) {
      console.error(err);
      alert("Falha ao criar lead na esteira.");
    } finally {
      setIsSubmittingQuickAdd(false);
    }
  };

  // Group clients by stage
  const getClientsInStage = (stage: string) => {
    return clients.filter(c => {
      const clientStage = c.pipelineStatus || "Em Atendimento";
      return clientStage === stage;
    });
  };

  // Filter properties in linking popup
  const filteredProperties = properties.filter(p => {
    const q = propertySearch.toLowerCase();
    const shortCode = (p.id || p._id || "").substring(0, 5).toUpperCase();
    return (
      (p.title || "").toLowerCase().includes(q) ||
      (p.neighborhood || "").toLowerCase().includes(q) ||
      (p.city || "").toLowerCase().includes(q) ||
      shortCode.includes(q)
    );
  });

  // Calculate statistics
  const activePipelineValue = clients.reduce((acc, c) => acc + (c.maxBudget || 0), 0);
  const totalLeads = clients.length;

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200 pb-16">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-sm">
        <div>
          <h2 className="font-display text-2xl font-black text-primary tracking-tight flex items-center gap-2">
            <FolderSync className="w-6 h-6 text-secondary animate-spin-slow" />
            Esteira de Vendas
          </h2>
          <p className="text-xs text-on-surface-variant font-medium mt-1">
            Gerencie seu fluxo de vendas passo a passo, vincule imóveis às propostas dos clientes e garanta que nenhum follow-up seja esquecido.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Quick Info Badges */}
          <div className="px-3.5 py-1.5 bg-surface-container-high rounded-xl flex items-center gap-2 border border-outline-variant/20">
            <Users className="w-4 h-4 text-primary" />
            <div>
              <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Leads sob Controle</span>
              <span className="text-xs font-bold text-on-surface">{totalLeads}</span>
            </div>
          </div>

          <div className="px-3.5 py-1.5 bg-secondary-container/20 rounded-xl flex items-center gap-2 border border-secondary/20">
            <TrendingUp className="w-4 h-4 text-secondary" />
            <div>
              <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Potencial de Fechamento</span>
              <span className="text-xs font-bold text-primary">R$ {(activePipelineValue ?? 0).toLocaleString("pt-BR")}</span>
            </div>
          </div>

          <button
            onClick={() => setShowQuickAdd(true)}
            className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ml-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Novo Lead
          </button>
        </div>
      </div>

      {/* HORIZONTAL CONVEYOR BELT (ESTEIRA) KANBAN */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin">
        <div className="flex gap-4 min-w-[1400px]">
          {PIPELINE_STAGES.map((stage, idx) => {
            const stageClients = getClientsInStage(stage);
            const details = getStageDetails(stage);
            const totalStageValue = stageClients.reduce((sum, c) => sum + (c.maxBudget || 0), 0);

            return (
              <div 
                key={stage} 
                className="w-80 flex-shrink-0 flex flex-col bg-surface-container-low/60 rounded-2xl border border-outline-variant/40 overflow-hidden min-h-[500px]"
              >
                {/* Column Header */}
                <header className={`px-4 py-3.5 border-b border-outline-variant/30 ${details.bg} flex flex-col gap-1`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-on-surface font-display truncate max-w-[180px]">
                      {idx + 1}. {stage}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface font-mono text-[10px] font-bold">
                      {stageClients.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-semibold">
                    Valor: R$ {(totalStageValue ?? 0).toLocaleString("pt-BR")}
                  </span>
                </header>

                {/* Column Cards Container */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[600px] min-h-[400px]">
                  <AnimatePresence mode="popLayout">
                    {stageClients.map((client, idx) => {
                      const initials = (client.name || "")
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "?";

                      // Resolve linked property
                      const linkedProp = properties.find(
                        (p) => p.id === client.linkedPropertyId || p._id === client.linkedPropertyId
                      );

                      return (
                        <motion.div
                          key={client.id || client._id || `pipeline-c-${client.name}-${idx}`}
                          layout
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: "spring", duration: 0.3 }}
                          className="bg-surface p-3.5 rounded-xl border border-outline-variant/20 shadow-sm hover:shadow-md hover:border-primary/25 transition-all flex flex-col gap-3 relative group"
                        >
                          {/* Client Header Info */}
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-display text-xs font-bold shadow-inner">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 
                                onClick={() => onSelectClient(client)}
                                className="font-display text-xs font-bold text-on-surface hover:text-primary hover:underline cursor-pointer truncate transition-colors"
                                title="Ver ficha completa"
                              >
                                {client.name}
                              </h4>
                              <p className="text-[10px] text-on-surface-variant/90 font-medium truncate mt-0.5">
                                {client.phone} • {client.profileType}
                              </p>
                            </div>
                          </div>

                          {/* Client Budget Tracker */}
                          <div className="flex justify-between items-center bg-surface-container/30 px-2 py-1 rounded-md text-[10px] border border-outline-variant/10">
                            <span className="text-on-surface-variant font-semibold">Max Orçamento:</span>
                            <span className="font-bold text-primary">R$ {(client.maxBudget ?? 0).toLocaleString("pt-BR")}</span>
                          </div>

                          {/* LINKED PROPERTY SECTION */}
                          <div className="border-t border-outline-variant/30 pt-2.5 space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-1">
                                <Home className="w-3 h-3 text-secondary" />
                                Imóvel Vinculado
                              </span>
                            </div>

                            {linkedProp ? (
                              <div className="bg-surface-container/50 border border-outline-variant/30 rounded-lg p-2 flex flex-col gap-1 relative group/prop animate-in fade-in duration-200">
                                <div className="flex justify-between items-start gap-1">
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-on-surface truncate">
                                      {linkedProp.title}
                                    </p>
                                    <p className="text-[9px] text-on-surface-variant/80 truncate mt-0.5">
                                      Ref: #{(linkedProp.id || linkedProp._id || "").substring(0, 5).toUpperCase()} • {linkedProp.neighborhood}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleLinkProperty(client, undefined)}
                                    className="p-1 rounded-md text-on-surface-variant/70 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                                    title="Desvincular Imóvel"
                                  >
                                    <Unlink className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="text-[10px] font-semibold text-primary mt-1">
                                  R$ {(linkedProp.price ?? 0).toLocaleString("pt-BR")}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setLinkingClient(client)}
                                className="w-full py-1.5 bg-surface-container-high hover:bg-primary/5 hover:text-primary text-on-surface-variant border border-dashed border-outline-variant rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <LinkIcon className="w-3 h-3" />
                                Vincular por Código/Nome
                              </button>
                            )}
                          </div>

                          {/* STAGE STEPPER ACTIONS */}
                          <div className="flex items-center justify-between border-t border-outline-variant/30 pt-2.5 mt-1">
                            <button
                              disabled={idx === 0}
                              onClick={() => moveStage(client, "prev")}
                              className="p-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                              title="Voltar Etapa"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>

                            {/* Precise dropdown select */}
                            <select
                              value={stage}
                              onChange={(e) => setSpecificStage(client, e.target.value)}
                              className="text-[10px] font-bold bg-transparent outline-none text-on-surface-variant max-w-[130px] border border-transparent hover:border-outline-variant rounded px-1 text-center"
                            >
                              {PIPELINE_STAGES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>

                            <button
                              disabled={idx === PIPELINE_STAGES.length - 1}
                              onClick={() => moveStage(client, "next")}
                              className="p-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                              title="Avançar Etapa"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Empty Column Indicator */}
                  {stageClients.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 border border-dashed border-outline-variant/30 rounded-xl bg-surface-container-low/20">
                      <p className="text-[10px] text-on-surface-variant/60 font-bold uppercase tracking-wider">Vazio</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POPUP: PROPERTY LINK MODAL */}
      <AnimatePresence>
        {linkingClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface w-full max-w-md rounded-2xl shadow-2xl p-6 border border-outline-variant/30 flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40 mb-4">
                <div>
                  <h3 className="font-display text-base font-bold text-primary">Vincular Imóvel ao Cliente</h3>
                  <p className="text-[10px] text-on-surface-variant font-semibold mt-0.5">Cliente: {linkingClient.name}</p>
                </div>
                <button
                  onClick={() => {
                    setLinkingClient(null);
                    setPropertySearch("");
                  }}
                  className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
                >
                  <X className="w-5 h-5 text-on-surface-variant" />
                </button>
              </div>

              {/* Search properties */}
              <div className="relative mb-4">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por código (ID) ou título..."
                  value={propertySearch}
                  onChange={(e) => setPropertySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg outline-none text-xs text-on-surface"
                />
              </div>

              {/* Property list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[350px]">
                {filteredProperties.map((prop) => {
                  const shortId = (prop.id || prop._id || "").substring(0, 5).toUpperCase();
                  return (
                    <div
                      key={prop.id || prop._id}
                      onClick={() => handleLinkProperty(linkingClient, prop.id || prop._id)}
                      className="p-3 border border-outline-variant/30 rounded-xl bg-surface-container-low/40 hover:bg-secondary-container/10 hover:border-secondary/40 transition-all cursor-pointer flex justify-between items-center group"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="px-1.5 py-0.5 rounded bg-secondary-container/45 text-secondary text-[8px] font-bold">
                          COD: #{shortId}
                        </span>
                        <h4 className="font-display text-xs font-bold text-on-surface truncate mt-1">
                          {prop.title}
                        </h4>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          {prop.neighborhood}, {prop.city}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-primary">
                          R$ {(prop.price ?? 0).toLocaleString("pt-BR")}
                        </div>
                        <span className="text-[8px] font-bold text-on-surface-variant uppercase mt-1 block">
                          Vincular ➜
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filteredProperties.length === 0 && (
                  <div className="text-center py-10 text-on-surface-variant/80">
                    <p className="text-xs">Nenhum imóvel correspondente encontrado.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: QUICK ADD CLIENT */}
      <AnimatePresence>
        {showQuickAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface w-full max-w-md rounded-2xl shadow-2xl p-6 border border-outline-variant/30 flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40 mb-4 sticky top-0 z-10">
                <h3 className="font-display text-base font-bold text-primary">Adicionar Lead ao Funil</h3>
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
                >
                  <X className="w-5 h-5 text-on-surface-variant" />
                </button>
              </div>

              <form onSubmit={handleQuickAddSubmit} className="space-y-4 overflow-y-auto pr-1">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Albuquerque"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg outline-none text-xs text-on-surface"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                      Telefone *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: (11) 98888-7777"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg outline-none text-xs text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                      E-mail (Opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="carlos@exemplo.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg outline-none text-xs text-on-surface"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                      Orçamento Máximo (R$)
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 1500000"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg outline-none text-xs text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                      Tipo de Imóvel
                    </label>
                    <select
                      value={newPropType}
                      onChange={(e) => setNewPropType(e.target.value)}
                      className="w-full px-2 py-2 bg-surface-container-low border border-outline-variant rounded-lg outline-none text-xs text-on-surface"
                    >
                      <option>Apartamento</option>
                      <option>Casa</option>
                      <option>Sobrado</option>
                      <option>Terreno</option>
                      <option>Comercial</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                      Perfil
                    </label>
                    <select
                      value={newProfileType}
                      onChange={(e) => setNewProfileType(e.target.value)}
                      className="w-full px-2 py-2 bg-surface-container-low border border-outline-variant rounded-lg outline-none text-xs text-on-surface"
                    >
                      <option>Lead</option>
                      <option>Comprador</option>
                      <option>Locatário</option>
                      <option>Proprietário</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                      Objetivo
                    </label>
                    <select
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      className="w-full px-2 py-2 bg-surface-container-low border border-outline-variant rounded-lg outline-none text-xs text-on-surface"
                    >
                      <option>Venda</option>
                      <option>Aluguel</option>
                      <option>Temporada</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                    Posição Inicial na Esteira
                  </label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    className="w-full px-2 py-2 bg-surface-container-low border border-outline-variant rounded-lg outline-none text-xs text-on-surface"
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingQuickAdd}
                  className="w-full py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer mt-2"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Iniciar Acompanhamento
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
