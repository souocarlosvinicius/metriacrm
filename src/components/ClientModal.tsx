import React, { useState } from "react";
import { motion } from "motion/react";
import { Client, User as DbUser, HistoryEntry, Task, Proposal, Visit } from "../types";
import { getClientAlerts, getAlertBadgeStyles } from "../utils/alerts";
import { 
  X, User, Phone, Mail, Award, Landmark, Trash2, Edit, Save, Loader2, Check, Cake, MapPin,
  History, Plus, MessageSquare, Calendar, DollarSign, CheckCircle2, AlertCircle, Clock, PlusCircle,
  AlertTriangle
} from "lucide-react";

interface ClientModalProps {
  client: Client;
  tasks?: Task[];
  proposals?: Proposal[];
  visits?: Visit[];
  currentUser?: DbUser;
  onClose: () => void;
  onUpdate: (updated: Client) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function ClientModal({ 
  client, 
  tasks = [], 
  proposals = [], 
  visits = [], 
  currentUser, 
  onClose, 
  onUpdate, 
  onDelete 
}: ClientModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [clientType, setClientType] = useState<"PF" | "PJ">(client.clientType || "PF");
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [document, setDocument] = useState(client.document);
  const [email, setEmail] = useState(client.email);
  const [profileType, setProfileType] = useState(client.profileType);
  const [objective, setObjective] = useState(client.objective);
  const [propertyType, setPropertyType] = useState(client.propertyType);
  const [minBudget, setMinBudget] = useState(client.minBudget);
  const [maxBudget, setMaxBudget] = useState(client.maxBudget);
  const [observations, setObservations] = useState(client.observations);
  const [status, setStatus] = useState(client.status);
  const [pipelineStatus, setPipelineStatus] = useState(client.pipelineStatus || "Novo lead");
  const [birthday, setBirthday] = useState(client.birthday || "");
  const [address, setAddress] = useState(client.address || "");

  // Real estate CRM extensions
  const [leadSource, setLeadSource] = useState(client.leadSource || "Outro");
  const [interest, setInterest] = useState(client.interest || "Compra");
  const [budgetRange, setBudgetRange] = useState(client.budgetRange || "");
  const [neighborhoodOfInterest, setNeighborhoodOfInterest] = useState(client.neighborhoodOfInterest || "");
  const [desiredPropertyType, setDesiredPropertyType] = useState(client.desiredPropertyType || "");
  const [temperature, setTemperature] = useState<"Frio" | "Morno" | "Quente">(client.temperature || "Morno");
  const [nextAction, setNextAction] = useState(client.nextAction || "");
  const [nextFollowUpDate, setNextFollowUpDate] = useState(client.nextFollowUpDate || "");

  // Get client's visual initials
  const getInitials = (fullName: string) => {
    return (fullName || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";
  };

  // Manual annotation states
  const [showAddAnnotation, setShowAddAnnotation] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState("");
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);

  const handleAddManualAnnotation = async () => {
    if (!newAnnotation.trim()) return;
    setIsAddingAnnotation(true);
    try {
      const newEntry: HistoryEntry = {
        id: Math.random().toString(36).substring(2, 11),
        type: "observation",
        date: new Date().toISOString(),
        description: newAnnotation.trim(),
        userName: currentUser?.name || currentUser?.username || "Você"
      };

      // Ensure a creation event exists if there is no history yet to preserve the base
      const currentHistory = client.history || [
        {
          id: Math.random().toString(36).substring(2, 11),
          type: "creation",
          date: client.createdAt || new Date().toISOString(),
          description: "Lead criado no sistema"
        }
      ];

      const updatedClient: Client = {
        ...client,
        history: [...currentHistory, newEntry]
      };
      await onUpdate(updatedClient);
      setNewAnnotation("");
      setShowAddAnnotation(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar anotação.");
    } finally {
      setIsAddingAnnotation(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedClient: Client = {
        ...client,
        clientType,
        name,
        phone,
        document,
        email,
        profileType,
        objective,
        propertyType,
        minBudget: Number(minBudget),
        maxBudget: Number(maxBudget),
        observations,
        status,
        pipelineStatus,
        birthday: birthday || undefined,
        address: address || undefined,
        leadSource,
        interest,
        budgetRange,
        neighborhoodOfInterest,
        desiredPropertyType,
        temperature,
        nextAction,
        nextFollowUpDate,
      };
      await onUpdate(updatedClient);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar alterações do cliente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Deseja realmente remover o cadastro de "${client.name}"? Esta ação não poderá ser desfeita.`)) {
      try {
        await onDelete(client.id || client._id || "");
        onClose();
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir o cadastro do cliente.");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative bg-surface w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-outline-variant/30"
      >
        
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-4 bg-surface border-b border-outline-variant sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <User className="text-primary w-5 h-5" />
            <h2 className="font-display text-title-md text-primary">
              {isEditing ? "Editar Cliente" : "Ficha do Cliente"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </header>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!isEditing ? (
            /* VIEW MODE */
            <div className="space-y-6">
              
              {/* Profile card summary */}
              <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-display text-headline-lg-mobile shadow-inner">
                  {getInitials(client.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-title-md text-on-surface truncate">{client.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className="px-2 py-0.5 bg-primary text-on-primary font-label-md text-[10px] rounded-md tracking-wider">
                      {(client.profileType || "").toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container font-label-md text-[10px] rounded-md">
                      {(client.status || "").toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-label-md text-[10px] rounded-md font-bold">
                      {client.clientType === "PJ" ? "PJ" : "PF"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Commercial Alerts (Opportunities cooling down) */}
              {(() => {
                const alerts = getClientAlerts(client, tasks, proposals, visits);
                if (alerts.length === 0) return null;
                return (
                  <div className="space-y-2 bg-red-50/50 p-4 rounded-xl border border-red-200/60 text-left">
                    <p className="text-[10px] text-red-700 font-extrabold uppercase tracking-widest flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                      Alertas de Estagnação Ativos ({alerts.length})
                    </p>
                    <div className="space-y-1.5 mt-2">
                      {alerts.map(alert => {
                        const badgeStyles = getAlertBadgeStyles(alert.level);
                        return (
                          <div key={alert.id} className="p-2.5 bg-white border border-red-100 rounded-lg text-xs">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${badgeStyles.bg}`}>
                                {alert.level}
                              </span>
                              <span className="text-[9px] text-on-surface-variant/70 font-mono font-bold">Regra #{alert.ruleId}</span>
                            </div>
                            <h5 className="font-bold text-primary text-sm flex items-center gap-1">{alert.title}</h5>
                            <p className="text-xs text-on-surface-variant font-medium mt-1">{alert.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Pipeline Stage Tracker */}
              <div className="space-y-2 bg-secondary-container/10 p-4 rounded-xl border border-secondary/20 shadow-inner">
                <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">Fase na Esteira de Vendas</p>
                <p className="text-sm font-bold text-on-surface">{client.pipelineStatus || "Em Atendimento"}</p>
              </div>

              {/* Personal Info Contact Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Informações Pessoais</h4>
                
                <div className="space-y-2 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm text-sm">
                  <div className="flex items-center gap-3 py-1.5 border-b border-outline-variant/40">
                    <Phone className="w-4 h-4 text-secondary flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-on-surface-variant font-semibold">Telefone</p>
                      <a href={`tel:${client.phone}`} className="text-on-surface hover:underline font-medium">
                        {client.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-1.5 border-b border-outline-variant/40">
                    <Mail className="w-4 h-4 text-secondary flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-on-surface-variant font-semibold">E-mail</p>
                      <a href={`mailto:${client.email}`} className="text-on-surface hover:underline font-medium">
                        {client.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-1.5 border-b border-outline-variant/40">
                    <Landmark className="w-4 h-4 text-secondary flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-on-surface-variant font-semibold">Documento (CPF/CNPJ)</p>
                      <p className="text-on-surface font-medium">{client.document || "Não informado"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-1.5 border-b border-outline-variant/40">
                    <Cake className="w-4 h-4 text-secondary flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-on-surface-variant font-semibold">Data de Aniversário</p>
                      <p className="text-on-surface font-medium">
                        {client.birthday ? (() => {
                          const parts = client.birthday.split("-");
                          if (parts.length === 3) {
                            return `${parts[2]}/${parts[1]}/${parts[0]}`;
                          }
                          return client.birthday;
                        })() : "Não informada"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-1.5">
                    <MapPin className="w-4 h-4 text-secondary flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-on-surface-variant font-semibold">Endereço Completo</p>
                      <p className="text-on-surface font-medium">{client.address || "Não informado"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações de Lead / Negócio */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Status & Qualificação</h4>
                <div className="grid grid-cols-2 gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm text-sm">
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">Temperatura</p>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${
                      client.temperature === "Quente" ? "bg-red-100 text-red-800" :
                      client.temperature === "Frio" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"
                    }`}>
                      {client.temperature || "Morno"}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">Origem do Lead</p>
                    <p className="font-semibold text-on-surface mt-1">{client.leadSource || "Não informada"}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-outline-variant/40">
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">Próxima Ação</p>
                    <p className="font-semibold text-on-surface mt-0.5">{client.nextAction || "Nenhuma ação planejada"}</p>
                  </div>
                  {client.nextFollowUpDate && (
                    <div className="col-span-2 pt-2 border-t border-outline-variant/40">
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold">Data do Próximo Follow-up</p>
                      <p className="font-semibold text-red-600 mt-0.5">
                        {client.nextFollowUpDate.split("-").reverse().join("/")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Preference & Budget Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Perfil & Interesse Imobiliário</h4>
                
                <div className="grid grid-cols-2 gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm text-sm">
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">Interesse</p>
                    <p className="font-semibold text-primary mt-0.5">{client.interest || client.objective || "Compra"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">Tipo Desejado</p>
                    <p className="font-semibold text-primary mt-0.5">{client.desiredPropertyType || client.propertyType || "Qualquer"}</p>
                  </div>
                  <div className="pt-2 border-t border-outline-variant/40">
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">Bairro de Interesse</p>
                    <p className="font-semibold text-on-surface mt-0.5">{client.neighborhoodOfInterest || "Qualquer"}</p>
                  </div>
                  <div className="pt-2 border-t border-outline-variant/40">
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">Orçamento / Faixa</p>
                    <p className="font-semibold text-on-surface mt-0.5">
                      {client.budgetRange || `R$ ${(client.minBudget ?? 0).toLocaleString("pt-BR")} - R$ ${(client.maxBudget ?? 0).toLocaleString("pt-BR")}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Observations */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Anotações e Observações</h4>
                <p className="text-on-surface-variant text-body-sm leading-relaxed bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm whitespace-pre-wrap">
                  {client.observations || "Nenhuma observação ou anotação cadastrada."}
                </p>
              </div>

              {/* HISTÓRICO DE ATENDIMENTO */}
              <div className="space-y-3 pt-2 border-t border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-primary" />
                    Histórico de Atendimento
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddAnnotation(!showAddAnnotation)}
                    className="text-[11px] text-primary hover:opacity-80 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar anotação
                  </button>
                </div>

                {/* Form inline para adicionar anotação */}
                {showAddAnnotation && (
                  <div className="p-3 bg-surface-container-low border border-outline-variant/40 rounded-xl space-y-2.5 shadow-sm">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase">Nova Anotação Manual</p>
                    <textarea
                      rows={3}
                      value={newAnnotation}
                      onChange={(e) => setNewAnnotation(e.target.value)}
                      placeholder="Digite aqui as observações ou o que aconteceu no atendimento..."
                      className="w-full px-3 py-2 bg-surface text-xs outline-none border border-outline-variant rounded-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <div className="flex justify-end gap-2 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setNewAnnotation("");
                          setShowAddAnnotation(false);
                        }}
                        className="px-3 py-1.5 bg-surface-container-high text-on-surface-variant rounded-lg hover:opacity-90 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddManualAnnotation}
                        disabled={isAddingAnnotation || !newAnnotation.trim()}
                        className="px-3.5 py-1.5 bg-primary text-on-primary rounded-lg flex items-center gap-1 shadow-sm disabled:opacity-55 hover:opacity-95 cursor-pointer"
                      >
                        {isAddingAnnotation ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Salvar Anotação
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de histórico */}
                <div className="relative border-l-2 border-outline-variant/30 ml-2.5 pl-4 py-1 space-y-4">
                  {(() => {
                    const historyItems = client.history && client.history.length > 0 
                      ? client.history 
                      : [
                          {
                            id: "creation-default",
                            type: "creation",
                            date: client.createdAt || new Date().toISOString(),
                            description: "Lead criado no sistema",
                            userName: client.leadSource ? `Origem: ${client.leadSource}` : undefined
                          }
                        ];

                    // Sort items by date descending so the newest event is at the top
                    const sortedItems = [...historyItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    return sortedItems.map((item, idx) => {
                      // Get type config
                      let icon = <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
                      let badgeColor = "bg-sky-50 dark:bg-sky-950/20 text-sky-800 dark:text-sky-300 border-sky-500/20";
                      let label = "Criação";

                      if (item.type === "status_change") {
                        icon = <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
                        badgeColor = "bg-purple-50 dark:bg-purple-950/20 text-purple-800 dark:text-purple-300 border-purple-500/20";
                        label = "Status";
                      } else if (item.type === "pipeline_change") {
                        icon = <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
                        badgeColor = "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300 border-indigo-500/20";
                        label = "Pipeline";
                      } else if (item.type === "whatsapp") {
                        icon = <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
                        badgeColor = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/20";
                        label = "WhatsApp";
                      } else if (item.type === "task_created") {
                        icon = <PlusCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
                        badgeColor = "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-500/20";
                        label = "Tarefa";
                      } else if (item.type === "task_completed") {
                        icon = <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />;
                        badgeColor = "bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300 border-green-500/20";
                        label = "Tarefa Concluída";
                      } else if (item.type === "visit_scheduled") {
                        icon = <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />;
                        badgeColor = "bg-teal-50 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300 border-teal-500/20";
                        label = "Visita";
                      } else if (item.type === "proposal_sent") {
                        icon = <DollarSign className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
                        badgeColor = "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-500/20";
                        label = "Proposta";
                      } else if (item.type === "observation") {
                        icon = <Edit className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />;
                        badgeColor = "bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-300 border-slate-500/20";
                        label = "Anotação";
                      } else if (item.type === "loss") {
                        icon = <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />;
                        badgeColor = "bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 border-red-500/20";
                        label = "Perda";
                      }

                      // Format Date nicely
                      let dateString = "Data inválida";
                      try {
                        const d = new Date(item.date);
                        if (!isNaN(d.getTime())) {
                          dateString = d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                        } else {
                          dateString = item.date;
                        }
                      } catch (e) {
                        dateString = item.date;
                      }

                      return (
                        <div key={item.id || `hist-${idx}`} className="relative group">
                          {/* Connection Node */}
                          <span className="absolute -left-[23.5px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface ring-4 ring-surface border border-outline-variant/50">
                            {icon}
                          </span>
                          
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                                {label}
                              </span>
                              <span className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {dateString}
                              </span>
                              {item.userName && (
                                <span className="text-[9px] text-on-surface-variant/85 italic">
                                  • por: {item.userName}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-[11.5px] leading-relaxed text-on-surface font-medium whitespace-pre-wrap">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2.5 bg-red-50 text-red-700 rounded-xl font-label-md hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Cliente
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-label-md hover:opacity-90 transition-all flex items-center gap-2 shadow-md"
                >
                  <Edit className="w-4 h-4" />
                  Editar Cadastro
                </button>
              </div>

            </div>
          ) : (
            /* EDIT MODE FORM */
            <form onSubmit={handleSave} className="space-y-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-primary uppercase">Tipo de Cliente</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container-high rounded-lg border border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => setClientType("PF")}
                    className={`h-9 rounded-md font-bold text-xs transition-all ${
                      clientType === "PF"
                        ? "bg-white text-primary shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-white/50"
                    }`}
                  >
                    Pessoa Física (PF)
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientType("PJ")}
                    className={`h-9 rounded-md font-bold text-xs transition-all ${
                      clientType === "PJ"
                        ? "bg-white text-primary shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-white/50"
                    }`}
                  >
                    Pessoa Jurídica (PJ)
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-primary uppercase">
                  {clientType === "PJ" ? "Razão Social / Nome Fantasia" : "Nome Completo"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={clientType === "PJ" ? "Ex: Minha Empresa LTDA" : "Ex: João da Silva"}
                  className="h-11 px-3 border border-outline-variant rounded-lg focus:border-secondary bg-white outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary uppercase">Telefone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="h-11 px-3 border border-outline-variant rounded-lg focus:border-secondary bg-white outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary uppercase">
                    {clientType === "PJ" ? "CNPJ" : "CPF"}
                  </label>
                  <input
                    type="text"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder={clientType === "PJ" ? "00.000.000/0001-00" : "000.000.000-00"}
                    className="h-11 px-3 border border-outline-variant rounded-lg focus:border-secondary bg-white outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary uppercase">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 px-3 border border-outline-variant rounded-lg focus:border-secondary outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary uppercase">Status de Atendimento</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-11 px-3 border border-outline-variant bg-white rounded-lg text-sm"
                  >
                    <option>Novo</option>
                    <option>Em Atendimento</option>
                    <option>Proposta</option>
                    <option>Ganho</option>
                    <option>Perdido</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary uppercase">Fase na Esteira de Vendas</label>
                  <select
                    value={pipelineStatus}
                    onChange={(e) => setPipelineStatus(e.target.value)}
                    className="h-11 px-3 border border-outline-variant bg-white rounded-lg text-sm w-full"
                  >
                    <option value="Novo lead">1. Novo lead</option>
                    <option value="Primeiro contato">2. Primeiro contato</option>
                    <option value="Em atendimento">3. Em atendimento</option>
                    <option value="Imóvel enviado">4. Imóvel enviado</option>
                    <option value="Visita agendada">5. Visita agendada</option>
                    <option value="Visita realizada">6. Visita realizada</option>
                    <option value="Proposta enviada">7. Proposta enviada</option>
                    <option value="Em negociação">8. Em negociação</option>
                    <option value="Documentação">9. Documentação</option>
                    <option value="Contrato">10. Contrato</option>
                    <option value="Fechado">11. Fechado</option>
                    <option value="Perdido">12. Perdido</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary uppercase">Data de Aniversário</label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="h-11 px-3 border border-outline-variant rounded-lg focus:border-secondary bg-white outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-primary uppercase">Endereço Completo</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Av. Atlântica, 1200 - Copacabana, Rio de Janeiro - RJ"
                  className="h-11 px-3 border border-outline-variant rounded-lg focus:border-secondary bg-white outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary uppercase">Tipo de Perfil</label>
                  <select
                    value={profileType}
                    onChange={(e) => setProfileType(e.target.value)}
                    className="h-11 px-3 border border-outline-variant bg-white rounded-lg text-sm"
                  >
                    <option>Lead</option>
                    <option>Comprador</option>
                    <option>Locatário</option>
                    <option>Proprietário</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary uppercase">Objetivo de Interesse</label>
                  <select
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="h-11 px-3 border border-outline-variant bg-white rounded-lg text-sm"
                  >
                    <option>Venda</option>
                    <option>Aluguel</option>
                    <option>Temporada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary uppercase">Interesse</label>
                  <select
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    className="h-11 px-3 border border-outline-variant bg-white rounded-lg text-sm"
                  >
                    <option>Compra</option>
                    <option>Venda</option>
                    <option>Locação</option>
                    <option>Avaliação</option>
                    <option>Investimento</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary uppercase">Tipo de Imóvel Desejado</label>
                  <input
                    type="text"
                    value={desiredPropertyType}
                    onChange={(e) => setDesiredPropertyType(e.target.value)}
                    placeholder="Ex: Apartamento, Casa"
                    className="h-11 px-3 border border-outline-variant rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary uppercase">Bairro de Interesse</label>
                  <input
                    type="text"
                    value={neighborhoodOfInterest}
                    onChange={(e) => setNeighborhoodOfInterest(e.target.value)}
                    placeholder="Ex: Copacabana, Ipanema"
                    className="h-11 px-3 border border-outline-variant rounded-lg text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary uppercase">Faixa de Orçamento</label>
                  <input
                    type="text"
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    placeholder="Ex: R$ 500k - R$ 800k"
                    className="h-11 px-3 border border-outline-variant rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary uppercase">Origem do Lead</label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value)}
                    className="h-11 px-3 border border-outline-variant bg-white rounded-lg text-sm"
                  >
                    <option>Indicação</option>
                    <option>Instagram</option>
                    <option>Facebook</option>
                    <option>OLX</option>
                    <option>Portal Imobiliário</option>
                    <option>Placa</option>
                    <option>WhatsApp</option>
                    <option>Tráfego Pago</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary uppercase">Temperatura do Lead</label>
                  <select
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value as any)}
                    className="h-11 px-3 border border-outline-variant bg-white rounded-lg text-sm"
                  >
                    <option>Frio</option>
                    <option>Morno</option>
                    <option>Quente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary uppercase">Próxima Ação</label>
                  <input
                    type="text"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    placeholder="Ex: Enviar proposta de financiamento"
                    className="h-11 px-3 border border-outline-variant rounded-lg text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary uppercase">Data do Próximo Follow-up</label>
                  <input
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="h-11 px-3 border border-outline-variant rounded-lg focus:border-secondary bg-white outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-primary uppercase">Observações e Perfil</label>
                <textarea
                  rows={3}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="p-3 border border-outline-variant rounded-lg text-sm resize-none"
                  placeholder="Escreva anotações sobre as preferências do cliente..."
                />
              </div>

              {/* Edit Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 bg-surface-container-high text-on-surface-variant rounded-xl font-label-md hover:bg-surface-container-highest transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-label-md hover:opacity-90 transition-all flex items-center gap-2 shadow-md"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Cadastro
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
