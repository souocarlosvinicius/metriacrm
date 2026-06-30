import React, { useState, useEffect } from "react";
import { Client, User } from "../types";
import { Search, UserPlus, Mail, Phone, Plus, X, Save, Loader2, Check } from "lucide-react";

interface ClientsViewProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, "id">) => Promise<void>;
  onSelectClient: (client: Client) => void;
  currentUser?: User | null;
}

export default function ClientsView({ clients, onAddClient, onSelectClient, currentUser }: ClientsViewProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for creating a new client
  const [clientType, setClientType] = useState<"PF" | "PJ">("PF");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [profileType, setProfileType] = useState("Lead");
  const [objective, setObjective] = useState("Venda");
  const [propertyType, setPropertyType] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [observations, setObservations] = useState("");
  const [birthday, setBirthday] = useState("");
  const [address, setAddress] = useState("");

  // New real estate CRM fields
  const [leadSource, setLeadSource] = useState("Outro");
  const [interest, setInterest] = useState("Compra");
  const [budgetRange, setBudgetRange] = useState("");
  const [neighborhoodOfInterest, setNeighborhoodOfInterest] = useState("");
  const [desiredPropertyType, setDesiredPropertyType] = useState("");
  const [temperature, setTemperature] = useState<"Frio" | "Morno" | "Quente">("Morno");
  const [nextAction, setNextAction] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");

  useEffect(() => {
    if (showAddForm && currentUser?.primaryCity) {
      setAddress(currentUser.primaryCity);
    }
  }, [showAddForm, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Por favor, preencha o nome e o telefone do cliente.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newClient: Omit<Client, "id"> = {
        clientType,
        name,
        phone,
        document,
        email,
        profileType,
        objective,
        propertyType: propertyType || "Qualquer",
        minBudget: Number(minBudget) || 0,
        maxBudget: Number(maxBudget) || 0,
        observations,
        birthday: birthday || undefined,
        address: address || undefined,
        status: "Novo",
        leadSource,
        interest,
        budgetRange,
        neighborhoodOfInterest,
        desiredPropertyType,
        temperature,
        nextAction,
        nextFollowUpDate: nextFollowUpDate || undefined,
        createdAt: new Date().toISOString()
      };

      await onAddClient(newClient);
      
      // Reset form
      setClientType("PF");
      setName("");
      setPhone("");
      setDocument("");
      setEmail("");
      setPropertyType("");
      setMinBudget("");
      setMaxBudget("");
      setObservations("");
      setBirthday("");
      setAddress("");
      setLeadSource("Outro");
      setInterest("Compra");
      setBudgetRange("");
      setNeighborhoodOfInterest("");
      setDesiredPropertyType("");
      setTemperature("Morno");
      setNextAction("");
      setNextFollowUpDate("");
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      alert("Falha ao salvar cliente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get visual initials for user avatar
  const getInitials = (fullName: string) => {
    return (fullName || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";
  };

  // Filter clients list
  const filteredClients = clients.filter((c) => {
    const matchesFilter = filter === "Todos" || c.profileType === filter;
    
    const query = search.toLowerCase();
    const matchesSearch =
      (c.name || "").toLowerCase().includes(query) ||
      (c.phone || "").includes(query) ||
      (c.email || "").toLowerCase().includes(query) ||
      (c.observations || "").toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {!showAddForm ? (
        /* MAIN LISTING SCREEN */
        <>
          {/* Top Search & Filter Bar */}
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <Search className="w-5 h-5 stroke-[2]" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, telefone, e-mail ou observações..."
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-lg text-sm text-on-surface"
              />
            </div>

            {/* Profile Type Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["Todos", "Lead", "Comprador", "Vendedor", "Locador", "Locatário", "Investidor"].map((tab) => {
                const isActive = filter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-4 py-2 rounded-full border text-xs font-bold whitespace-nowrap transition-all shadow-sm cursor-pointer ${
                      isActive
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Client List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="font-label-caps text-xs text-on-surface-variant tracking-wider font-bold">LEADS E CLIENTES CADASTRADOS</span>
              <span className="text-xs text-primary font-bold">{filteredClients.length} contatos</span>
            </div>

            <div className="space-y-3">
              {filteredClients.map((c, idx) => (
                <div
                  key={c.id || c._id || `client-${idx}`}
                  onClick={() => onSelectClient(c)}
                  className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4 border border-outline-variant/20 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-display text-title-md font-bold shadow-inner">
                    {getInitials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-display text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate flex items-center gap-1.5">
                        {c.name}
                        {c.clientType === "PJ" ? (
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-[9px] font-bold rounded">PJ</span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 text-[9px] font-bold rounded">PF</span>
                        )}
                      </h4>
                      <span className="text-[10px] text-on-surface-variant font-mono whitespace-nowrap">
                        {new Date(c.createdAt || "").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant font-semibold mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-secondary" />
                        {c.phone}
                      </span>
                    </div>

                    <p className="text-[11px] text-on-surface-variant flex items-center gap-1.5 mt-2 font-medium">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      {c.profileType} • {c.objective} ({c.propertyType})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empty fallback */}
          {filteredClients.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-16 text-on-surface-variant bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/50">
              <UserPlus className="w-12 h-12 text-outline-variant stroke-[1] mb-3" />
              <p className="font-bold">Nenhum lead ou cliente encontrado</p>
              <p className="text-xs opacity-80 mt-1 max-w-xs">Busque por outro termo ou cadastre um novo cliente para organizar seus follow-ups.</p>
            </div>
          )}

          {/* Floating Action Button for adding client */}
          <button
            onClick={() => setShowAddForm(true)}
            className="fixed right-6 bottom-24 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer border border-primary-container/20"
          >
            <UserPlus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </>
      ) : (
        /* NOVO CLIENTE FORM SCREEN */
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <header className="flex justify-between items-center pb-4 border-b border-outline-variant mb-6">
            <h2 className="font-display text-headline-lg-mobile text-primary">Cadastrar Novo Cliente</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6 text-sm text-left">
                      {/* Section 1: Personal Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-4 bg-secondary rounded-full"></span>
                1. Informações do Cliente
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">Tipo de Cliente</label>
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
                <label className="text-xs font-semibold text-on-surface-variant">
                  {clientType === "PJ" ? "Razão Social / Nome Fantasia" : "Nome Completo"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={clientType === "PJ" ? "Ex: Minha Empresa LTDA" : "Ex: João da Silva"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 px-3 border border-outline-variant rounded-lg bg-white focus:border-secondary outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Telefone</label>
                  <input
                    type="tel"
                    required
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 px-3 border border-outline-variant rounded-lg bg-white focus:border-secondary outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant">
                    {clientType === "PJ" ? "CNPJ" : "CPF"}
                  </label>
                  <input
                    type="text"
                    placeholder={clientType === "PJ" ? "00.000.000/0001-00" : "000.000.000-00"}
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    className="h-11 px-3 border border-outline-variant rounded-lg bg-white focus:border-secondary outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant">E-mail</label>
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 px-3 border border-outline-variant rounded-lg bg-white focus:border-secondary outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Data de Aniversário</label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="h-11 px-3 border border-outline-variant rounded-lg bg-white focus:border-secondary outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant">Endereço Completo</label>
                <input
                  type="text"
                  placeholder="Ex: Av. Atlântica, 1200 - Copacabana, Rio de Janeiro - RJ"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-11 px-3 border border-outline-variant rounded-lg bg-white focus:border-secondary outline-none text-sm"
                />
              </div>
            </div>

            {/* Section 2: Profile Type Selection */}
            <div className="space-y-4 pt-2 border-t border-outline-variant/40">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-4 bg-secondary rounded-full"></span>
                2. Tipo de Perfil
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["Lead", "Comprador", "Vendedor", "Locador", "Locatário", "Investidor"].map((item) => {
                  const isActive = profileType === item;
                  return (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setProfileType(item)}
                      className={`py-3 rounded-lg border text-center font-bold text-xs cursor-pointer transition-all ${
                        isActive
                          ? "bg-secondary-container/25 border-secondary text-secondary"
                          : "bg-white border-outline-variant text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Preferences & Interest */}
            <div className="space-y-4 pt-2 border-t border-outline-variant/40">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-4 bg-secondary rounded-full"></span>
                3. Interesse Imobiliário e Qualificação de Lead
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Objetivo de Interesse</label>
                  <select
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    className="h-11 px-3 border border-outline-variant bg-white rounded-lg text-sm outline-none"
                  >
                    <option value="Compra">Compra</option>
                    <option value="Venda">Venda</option>
                    <option value="Locação">Locação</option>
                    <option value="Avaliação">Avaliação</option>
                    <option value="Investimento">Investimento</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Tipo de Imóvel Desejado</label>
                  <input
                    type="text"
                    value={desiredPropertyType}
                    onChange={(e) => setDesiredPropertyType(e.target.value)}
                    placeholder="Ex: Apartamento, Casa de Condomínio"
                    className="h-11 px-3 border border-outline-variant rounded-lg bg-white outline-none text-sm focus:border-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Bairro de Interesse</label>
                  <input
                    type="text"
                    value={neighborhoodOfInterest}
                    onChange={(e) => setNeighborhoodOfInterest(e.target.value)}
                    placeholder="Ex: Copacabana, Ipanema"
                    className="h-11 px-3 border border-outline-variant rounded-lg bg-white outline-none text-sm focus:border-secondary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Faixa de Orçamento</label>
                  <input
                    type="text"
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    placeholder="Ex: R$ 500k - R$ 800k"
                    className="h-11 px-3 border border-outline-variant rounded-lg bg-white outline-none text-sm focus:border-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Origem do Lead</label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value)}
                    className="h-11 px-3 border border-outline-variant bg-white rounded-lg text-sm outline-none"
                  >
                    <option value="Indicação">Indicação</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="OLX">OLX</option>
                    <option value="Portal Imobiliário">Portal Imobiliário</option>
                    <option value="Placa">Placa</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Tráfego Pago">Tráfego Pago</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Temperatura do Lead</label>
                  <select
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value as any)}
                    className="h-11 px-3 border border-outline-variant bg-white rounded-lg text-sm outline-none"
                  >
                    <option value="Frio">Frio</option>
                    <option value="Morno">Morno</option>
                    <option value="Quente">Quente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Próxima Ação Planejada</label>
                  <input
                    type="text"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    placeholder="Ex: Enviar opções do Jardim Oceânico"
                    className="h-11 px-3 border border-outline-variant rounded-lg bg-white outline-none text-sm focus:border-secondary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Data do Próximo Follow-up</label>
                  <input
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="h-11 px-3 border border-outline-variant rounded-lg bg-white outline-none text-sm focus:border-secondary"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Observations */}
            <div className="space-y-4 pt-2 border-t border-outline-variant/40">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-4 bg-secondary rounded-full"></span>
                4. Observações e Perfil
              </h3>

              <textarea
                rows={4}
                placeholder="Anotações e detalhes adicionais sobre o perfil do cliente, preferências de bairros, se precisa de financiamento, horários de contato preferidos..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full p-3 border border-outline-variant rounded-lg bg-white focus:border-secondary outline-none text-sm resize-none"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-outline-variant">
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
                    Salvando Cliente...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Cliente
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
