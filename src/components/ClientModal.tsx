import React, { useState } from "react";
import { motion } from "motion/react";
import { Client } from "../types";
import { X, User, Phone, Mail, Award, Landmark, Trash2, Edit, Save, Loader2, Check, Cake, MapPin } from "lucide-react";

interface ClientModalProps {
  client: Client;
  onClose: () => void;
  onUpdate: (updated: Client) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function ClientModal({ client, onClose, onUpdate, onDelete }: ClientModalProps) {
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
  const [pipelineStatus, setPipelineStatus] = useState(client.pipelineStatus || "Em Atendimento");
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
        className="relative bg-surface w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-outline-variant/30"
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
                    <option value="Em Atendimento">Em Atendimento</option>
                    <option value="Em Visita">Em Visita</option>
                    <option value="Em Proposta">Em Proposta</option>
                    <option value="Fase de Contrato">Fase de Contrato</option>
                    <option value="Contrato Assinado">Contrato Assinado</option>
                    <option value="Fase de Documentação">Fase de Documentação</option>
                    <option value="Finalização do Processo">Finalização do Processo</option>
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
