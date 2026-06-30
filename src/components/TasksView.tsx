import React, { useState } from "react";
import { Task } from "../types";
import { Calendar, Clock, Check, Plus, Trash2, X, Save, Loader2, ListChecks, Star } from "lucide-react";

interface TasksViewProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, "id">) => Promise<void>;
  onToggleTaskCompletion: (id: string, completed: boolean) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

export default function TasksView({
  tasks,
  onAddTask,
  onToggleTaskCompletion,
  onDeleteTask,
  selectedDate: propSelectedDate,
  onDateChange: propOnDateChange,
}: TasksViewProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const selectedDate = propSelectedDate !== undefined ? propSelectedDate : internalSelectedDate;
  const setSelectedDate = propOnDateChange !== undefined ? propOnDateChange : setInternalSelectedDate;
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for creating a new task
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("10:00");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("FOLLOW-UP");

  // Generate 7 days for the compact calendar: starts 3 days before selectedDate
  const calendarDays = React.useMemo(() => {
    const days = [];
    const baseDate = new Date();
    
    // We render 7 days starting from 3 days ago up to 3 days from now
    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(baseDate.getDate() + i);
      
      const weekday = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      const formattedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      
      days.push({
        dateString: d.toISOString().split("T")[0],
        dayNumber: d.getDate(),
        weekdayName: formattedWeekday,
        isToday: d.toISOString().split("T")[0] === new Date().toISOString().split("T")[0]
      });
    }
    return days;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert("Por favor, preencha o título da tarefa.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newTask: Omit<Task, "id"> = {
        title,
        date: selectedDate,
        time,
        clientName: clientName || "Geral",
        description,
        type,
        completed: false,
        createdAt: new Date().toISOString()
      };

      await onAddTask(newTask);
      
      // Reset form
      setTitle("");
      setTime("10:00");
      setClientName("");
      setDescription("");
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      alert("Falha ao cadastrar tarefa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (task: Task) => {
    try {
      await onToggleTaskCompletion(task.id || task._id || "", !task.completed);
    } catch (err) {
      console.error(err);
      alert("Falha ao atualizar tarefa.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja excluir permanentemente esta tarefa da agenda?")) {
      try {
        await onDeleteTask(id);
      } catch (err) {
        console.error(err);
        alert("Falha ao excluir tarefa.");
      }
    }
  };

  // Filter tasks for the selectedDate
  const dailyTasks = tasks.filter((t) => t.date === selectedDate);

  // Statistics for selected date
  const completedCount = dailyTasks.filter((t) => t.completed).length;
  const totalCount = dailyTasks.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {!showAddForm ? (
        /* TASKS WORKSPACE TIMELINE */
        <>
          {/* Calendar slider */}
          <section className="bg-surface p-1 rounded-2xl">
            <div className="flex justify-between items-center mb-3 px-1">
              <h3 className="font-display text-title-md text-primary font-bold">
                {new Date(selectedDate).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(/^\w/, (c) => c.toUpperCase())}
              </h3>
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                className="text-xs text-secondary hover:underline font-bold"
              >
                Ir para Hoje
              </button>
            </div>

            {/* Horizontal Compact Days list */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
              {calendarDays.map((day) => {
                const isSelected = selectedDate === day.dateString;
                return (
                  <button
                    key={day.dateString}
                    onClick={() => setSelectedDate(day.dateString)}
                    className={`flex-shrink-0 w-14 h-20 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-on-primary shadow-md scale-105"
                        : "bg-surface-container-lowest border border-outline-variant hover:border-primary/50 text-on-surface"
                    }`}
                  >
                    <span className={`text-[10px] font-semibold ${isSelected ? "text-white/80" : "text-on-surface-variant"}`}>
                      {day.weekdayName}
                    </span>
                    <span className="font-display text-body-lg font-bold mt-1">
                      {day.dayNumber}
                    </span>
                    {day.isToday && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? "bg-white" : "bg-primary"}`}></span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Daily overview status */}
          <section className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex flex-col justify-center">
              <span className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                Tarefas Concluídas
              </span>
              <span className="font-display text-headline-lg-mobile text-primary mt-1">
                {completedCount.toString().padStart(2, "0")}/{totalCount.toString().padStart(2, "0")}
              </span>
            </div>

            <div className="bg-primary text-on-primary p-4 rounded-xl shadow-md flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Calendar className="w-20 h-20" />
              </div>
              <span className="font-label-md text-[10px] text-white/80 uppercase tracking-wider font-bold">
                Status do Dia
              </span>
              <span className="font-display text-sm block mt-1.5 font-semibold">
                {totalCount === 0 
                  ? "Nenhum compromisso pendente hoje" 
                  : completedCount === totalCount 
                  ? "Tudo em dia por hoje! Nenhum follow-up esquecido. 🎉" 
                  : `${totalCount - completedCount} compromissos restantes`}
              </span>
            </div>
          </section>

          {/* Daily Timeline */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-display text-title-md text-on-surface font-bold">Timeline do Dia</h3>
              <span className="text-xs text-on-surface-variant font-medium">
                {new Date(selectedDate).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
              </span>
            </div>

            <div className="space-y-3 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-[2px] before:bg-outline-variant/60">
              {dailyTasks.length > 0 ? (
                dailyTasks.map((t, idx) => (
                  <div key={t.id || t._id || `task-${idx}`} className="flex gap-4 group">
                    {/* Time bullet */}
                    <div className="flex flex-col items-center pt-1.5 z-10">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        t.completed ? "bg-secondary border-secondary text-white" : "bg-white border-outline-variant"
                      }`}>
                        {t.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Task card */}
                    <div className={`flex-1 bg-surface-container-lowest border rounded-xl p-4 shadow-sm flex items-start gap-4 transition-all ${
                      t.completed ? "border-outline-variant/40 opacity-70" : "border-outline-variant/30 hover:border-primary/20 hover:shadow-md"
                    }`}>
                      <div className="flex-1 space-y-1 text-left min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            t.type === "VISITA"
                              ? "bg-emerald-100 text-emerald-800"
                              : t.type === "FOLLOW-UP"
                              ? "bg-amber-100 text-amber-800"
                              : t.type === "CONTRATO"
                              ? "bg-teal-100 text-teal-800"
                              : "bg-slate-100 text-slate-800"
                          }`}>
                            {t.type}
                          </span>
                          <span className="text-xs font-mono font-bold text-on-surface-variant">{t.time}</span>
                        </div>

                        <h4 className={`font-bold text-on-surface text-sm leading-snug ${t.completed ? "line-through opacity-60" : ""}`}>
                          {t.title}
                        </h4>

                        <p className="text-[11px] text-on-surface-variant font-semibold">Cliente: {t.clientName}</p>
                        
                        {t.description && (
                          <p className="text-xs text-on-surface-variant/80 pt-1 leading-relaxed border-t border-outline-variant/10 mt-1 whitespace-pre-wrap">
                            {t.description}
                          </p>
                        )}
                      </div>

                      {/* Interactive elements */}
                      <div className="flex flex-col items-end gap-3 flex-shrink-0">
                        <button
                          onClick={() => handleToggle(t)}
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                            t.completed 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                              : "bg-white border-outline-variant hover:border-primary text-on-surface-variant"
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id || t._id || "")}
                          className="w-7 h-7 rounded-lg border border-red-100 bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 text-on-surface-variant bg-surface-container-low rounded-xl border border-dashed border-outline-variant/40 ml-10">
                  <ListChecks className="w-8 h-8 text-outline-variant stroke-[1.5] mb-2" />
                  <p className="font-bold text-xs">Sem compromissos ou follow-ups agendados para este dia</p>
                  <p className="text-[10px] opacity-75 mt-0.5">Nenhum follow-up perdido. Agende um novo compromisso para manter contato constante com seus leads.</p>
                </div>
              )}
            </div>
          </section>

          {/* FAB to add task */}
          <button
            onClick={() => setShowAddForm(true)}
            className="fixed right-6 bottom-24 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer border border-primary-container/20"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </>
      ) : (
        /* ADICIONAR TAREFA FORM VIEW */
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <header className="flex justify-between items-center pb-4 border-b border-outline-variant mb-6">
            <h2 className="font-display text-headline-lg-mobile text-primary">Agendar Novo Compromisso</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4 text-sm text-left">
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant">Data da Tarefa</label>
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-11 px-3 border border-outline-variant rounded-lg bg-white outline-none text-sm font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant">Tipo de Atividade</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-11 px-3 border border-outline-variant bg-white rounded-lg text-sm font-semibold outline-none"
                >
                  <option>VISITA</option>
                  <option>FOLLOW-UP</option>
                  <option>CONTRATO</option>
                  <option>OUTRO</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant">Título / Atividade</label>
              <input
                type="text"
                required
                placeholder="Ex: Assinatura de contrato ou Visita cobertura"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 px-3 border border-outline-variant rounded-lg bg-white outline-none text-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant">Nome do Cliente</label>
              <input
                type="text"
                placeholder="Ex: Ricardo Albuquerque (ou selecione na ficha do cliente)"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="h-11 px-3 border border-outline-variant rounded-lg bg-white outline-none text-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant">Descrição / Observações</label>
              <textarea
                rows={3}
                placeholder="Descreva o objetivo da atividade (ex: follow-up de proposta, envio de fotos por WhatsApp, visita ao imóvel...)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="p-3 border border-outline-variant rounded-lg bg-white outline-none text-sm resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-3 bg-surface-container-high text-on-surface-variant rounded-xl font-bold font-label-md"
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
                    Agendar Compromisso
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
