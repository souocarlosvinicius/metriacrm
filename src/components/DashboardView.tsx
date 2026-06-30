import React, { useState } from "react";
import { Property, Client, Task, DBStatus } from "../types";
import { Home, Users, DollarSign, Calendar, MapPin, Sparkles, Loader2, Plus, Check, CheckCircle2, Server, Database, Brain, Cake, Gift } from "lucide-react";

interface DashboardViewProps {
  properties: Property[];
  clients: Client[];
  tasks: Task[];
  dbStatus: DBStatus | null;
  onAddTask: (task: Omit<Task, "id">) => Promise<void>;
  onNavigateToTab: (tab: string) => void;
}

export default function DashboardView({ properties, clients, tasks, dbStatus, onAddTask, onNavigateToTab }: DashboardViewProps) {
  const [isGeneratingAiTasks, setIsGeneratingAiTasks] = useState(false);
  const [suggestedAiTasks, setSuggestedAiTasks] = useState<Task[]>([]);
  const [aiTasksAdded, setAiTasksAdded] = useState<Record<number, boolean>>({});

  // Welcome greeting
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) return "Bom dia, Corretor";
    if (hours >= 12 && hours < 18) return "Boa tarde, Corretor";
    return "Boa noite, Corretor";
  };

  // Get upcoming and today's birthdays within the next 3 days
  const getBirthdayAlerts = () => {
    const today = new Date();
    
    // Generate dates for today, tomorrow, day+2, day+3
    const dates = Array.from({ length: 4 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return {
        key: `${m}-${day}`,
        daysAway: i,
        label: i === 0 ? "Hoje" : i === 1 ? "Amanhã" : `Em ${i} dias`,
        dateFormatted: `${day}/${m}`
      };
    });

    const todayKey = dates[0].key;

    const todayBirthdays: Array<{ client: Client; age?: number }> = [];
    const upcomingBirthdays: Array<{ client: Client; label: string; dateFormatted: string; daysAway: number; age?: number }> = [];

    clients.forEach(c => {
      if (!c.birthday) return;
      
      const parts = c.birthday.split("-");
      let mDay = "";
      let birthYear: number | undefined = undefined;

      if (parts.length === 3) {
        mDay = `${parts[1]}-${parts[2]}`;
        birthYear = parseInt(parts[0], 10);
      } else if (parts.length === 2) {
        mDay = `${parts[0]}-${parts[1]}`;
      } else {
        return;
      }

      // Calculate age
      let age: number | undefined = undefined;
      if (birthYear && !isNaN(birthYear)) {
        age = today.getFullYear() - birthYear;
      }

      if (mDay === todayKey) {
        todayBirthdays.push({
          client: c,
          age
        });
      } else {
        const match = dates.find(d => d.key === mDay);
        if (match) {
          upcomingBirthdays.push({
            client: c,
            label: match.label,
            dateFormatted: match.dateFormatted,
            daysAway: match.daysAway,
            age
          });
        }
      }
    });

    // Sort upcoming birthdays chronologically by daysAway
    upcomingBirthdays.sort((a, b) => a.daysAway - b.daysAway);

    return { todayBirthdays, upcomingBirthdays };
  };

  // Metrics
  const activePropertiesCount = properties.length;
  const newLeadsCount = clients.filter(c => c.profileType === "Lead" || c.status === "Novo").length;
  
  // Calculate total portfolio value of sales properties
  const totalSalesValue = properties
    .filter(p => p.modality === "Venda")
    .reduce((sum, p) => sum + p.price, 0);

  // Format total portfolio value (e.g. 19.1M)
  const formattedPortfolioValue = (totalSalesValue / 1000000).toFixed(1) + "M";

  // Upcoming Visits (type 'VISITA', not completed)
  const upcomingVisits = tasks
    .filter(t => t.type === "VISITA" && !t.completed)
    .slice(0, 3);

  // Generate Suggested Tasks using Gemini AI
  const handleGenerateAiTasks = async () => {
    setIsGeneratingAiTasks(true);
    setSuggestedAiTasks([]);
    setAiTasksAdded({});
    
    try {
      const response = await fetch("/api/ai/suggest-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clients: clients.slice(0, 10), // Send a subset to fit tokens
          properties: properties.slice(0, 10)
        })
      });

      const data = await response.json();
      if (Array.isArray(data)) {
        // Set date to today
        const todayStr = new Date().toISOString().split("T")[0];
        const formatted = data.map((t: any) => ({
          date: todayStr,
          time: t.time || "10:00",
          title: t.title,
          clientName: t.clientName || "Cliente",
          description: t.description,
          type: t.type || "FOLLOW-UP",
          completed: false
        }));
        setSuggestedAiTasks(formatted);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao gerar tarefas por IA. Verifique se a chave API do Gemini está configurada.");
    } finally {
      setIsGeneratingAiTasks(false);
    }
  };

  const handleAddAiTask = async (task: Task, index: number) => {
    try {
      await onAddTask(task);
      setAiTasksAdded(prev => ({ ...prev, [index]: true }));
    } catch (err) {
      console.error(err);
      alert("Falha ao adicionar tarefa recomendada.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* DB Status & API banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant/30 text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-on-surface-variant">
            <Database className="w-3.5 h-3.5 text-secondary" />
            Banco: <span className="font-bold text-primary">{dbStatus?.dbType || "Carregando..."}</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium text-on-surface-variant">
            <Brain className="w-3.5 h-3.5 text-secondary" />
            IA Gemini:{" "}
            {dbStatus?.geminiActive ? (
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">ATIVO</span>
            ) : (
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">NÃO CONFIGURADA</span>
            )}
          </span>
        </div>
        <span className="text-[10px] text-on-surface-variant/70 font-mono">Status: On-line</span>
      </div>

      {/* Welcome Message */}
      <section className="space-y-1">
        <p className="font-label-caps text-label-caps text-secondary uppercase tracking-widest text-xs">
          {getGreeting()}
        </p>
        <h2 className="font-display text-headline-lg text-on-surface tracking-tight leading-tight">
          Pronto para fechar novos negócios hoje?
        </h2>
      </section>

      {/* Birthday Alerts Banner */}
      {(() => {
        const { todayBirthdays, upcomingBirthdays } = getBirthdayAlerts();
        const hasBirthdays = todayBirthdays.length > 0 || upcomingBirthdays.length > 0;
        if (!hasBirthdays) return null;

        return (
          <section className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 p-5 rounded-2xl shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm">
                <Cake className="w-5 h-5 stroke-[2] animate-bounce" />
              </span>
              <div>
                <h3 className="font-display text-title-md text-amber-900 font-bold leading-tight">Aniversariantes do Período</h3>
                <p className="text-xs text-amber-800 font-semibold opacity-90">Clientes comemorando hoje e nos próximos 3 dias</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Today's birthdays */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                  Hoje ({todayBirthdays.length})
                </h4>
                <div className="space-y-2">
                  {todayBirthdays.length > 0 ? (
                    todayBirthdays.map(({ client, age }, index) => (
                      <div
                        key={`today-${index}`}
                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-200/40 shadow-sm"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-sm text-on-surface truncate">{client.name}</p>
                          <p className="text-[11px] text-on-surface-variant font-medium">
                            {client.phone} • {client.profileType} {age !== undefined ? `(${age} anos 🎉)` : ""}
                          </p>
                        </div>
                        <a
                          href={`https://wa.me/${client.phone.replace(/\D/g, "")}?text=Parab%C3%A9ns%2C%20${encodeURIComponent(client.name)}!%20Desejo%20muito%20sucesso%20e%20felicidades!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap cursor-pointer active:scale-95"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          Parabenizar
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-amber-700/60 italic p-3 bg-white/20 rounded-xl border border-dashed border-amber-200">
                      Nenhum aniversário hoje.
                    </p>
                  )}
                </div>
              </div>

              {/* Upcoming birthdays */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                  Próximos 3 Dias ({upcomingBirthdays.length})
                </h4>
                <div className="space-y-2">
                  {upcomingBirthdays.length > 0 ? (
                    upcomingBirthdays.map(({ client, label, dateFormatted, age }, index) => (
                      <div
                        key={`upcoming-${index}`}
                        className="flex items-center justify-between p-3 bg-white/70 rounded-xl border border-amber-100 shadow-sm"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-sm text-on-surface truncate">{client.name}</p>
                          <p className="text-[11px] text-on-surface-variant font-medium">
                            {client.phone} • {client.profileType} {age !== undefined ? `(fará ${age} anos 🎂)` : ""}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md whitespace-nowrap">
                          {label} ({dateFormatted})
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-amber-700/60 italic p-3 bg-white/20 rounded-xl border border-dashed border-amber-200">
                      Nenhum aniversário nos próximos 3 dias.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Quick Metrics Bento Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <button
          onClick={() => onNavigateToTab("properties")}
          className="col-span-1 bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between h-32 hover:border-primary/40 text-left transition-all active:scale-[0.98]"
        >
          <Home className="text-secondary w-5 h-5 stroke-[2]" />
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant">Imóveis Ativos</p>
            <p className="font-display text-headline-lg text-primary">{activePropertiesCount}</p>
          </div>
        </button>

        {/* Metric 2 */}
        <button
          onClick={() => onNavigateToTab("clients")}
          className="col-span-1 bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between h-32 hover:border-primary/40 text-left transition-all active:scale-[0.98]"
        >
          <Users className="text-secondary w-5 h-5 stroke-[2]" />
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant">Novos Leads</p>
            <p className="font-display text-headline-lg text-secondary">{newLeadsCount}</p>
          </div>
        </button>

        {/* Metric 3 */}
        <div className="col-span-2 md:col-span-1 bg-primary text-on-primary p-4 rounded-2xl shadow-md flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <DollarSign className="w-32 h-32 stroke-[1]" />
          </div>
          <DollarSign className="text-secondary-fixed w-5 h-5 stroke-[2]" />
          <div className="z-10">
            <p className="font-label-md text-label-md text-secondary-fixed opacity-90">Portfólio de Vendas</p>
            <p className="font-display text-headline-lg">R$ {formattedPortfolioValue}</p>
          </div>
        </div>
      </section>

      {/* Progress & Upcoming Visits row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Goals Radial Chart */}
        <section className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-display text-title-md text-on-surface leading-snug">Meta Mensal</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Meta acumulada de vendas: R$ 3.0M</p>
          </div>
          
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle className="text-surface-container stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeWidth="9"></circle>
                <circle className="text-primary stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeLinecap="round" strokeWidth="9" style={{ strokeDasharray: "251.2", strokeDashoffset: "50.24" }}></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="font-display text-headline-lg-mobile text-primary">80%</p>
                <p className="text-[10px] text-on-surface-variant font-semibold">Alcançado</p>
              </div>
            </div>
            <div className="mt-4 flex gap-6 text-xs justify-center w-full">
              <div className="text-center">
                <p className="text-on-surface-variant font-semibold">Concluído</p>
                <p className="font-bold text-primary">R$ 2.4M</p>
              </div>
              <div className="w-[1px] h-8 bg-outline-variant/60"></div>
              <div className="text-center">
                <p className="text-on-surface-variant font-semibold">Restante</p>
                <p className="font-bold text-secondary">R$ 600K</p>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming Visits */}
        <section className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-display text-title-md text-on-surface leading-snug">Próximas Visitas</h3>
            <button onClick={() => onNavigateToTab("tasks")} className="text-xs text-secondary hover:underline font-semibold">
              Ver Agenda
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[200px] pr-1">
            {upcomingVisits.length > 0 ? (
              upcomingVisits.map((visit, idx) => (
                <div key={visit.id || visit._id || `visit-${idx}`} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-outline-variant/20 hover:border-primary/20 transition-all shadow-sm">
                  <div className="flex flex-col items-center justify-center min-w-[50px] h-12 bg-primary-container/20 text-primary border border-primary-container/30 rounded-lg">
                    <p className="text-[9px] font-bold tracking-wider leading-none">HORA</p>
                    <p className="font-display text-body-lg text-primary font-bold mt-1 leading-none">{visit.time}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface truncate text-sm leading-tight">{visit.title}</p>
                    <p className="text-[11px] text-on-surface-variant truncate mt-0.5 font-medium">Cliente: {visit.clientName}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-secondary-container/50 text-on-secondary-container flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-secondary" />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full py-8 text-on-surface-variant">
                <Calendar className="w-8 h-8 text-outline-variant stroke-[1.5] mb-2" />
                <p className="text-xs font-semibold">Nenhuma visita agendada</p>
                <p className="text-[10px] opacity-70 mt-0.5">Cadastre uma nova tarefa com o tipo "VISITA"</p>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* AI Task Recommender Widget (Gemini integration!) */}
      <section className="relative bg-gradient-to-br from-primary-container/10 via-white to-primary-container/15 rounded-2xl p-6 border-2 border-primary-container/25 overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 opacity-10 translate-x-2 -translate-y-2">
          <Brain className="w-48 h-48 text-primary" />
        </div>
        
        <div className="relative z-10 max-w-[90%] space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-primary text-on-primary text-[10px] font-bold rounded-lg tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-secondary-fixed animate-pulse" />
              IA ASSISTENTE
            </span>
            <h4 className="font-display text-title-md text-primary leading-tight">Recomendações Inteligentes do Dia</h4>
          </div>

          <p className="text-on-surface-variant text-xs leading-relaxed max-w-xl">
            Clique no botão abaixo para analisar sua lista de clientes e imóveis com a IA do Gemini e receber 3 tarefas estratégicas personalizadas para fechar negócios hoje!
          </p>

          <button
            onClick={handleGenerateAiTasks}
            disabled={isGeneratingAiTasks || !dbStatus?.geminiActive}
            className="px-5 py-3 bg-primary text-on-primary rounded-xl font-label-md text-xs font-bold hover:opacity-90 transition-all shadow-md flex items-center gap-2 disabled:opacity-55 cursor-pointer"
          >
            {isGeneratingAiTasks ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analisando Oportunidades com Gemini...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 text-secondary-fixed" />
                Gerar Tarefas Recomendadas por IA
              </>
            )}
          </button>

          {/* AI suggested tasks display */}
          {suggestedAiTasks.length > 0 && (
            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <h5 className="text-xs font-bold text-primary uppercase tracking-wider">Ações Recomendadas:</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {suggestedAiTasks.map((task, idx) => {
                  const added = aiTasksAdded[idx];
                  return (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-primary-container/20 shadow-sm flex flex-col justify-between gap-3 text-left">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] font-bold text-secondary uppercase bg-secondary-container/20 px-2 py-0.5 rounded-md">
                            {task.type}
                          </span>
                          <span className="text-[10px] font-mono text-on-surface-variant font-bold">{task.time}</span>
                        </div>
                        <h6 className="font-bold text-on-surface text-sm leading-tight">{task.title}</h6>
                        <p className="text-[10px] text-on-surface-variant font-semibold">Cliente: {task.clientName}</p>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-3 mt-1 opacity-90">{task.description}</p>
                      </div>

                      <button
                        onClick={() => handleAddAiTask(task, idx)}
                        disabled={added}
                        className={`w-full py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          added
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-primary text-on-primary hover:opacity-95 shadow-sm"
                        }`}
                      >
                        {added ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Adicionado à Agenda!
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Agendar na Timeline
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Asymmetric Promotional Banner */}
      <section className="relative bg-primary-container text-on-primary rounded-2xl overflow-hidden p-6 shadow-sm border border-primary-container/30 flex items-center">
        <div className="relative z-10 max-w-[65%] space-y-2">
          <h4 className="font-display text-headline-lg-mobile text-white leading-tight">Treinamento de Negociação</h4>
          <p className="text-xs text-on-primary-container opacity-90 leading-relaxed max-w-md">
            Aprenda novas técnicas de copywriting imobiliário e programação neurolinguística (PNL) para converter leads frios em compradores ativos de alto padrão.
          </p>
          <button className="bg-secondary-fixed text-on-secondary-fixed px-4 py-2 rounded-xl font-label-md text-xs font-bold hover:opacity-95 transition-all mt-2 cursor-pointer shadow-sm">
            Assistir Agora
          </button>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-30">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80')"
            }}
          ></div>
        </div>
      </section>

    </div>
  );
}
