import React, { useState, useEffect } from "react";
import { Task, Client, Property } from "../types";
import { 
  Calendar, 
  Clock, 
  Check, 
  Plus, 
  Trash2, 
  X, 
  Save, 
  Loader2, 
  ListChecks, 
  AlertTriangle,
  MessageSquare,
  Phone,
  Building,
  CheckSquare,
  FileText,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ArrowRight,
  User,
  ExternalLink
} from "lucide-react";

interface TasksViewProps {
  tasks: Task[];
  clients?: Client[];
  properties?: Property[];
  onAddTask: (task: Omit<Task, "id">) => Promise<void>;
  onToggleTaskCompletion: (id: string, completed: boolean) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  prefilledClientForTask?: Client | null;
  onClearPrefilledClient?: () => void;
}

type TaskTab = "hoje" | "atrasadas" | "proximos_7" | "concluidas";

export default function TasksView({
  tasks = [],
  clients = [],
  properties = [],
  onAddTask,
  onToggleTaskCompletion,
  onDeleteTask,
  selectedDate: propSelectedDate,
  onDateChange: propOnDateChange,
  prefilledClientForTask,
  onClearPrefilledClient
}: TasksViewProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const selectedDate = propSelectedDate !== undefined ? propSelectedDate : internalSelectedDate;
  const setSelectedDate = propOnDateChange !== undefined ? propOnDateChange : setInternalSelectedDate;
  
  const [activeTab, setActiveTab] = useState<TaskTab>("hoje");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for creating a new task
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("10:00");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [propertyTitle, setPropertyTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Ligar");
  const [priority, setPriority] = useState<"baixa" | "média" | "alta">("média");

  // State to control the prompt modal for creating next follow-up
  const [completedTaskForPrompt, setCompletedTaskForPrompt] = useState<Task | null>(null);

  // Effect to handle pre-filled client redirect from dashboard
  useEffect(() => {
    if (prefilledClientForTask) {
      setSelectedClientId(prefilledClientForTask.id || prefilledClientForTask._id || "");
      setClientName(prefilledClientForTask.name);
      setTitle(`Follow-up: ${prefilledClientForTask.name}`);
      setType("Ligar");
      setPriority("alta");
      setDescription("Follow-up de rotina para reaquecer o lead.");
      setShowAddForm(true);
      
      // Clear after using to avoid infinite prefill loops
      if (onClearPrefilledClient) {
        onClearPrefilledClient();
      }
    }
  }, [prefilledClientForTask, onClearPrefilledClient]);

  // Helper to determine task status dynamically
  const getTaskStatus = (task: Task): "pendente" | "concluída" | "atrasada" => {
    if (task.completed) return "concluída";
    
    const todayStr = new Date().toISOString().split("T")[0];
    if (task.date < todayStr) {
      return "atrasada";
    } else if (task.date === todayStr) {
      // Check time
      const now = new Date();
      const currentHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (task.time < currentHM) {
        return "atrasada";
      }
    }
    return "pendente";
  };

  // Organize tasks by categories
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Calculate date 7 days from now
  const next7DaysStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  })();

  const categorizedTasks = React.useMemo(() => {
    const hoje: Task[] = [];
    const atrasadas: Task[] = [];
    const proximos7: Task[] = [];
    const concluidas: Task[] = [];

    tasks.forEach((task) => {
      const status = getTaskStatus(task);
      if (status === "concluída") {
        concluidas.push(task);
      } else if (status === "atrasada") {
        atrasadas.push(task);
      } else if (task.date === todayStr) {
        hoje.push(task);
      } else if (task.date > todayStr && task.date <= next7DaysStr) {
        proximos7.push(task);
      }
    });

    // Sort operations
    hoje.sort((a, b) => a.time.localeCompare(b.time));
    atrasadas.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    proximos7.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    concluidas.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

    return { hoje, atrasadas, proximos7, concluidas };
  }, [tasks, todayStr, next7DaysStr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert("Por favor, preencha o título da tarefa.");
      return;
    }
    if (!selectedClientId) {
      alert("Por favor, vincule um cliente a este follow-up.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newTask: Omit<Task, "id"> = {
        title,
        date: selectedDate,
        time,
        clientId: selectedClientId,
        clientName: clientName || "Geral",
        propertyId: selectedPropertyId || undefined,
        propertyTitle: propertyTitle || undefined,
        description,
        type,
        priority,
        completed: false,
        createdAt: new Date().toISOString()
      };

      await onAddTask(newTask);
      
      // Reset form
      setTitle("");
      setTime("10:00");
      setSelectedClientId("");
      setClientName("");
      setSelectedPropertyId("");
      setPropertyTitle("");
      setDescription("");
      setType("Ligar");
      setPriority("média");
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      alert("Falha ao cadastrar tarefa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (task: Task) => {
    const originalId = task.id || task._id || "";
    const isNewCompletion = !task.completed;
    
    try {
      await onToggleTaskCompletion(originalId, isNewCompletion);
      if (isNewCompletion) {
        // Task completed! Show prompt to create next follow-up
        setCompletedTaskForPrompt(task);
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao atualizar tarefa.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja excluir permanentemente este compromisso da sua rotina?")) {
      try {
        await onDeleteTask(id);
      } catch (err) {
        console.error(err);
        alert("Falha ao excluir tarefa.");
      }
    }
  };

  // Icon selector based on Task Type
  const getTypeIcon = (taskType: string) => {
    switch (taskType) {
      case "Ligar":
        return <Phone className="w-4 h-4" />;
      case "Enviar WhatsApp":
        return <MessageSquare className="w-4 h-4" />;
      case "Enviar imóvel":
        return <Building className="w-4 h-4" />;
      case "Confirmar visita":
        return <CheckSquare className="w-4 h-4" />;
      case "Enviar proposta":
        return <FileText className="w-4 h-4" />;
      case "Cobrar retorno":
        return <Clock className="w-4 h-4" />;
      case "Documentação":
        return <FileSpreadsheet className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  // Color mappings for types
  const getTypeBadgeStyles = (taskType: string) => {
    switch (taskType) {
      case "Ligar":
        return "bg-blue-50 text-blue-700 border-blue-200/50";
      case "Enviar WhatsApp":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "Enviar imóvel":
        return "bg-purple-50 text-purple-700 border-purple-200/50";
      case "Confirmar visita":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/50";
      case "Enviar proposta":
        return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "Cobrar retorno":
        return "bg-orange-50 text-orange-700 border-orange-200/50";
      case "Documentação":
        return "bg-rose-50 text-rose-700 border-rose-200/50";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/50";
    }
  };

  // Priority styling
  const getPriorityBadgeStyles = (p?: string) => {
    switch (p) {
      case "alta":
        return "bg-red-100 text-red-800 border-red-200";
      case "média":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "baixa":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  // Format date helper (e.g. 2026-06-30 -> 30/06)
  const formatDateLabel = (dateStr: string) => {
    if (dateStr === todayStr) return "Hoje";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  // Get current active tasks to render
  const activeTaskList = (() => {
    switch (activeTab) {
      case "hoje":
        return categorizedTasks.hoje;
      case "atrasadas":
        return categorizedTasks.atrasadas;
      case "proximos_7":
        return categorizedTasks.proximos7;
      case "concluidas":
        return categorizedTasks.concluidas;
      default:
        return [];
    }
  })();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {!showAddForm ? (
        <>
          {/* Visual Tabs Selector */}
          <div className="grid grid-cols-4 gap-1.5 bg-surface p-1 rounded-2xl border border-outline-variant/30 shadow-sm">
            {[
              { id: "hoje", label: "Hoje", count: categorizedTasks.hoje.length, color: "text-primary" },
              { id: "atrasadas", label: "Atrasadas", count: categorizedTasks.atrasadas.length, color: "text-red-600 bg-red-50/50" },
              { id: "proximos_7", label: "Próximos 7 Dias", count: categorizedTasks.proximos7.length, color: "text-secondary" },
              { id: "concluidas", label: "Concluídas", count: categorizedTasks.concluidas.length, color: "text-emerald-700" }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TaskTab)}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all cursor-pointer relative ${
                    isActive 
                      ? "bg-primary text-on-primary shadow-sm scale-[1.02] font-bold" 
                      : "hover:bg-surface-container-high text-on-surface-variant font-semibold"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider leading-none">{tab.label}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`font-display text-body-lg font-bold ${isActive ? "text-white" : "text-on-surface"}`}>
                      {tab.count}
                    </span>
                    {!isActive && tab.count > 0 && tab.id === "atrasadas" && (
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Warning if overdue tasks exist */}
          {categorizedTasks.atrasadas.length > 0 && activeTab !== "atrasadas" && (
            <div 
              onClick={() => setActiveTab("atrasadas")}
              className="bg-red-50 border border-red-200/60 p-3 rounded-xl flex items-center justify-between text-red-800 text-xs font-semibold cursor-pointer hover:bg-red-100/50 transition-all"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>Atenção: Você tem {categorizedTasks.atrasadas.length} tarefas comerciais atrasadas!</span>
              </div>
              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                Resolver agora <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          )}

          {/* Tasks List */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-display text-title-md text-on-surface font-bold uppercase tracking-wide text-xs opacity-75">
                {activeTab === "hoje" && "Compromissos Agendados para Hoje"}
                {activeTab === "atrasadas" && "Acompanhamentos Perdidos (Pendentes no Passado)"}
                {activeTab === "proximos_7" && "Agenda de Follow-up (Próximos 7 dias)"}
                {activeTab === "concluidas" && "Histórico de Atividades Realizadas"}
              </h3>
              <span className="text-[10px] font-mono bg-surface-container px-2.5 py-0.5 rounded-full font-bold">
                {activeTaskList.length} {activeTaskList.length === 1 ? "tarefa" : "tarefas"}
              </span>
            </div>

            <div className="space-y-3">
              {activeTaskList.length > 0 ? (
                activeTaskList.map((t, idx) => {
                  const isOverdue = getTaskStatus(t) === "atrasada";
                  return (
                    <div 
                      key={t.id || t._id || `task-${idx}`} 
                      className={`relative overflow-hidden bg-surface-container-lowest border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                        t.completed 
                          ? "border-outline-variant/40 opacity-70" 
                          : isOverdue 
                          ? "border-red-200/80 bg-red-50/10 hover:border-red-300"
                          : "border-outline-variant/30 hover:border-primary/20 hover:shadow-md"
                      }`}
                    >
                      {/* Priority left bar indicators */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        t.priority === "alta" 
                          ? "bg-red-500" 
                          : t.priority === "média" 
                          ? "bg-amber-500" 
                          : "bg-blue-400"
                      }`} />

                      <div className="pl-2 space-y-1 text-left min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Type Badge */}
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 border rounded-lg flex items-center gap-1 ${getTypeBadgeStyles(t.type || "Outro")}`}>
                            {getTypeIcon(t.type || "Outro")}
                            {t.type || "Outro"}
                          </span>
                          
                          {/* Priority Badge */}
                          {t.priority && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-md uppercase tracking-wide ${getPriorityBadgeStyles(t.priority)}`}>
                              {t.priority}
                            </span>
                          )}

                          {/* Date & Time display */}
                          <span className={`text-xs font-mono font-bold ml-auto sm:ml-0 flex items-center gap-1 ${isOverdue ? "text-red-600 bg-red-50 px-2 py-0.5 rounded-md" : "text-on-surface-variant"}`}>
                            <Clock className="w-3 h-3" />
                            {formatDateLabel(t.date)} às {t.time}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className={`font-bold text-on-surface text-base leading-tight pt-1 ${t.completed ? "line-through opacity-60" : ""}`}>
                          {t.title}
                        </h4>

                        {/* Linked Client Info */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <User className="w-3.5 h-3.5 text-on-surface-variant/70 shrink-0" />
                          <p className="text-xs text-on-surface font-semibold">
                            Cliente: <span className="text-primary hover:underline cursor-pointer">{t.clientName}</span>
                          </p>
                        </div>

                        {/* Linked Property Info */}
                        {t.propertyTitle && (
                          <div className="flex items-center gap-1.5 pt-0.5 text-xs text-on-surface-variant">
                            <Building className="w-3.5 h-3.5 opacity-70 shrink-0" />
                            <p className="truncate">
                              Imóvel: <span className="font-semibold italic">{t.propertyTitle}</span>
                            </p>
                          </div>
                        )}
                        
                        {/* Description */}
                        {t.description && (
                          <p className="text-xs text-on-surface-variant/80 pt-1.5 leading-relaxed border-t border-outline-variant/10 mt-1 whitespace-pre-wrap font-medium">
                            {t.description}
                          </p>
                        )}
                      </div>

                      {/* Interactive Controls */}
                      <div className="flex items-center sm:flex-col justify-end gap-2.5 shrink-0 pl-2 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/10">
                        {/* WhatsApp Fast Contact Button */}
                        {t.type === "Enviar WhatsApp" && !t.completed && (
                          <a
                            href={`https://wa.me/${clients.find(c => c.name === t.clientName || c.id === t.clientId)?.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá, tudo bem? Gostaria de dar um retorno sobre o seu atendimento no Metria CRM...`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer"
                            title="Conversar no WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4 fill-white text-emerald-500" />
                          </a>
                        )}

                        {/* Toggle complete */}
                        <button
                          onClick={() => handleToggle(t)}
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                            t.completed 
                              ? "bg-emerald-500 border-emerald-500 text-white" 
                              : "bg-white border-outline-variant hover:border-primary text-on-surface-variant hover:bg-surface-container"
                          }`}
                          title={t.completed ? "Desmarcar conclusão" : "Marcar como concluída"}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>

                        {/* Delete task */}
                        <button
                          onClick={() => handleDelete(t.id || t._id || "")}
                          className="w-8 h-8 rounded-xl border border-red-100 bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 hover:border-red-200 transition-all cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 text-on-surface-variant bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/40">
                  <ListChecks className="w-10 h-10 text-outline-variant stroke-[1.5] mb-2" />
                  <p className="font-bold text-sm">Sem tarefas nesta visualização</p>
                  <p className="text-xs text-on-surface-variant/80 mt-1 max-w-xs leading-relaxed">
                    {activeTab === "hoje" && "Tudo limpo por hoje! Aproveite para prospectar ou revisar sua lista de contatos."}
                    {activeTab === "atrasadas" && "Parabéns! Nenhuma tarefa está em atraso no momento."}
                    {activeTab === "proximos_7" && "Nenhuma atividade agendada para os próximos 7 dias."}
                    {activeTab === "concluidas" && "Histórico de atividades concluídas está vazio."}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Floating Action Button to add task */}
          <button
            onClick={() => {
              // Default to selected date
              setShowAddForm(true);
            }}
            className="fixed right-6 bottom-24 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer border border-primary-container/20"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </>
      ) : (
        /* ADICIONAR TAREFA FORM VIEW */
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <header className="flex justify-between items-center pb-4 border-b border-outline-variant mb-6">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-primary/10 text-primary rounded-lg">
                <Calendar className="w-5 h-5" />
              </span>
              <h2 className="font-display text-title-md text-primary font-bold">Agendar Atividade Comercial</h2>
            </div>
            <button
              onClick={() => {
                setShowAddForm(false);
                if (onClearPrefilledClient) onClearPrefilledClient();
              }}
              className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4 text-sm text-left">
            
            {/* Cliente Vinculado (REQUIRED SELECT) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
                <span>Cliente Vinculado *</span>
                <span className="text-[10px] text-red-500 font-bold">(Obrigatório)</span>
              </label>
              <select
                required
                value={selectedClientId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedClientId(val);
                  const clientObj = clients.find(c => c.id === val || c._id?.toString() === val);
                  if (clientObj) {
                    setClientName(clientObj.name);
                  } else {
                    setClientName("");
                  }
                }}
                className="h-11 px-3 border border-outline-variant bg-white rounded-lg text-sm font-semibold outline-none focus:border-primary/50 transition-all"
              >
                <option value="">Selecione o cliente associado...</option>
                {clients.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name} ({c.profileType} - {c.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Imóvel Vinculado (OPTIONAL SELECT) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant">Imóvel Vinculado (Opcional)</label>
              <select
                value={selectedPropertyId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedPropertyId(val);
                  const propObj = properties.find(p => p.id === val || p._id?.toString() === val);
                  if (propObj) {
                    setPropertyTitle(propObj.title);
                  } else {
                    setPropertyTitle("");
                  }
                }}
                className="h-11 px-3 border border-outline-variant bg-white rounded-lg text-sm font-semibold outline-none focus:border-primary/50 transition-all"
              >
                <option value="">Nenhum imóvel selecionado</option>
                {properties.map((p) => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.code ? `[${p.code}] ` : ""}{p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Type & Priority in two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant">Tipo de Atividade</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-11 px-3 border border-outline-variant bg-white rounded-lg text-sm font-semibold outline-none"
                >
                  <option value="Ligar">Ligar</option>
                  <option value="Enviar WhatsApp">Enviar WhatsApp</option>
                  <option value="Enviar imóvel">Enviar imóvel</option>
                  <option value="Confirmar visita">Confirmar visita</option>
                  <option value="Enviar proposta">Enviar proposta</option>
                  <option value="Cobrar retorno">Cobrar retorno</option>
                  <option value="Documentação">Documentação</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant">Prioridade</label>
                <div className="grid grid-cols-3 gap-2 h-11">
                  {(["baixa", "média", "alta"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`rounded-lg text-xs font-bold capitalize border cursor-pointer flex items-center justify-center transition-all ${
                        priority === p
                          ? p === "alta"
                            ? "bg-red-500 border-red-500 text-white"
                            : p === "média"
                            ? "bg-amber-500 border-amber-500 text-white"
                            : "bg-blue-500 border-blue-500 text-white"
                          : "bg-white border-outline-variant text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date & Time in two columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant">Data</label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-11 px-3 border border-outline-variant rounded-lg bg-white outline-none text-sm font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant">Horário</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-11 px-3 border border-outline-variant rounded-lg bg-white outline-none text-sm font-semibold"
                />
              </div>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant">Título / Atividade</label>
              <input
                type="text"
                required
                placeholder="Ex: Ligar para alinhar preço da proposta ou Enviar fotos do imóvel"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 px-3 border border-outline-variant rounded-lg bg-white outline-none text-sm"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant">Observações / Detalhes</label>
              <textarea
                rows={3}
                placeholder="Detalhes adicionais (quais dúvidas tirar, qual imóvel enviar, etc...)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="p-3 border border-outline-variant rounded-lg bg-white outline-none text-sm resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  if (onClearPrefilledClient) onClearPrefilledClient();
                }}
                className="px-5 py-3 bg-surface-container-high text-on-surface-variant rounded-xl font-bold font-label-md cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold font-label-md shadow-md hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Agendar Atividade
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* COMPLETED TASK PROMPT MODAL (NEXT FOLLOW-UP LOOP) */}
      {completedTaskForPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 border border-outline-variant shadow-2xl space-y-4 animate-in scale-in duration-200">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-3 bg-emerald-100/70 rounded-2xl">
                <CheckSquare className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-display text-title-lg text-emerald-800 font-bold leading-tight">Tarefa Concluída!</h3>
                <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Histórico Atualizado 🎉</p>
              </div>
            </div>
            
            <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
              Você concluiu com sucesso a atividade <strong className="text-on-surface">"{completedTaskForPrompt.title}"</strong> para o cliente <strong className="text-on-surface">{completedTaskForPrompt.clientName}</strong>.
            </p>
            <p className="text-xs text-on-surface-variant font-medium">
              Para garantir que esse cliente não esfrie no funil de vendas, <strong>deseja agendar a próxima ação de follow-up?</strong> É a melhor prática para manter o relacionamento ativo.
            </p>
            
            <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/50">
              <button
                onClick={() => setCompletedTaskForPrompt(null)}
                className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant font-bold text-xs rounded-xl cursor-pointer"
              >
                Não, depois
              </button>
              <button
                onClick={() => {
                  // Pre-fill next action with exact same client
                  const clientObj = clients.find(c => 
                    c.name === completedTaskForPrompt.clientName ||
                    (completedTaskForPrompt.clientId && (c.id === completedTaskForPrompt.clientId || c._id?.toString() === completedTaskForPrompt.clientId))
                  );
                  if (clientObj) {
                    setSelectedClientId(clientObj.id || clientObj._id || "");
                    setClientName(clientObj.name);
                  } else {
                    setClientName(completedTaskForPrompt.clientName);
                  }

                  if (completedTaskForPrompt.propertyId) {
                    setSelectedPropertyId(completedTaskForPrompt.propertyId);
                    setPropertyTitle(completedTaskForPrompt.propertyTitle || "");
                  }

                  setTitle(""); // let them type new title
                  setDescription(`Próximo follow-up pós: "${completedTaskForPrompt.title}"`);
                  setType("Cobrar retorno"); // Good default after a completion
                  setPriority("média");
                  
                  setShowAddForm(true);
                  setCompletedTaskForPrompt(null);
                }}
                className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 hover:opacity-90"
              >
                <Sparkles className="w-3.5 h-3.5 text-secondary" />
                Agendar Próxima Ação
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
