import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User as UserIcon, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Briefcase, 
  BadgeCheck, 
  ChevronRight,
  TrendingUp,
  HeartHandshake
} from "lucide-react";
import { User } from "../types";
import { apiFetch } from "../api";

interface OnboardingModalProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

const ACTING_TYPES = [
  { id: "Venda", label: "Venda", desc: "Foco em transações de compra e venda de imóveis." },
  { id: "Locação", label: "Locação", desc: "Especializado em aluguel residencial ou comercial." },
  { id: "Lançamentos", label: "Lançamentos", desc: "Venda de imóveis na planta e novos empreendimentos." },
  { id: "Usados", label: "Usados", desc: "Intermediação de imóveis prontos de terceiros." },
  { id: "Alto padrão", label: "Alto padrão", desc: "Mercado de luxo, altíssimo padrão e propriedades exclusivas." },
  { id: "Minha Casa Minha Vida", label: "Minha Casa Minha Vida", desc: "Foco em habitação popular e subsídios." },
  { id: "Geral", label: "Geral", desc: "Atuação completa em múltiplos segmentos de mercado." }
];

export default function OnboardingModal({ user, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0); // 0: Welcome, 1: Profile & Business, 2: actingType & Contacts, 3: Final Preview
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState(user.name || "");
  const [commercialName, setCommercialName] = useState("");
  const [creci, setCreci] = useState("");
  const [primaryCity, setPrimaryCity] = useState("");
  const [phone, setPhone] = useState(user.phone || "");
  const [email, setEmail] = useState(user.email || "");
  const [actingType, setActingType] = useState<typeof ACTING_TYPES[number]["id"]>("Geral");

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError("O nome do corretor é obrigatório.");
        return;
      }
    } else if (step === 2) {
      if (!primaryCity.trim()) {
        setError("A cidade principal de atuação é obrigatória.");
        return;
      }
      if (!phone.trim()) {
        setError("O telefone comercial é obrigatório.");
        return;
      }
      if (!email.trim()) {
        setError("O e-mail comercial é obrigatório.");
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => Math.max(0, prev - 1));
  };

  const handleFinish = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedData: Partial<User> = {
        name: name.trim(),
        commercialName: commercialName.trim() || undefined,
        creci: creci.trim() || undefined,
        primaryCity: primaryCity.trim(),
        phone: phone.trim(),
        email: email.trim(),
        actingType: actingType as any,
        onboardingCompleted: true
      };

      const res = await apiFetch(`/api/auth/update/${user.id || user._id || user.username || "vega"}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Erro ao salvar os dados de onboarding.");
      }

      const savedUser = await res.json();
      onComplete(savedUser);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro de rede ao salvar onboarding.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(#cfa85c_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative bg-surface w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/40 flex flex-col max-h-[90vh] md:max-h-[85vh]"
        id="onboarding-container"
      >
        {/* Step Indicator Top Bar */}
        <div className="flex h-1.5 w-full bg-surface-container-high">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className={`h-full flex-1 transition-all duration-500 ${
                idx <= step ? "bg-primary" : "bg-transparent"
              }`}
            />
          ))}
        </div>

        {/* Header - Brand */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-outline-variant/40 shrink-0 bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4 text-secondary-fixed" />
            </div>
            <div>
              <span className="text-[9px] text-secondary font-bold uppercase tracking-widest block leading-none">Primeiro Acesso</span>
              <h1 className="font-display text-sm font-extrabold text-primary tracking-tight leading-none">Metria CRM Onboarding</h1>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-on-surface-variant/70 bg-surface-container px-2 py-1 rounded-md">
            Etapa {step + 1} de 4
          </span>
        </header>

        {/* Scrollable Container Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {error && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container text-xs font-semibold rounded-xl border border-error/20">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 text-center"
              >
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center text-primary shadow-inner">
                  <HeartHandshake className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-display text-2xl font-black text-primary tracking-tight leading-tight">
                    Seja muito bem-vindo ao Metria CRM!
                  </h2>
                  <p className="text-on-surface-variant text-sm max-w-md mx-auto leading-relaxed">
                    A plataforma inteligente desenhada para que você nunca mais perca um lead, uma visita ou um follow-up. Organize sua rotina comercial, acompanhe cada oportunidade de negócio e saiba exatamente quem atender hoje.
                  </p>
                </div>

                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-left space-y-3 max-w-md mx-auto">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-secondary" />
                    O que esta configuração personaliza?
                  </h3>
                  <ul className="text-xs text-on-surface-variant space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>Seu <strong>Dashboard principal</strong> com metas e greetings inteligentes.</li>
                    <li>Sua <strong>Assinatura exclusiva de mensagens</strong> para compartilhar imóveis com 1 clique no WhatsApp.</li>
                    <li>Sua <strong>Cidade padrão</strong> pré-preenchida ao cadastrar novos imóveis e clientes.</li>
                  </ul>
                </div>

                <button
                  onClick={handleNext}
                  className="w-full max-w-xs py-3 bg-primary text-on-primary font-bold text-sm rounded-xl hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer mx-auto"
                >
                  Configurar Minha Conta
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="font-display text-lg font-bold text-primary">Identificação Profissional</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">Identifique-se para que as propostas e relatórios fiquem com a sua cara.</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                      Nome do Corretor <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/60" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Carlos Eduardo Silveira"
                        className="w-full pl-11 pr-4 py-2.5 text-sm bg-surface-container-high border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-on-surface"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                      Nome Comercial ou Imobiliária <span className="text-on-surface-variant/50 font-normal">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/60" />
                      <input
                        type="text"
                        value={commercialName}
                        onChange={(e) => setCommercialName(e.target.value)}
                        placeholder="Ex: Prime Estate Imóveis ou Autônomo"
                        className="w-full pl-11 pr-4 py-2.5 text-sm bg-surface-container-high border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-on-surface"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                      Número do CRECI <span className="text-on-surface-variant/50 font-normal">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <BadgeCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/60" />
                      <input
                        type="text"
                        value={creci}
                        onChange={(e) => setCreci(e.target.value)}
                        placeholder="Ex: CRECI 24680-F"
                        className="w-full pl-11 pr-4 py-2.5 text-sm bg-surface-container-high border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-on-surface"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="font-display text-lg font-bold text-primary">Atuação & Contatos Comerciais</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">Defina seus canais de atendimento e sua especialidade imobiliária.</p>
                </div>

                <div className="space-y-3.5 pt-1.5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                        Cidade Principal de Atuação <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/60" />
                        <input
                          type="text"
                          required
                          value={primaryCity}
                          onChange={(e) => setPrimaryCity(e.target.value)}
                          placeholder="Ex: São Paulo / SP"
                          className="w-full pl-11 pr-4 py-2.5 text-sm bg-surface-container-high border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-on-surface"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                        WhatsApp Comercial <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/60" />
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Ex: (11) 98765-4321"
                          className="w-full pl-11 pr-4 py-2.5 text-sm bg-surface-container-high border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-on-surface"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                      E-mail Comercial <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/60" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ex: consultor@imobiliaria.com"
                        className="w-full pl-11 pr-4 py-2.5 text-sm bg-surface-container-high border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-on-surface"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                      Tipo de Atuação / Segmento Principal
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/60 z-10" />
                      <select
                        value={actingType}
                        onChange={(e) => setActingType(e.target.value)}
                        className="w-full pl-11 pr-10 py-2.5 text-sm bg-surface-container-high border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-on-surface appearance-none cursor-pointer"
                      >
                        {ACTING_TYPES.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.label} ({type.desc})
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60 pointer-events-none rotate-90" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="text-center pb-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shadow-sm mb-2">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h2 className="font-display text-lg font-bold text-primary">Sua nova rotina comercial começa agora!</h2>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Configurações personalizadas salvas com sucesso. Agora, você tem o poder de garantir que nenhum lead, visita, proposta ou follow-up seja esquecido. Prepare-se para decolar suas negociações!
                  </p>
                </div>

                <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                    <div>
                      <span className="text-on-surface-variant font-bold block uppercase tracking-wider text-[10px]">Consultor</span>
                      <span className="font-semibold text-on-surface text-sm">{name}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant font-bold block uppercase tracking-wider text-[10px]">CRECI</span>
                      <span className="font-semibold text-on-surface text-sm">{creci || "Não informado"}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant font-bold block uppercase tracking-wider text-[10px]">Imobiliária</span>
                      <span className="font-semibold text-on-surface text-sm">{commercialName || "Profissional Autônomo"}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant font-bold block uppercase tracking-wider text-[10px]">Segmento</span>
                      <span className="font-semibold text-on-surface text-sm">{actingType}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant font-bold block uppercase tracking-wider text-[10px]">Cidade</span>
                      <span className="font-semibold text-on-surface text-sm">{primaryCity}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant font-bold block uppercase tracking-wider text-[10px]">WhatsApp</span>
                      <span className="font-semibold text-on-surface text-sm">{phone}</span>
                    </div>
                  </div>

                  {/* Assinatura Preview Box */}
                  <div className="pt-3 border-t border-outline-variant/40">
                    <span className="text-on-surface-variant font-bold block uppercase tracking-wider text-[10px] mb-1.5">
                      Sua Assinatura Comercial Ativada:
                    </span>
                    <pre className="p-3 bg-white rounded-xl border border-outline-variant/40 font-mono text-[10px] leading-relaxed text-on-surface-variant max-h-32 overflow-y-auto whitespace-pre-wrap shadow-inner">
{`Atenciosamente,
*${name}*
${commercialName ? `${commercialName} | ` : ""}${creci ? `CRECI: ${creci} | ` : ""}Foco: ${actingType}
WhatsApp: ${phone}
E-mail: ${email}`}
                    </pre>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <footer className="px-6 py-4 border-t border-outline-variant/40 bg-surface-container-low shrink-0 flex items-center justify-between gap-3">
          {step > 0 && step < 4 && (
            <button
              onClick={handleBack}
              disabled={isLoading}
              className="px-4 py-2.5 border border-outline rounded-xl font-bold text-xs text-on-surface-variant hover:bg-surface-container-high transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          )}

          {step === 0 ? (
            <div className="w-full flex justify-end">
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-md shadow-primary/10 cursor-pointer"
              >
                Avançar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : step < 3 ? (
            <button
              onClick={handleNext}
              className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-md shadow-primary/10 cursor-pointer ml-auto"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isLoading}
              className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 cursor-pointer"
            >
              {isLoading ? "Salvando Configurações..." : "Concluir e Começar no Metria CRM"}
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </footer>
      </motion.div>
    </div>
  );
}
