import React, { useState, useEffect } from "react";
import { useSmartMaqueiroData } from "./hooks/useSmartMaqueiroData";
import { LoginScreen, HospitalVidaLogo } from "./components/LoginScreen";
import { MuralPanel } from "./components/MuralPanel";
import { GOOGLE_APPS_SCRIPT_CODE } from "./gas-code";
import { 
  Activity, 
  Monitor,
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  LogOut, 
  Settings, 
  Database, 
  FileText, 
  Sparkles, 
  Users, 
  Heart,
  Truck,
  Volume2, 
  RotateCcw, 
  ArrowRight, 
  Search, 
  AlertTriangle, 
  ShieldAlert, 
  HelpCircle,
  TrendingUp,
  Sliders,
  X,
  Copy,
  Check,
  Play,
  ClipboardList,
  Compass,
  Zap,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  UserPlus
} from "lucide-react";
import { PrioridadeChamado, StatusChamado, Chamado } from "./types";
import { playHospitalBell, playEmergencySiren, playSuccessChime } from "./components/AudioAlerts";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const {
    chamados,
    logs,
    stats,
    allUsers = [],
    locais = [],
    usuariosOnline,
    usuariosOnlineCount,
    loading,
    error,
    user,
    toasts,
    isGoogleSheets,
    appsScriptUrl,
    activeRole,
    login,
    logout,
    criarChamado,
    atualizarStatus,
    saveIntegrationConfig,
    criarUsuario,
    criarLocal,
    recarregar,
    resetLocalDemo
  } = useSmartMaqueiroData();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'fila' | 'dashboard' | 'logs' | 'gas' | 'usuarios' | 'mural'>('fila');
  
  // Public Mural panel viewing state (when not logged in)
  const [showPublicPanel, setShowPublicPanel] = useState(false);
  
  // Admin Create User form state
  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newUserType, setNewUserType] = useState<'Enfermagem' | 'Maqueiro' | 'Admin'>("Enfermagem");
  
  // admin Create Location state
  const [newLocalNome, setNewLocalNome] = useState("");
  const [newLocalTipo, setNewLocalTipo] = useState<'Origem' | 'Destino'>("Origem");
  
  // Create Request State
  const [paciente, setPaciente] = useState("");
  const [origem, setOrigem] = useState("Pronto Socorro - Triagem");
  const [destino, setDestino] = useState("Quarto 104");
  const [prioridade, setPrioridade] = useState<PrioridadeChamado>("Media");
  const [observacao, setObservacao] = useState("");
  const [showCreateFormMobile, setShowCreateFormMobile] = useState(false);

  // Fallback defaults
  const defaultOrigins = [
    "Pronto Socorro - Triagem",
    "Pronto Socorro - Box 01",
    "Pronto Socorro - Box 02",
    "Pronto Socorro - Choque",
    "Recepção Principal",
    "Quarto 101 (Ala A)",
    "Radiologia (Raio-X)",
    "Laboratório de Análises",
    "Banco de Sangue"
  ];

  const defaultDestinations = [
    "Quarto 104",
    "Quarto 203 - Ala B",
    "Quarto 204",
    "UTI Geral (Leito 08)",
    "UTI Coronária",
    "Pediatria - Recreação",
    "Pediatria - Quarto 402",
    "Centro de Tomografia",
    "Centro Cirúrgico (Sala 04)",
    "Ressonância Magnética",
    "Centro Obstétrico",
    "Hemodiálise",
    "Fisioterapia",
    "Maternidade"
  ];

  const registeredSectors = Array.from(new Set(locais.map((l) => l.nome)));
  const activeOrigins = registeredSectors.length > 0
    ? registeredSectors
    : defaultOrigins;

  const activeDestinations = registeredSectors.length > 0
    ? registeredSectors
    : defaultDestinations;

  useEffect(() => {
    if (activeOrigins.length > 0 && !activeOrigins.includes(origem)) {
      setOrigem(activeOrigins[0]);
    }
  }, [activeOrigins, origem]);

  useEffect(() => {
    if (activeDestinations.length > 0 && !activeDestinations.includes(destino)) {
      setDestino(activeDestinations[0]);
    }
  }, [activeDestinations, destino]);

  // Settings Panel State
  const [showSettings, setShowSettings] = useState(false);
  const [tempUseSheets, setTempUseSheets] = useState(isGoogleSheets);
  const [tempUrl, setTempUrl] = useState(appsScriptUrl);

  // Filters
  const [filterPrioridade, setFilterPrioridade] = useState<string>("Todas");
  const [filterStatus, setFilterStatus] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState("");

  // Copy helper
  const [copied, setCopied] = useState(false);
  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper inside client to track elapsed time beautifully
  const getElapsedTimeText = (isoString?: string): string => {
    if (!isoString) return "---";
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Agora mesmo";
    if (diffMins === 1) return "Há 1 min";
    if (diffMins < 60) return `Há ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "Há 1h";
    if (diffHours < 24) return `Há ${diffHours}h`;
    return new Date(isoString).toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  const handleCreateRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paciente.trim()) {
      alert("Por favor, preencha o nome do paciente.");
      return;
    }
    const res = await criarChamado(paciente.trim(), origem, destino, prioridade, observacao.trim());
    if (res) {
      setPaciente("");
      setObservacao("");
      setPrioridade("Media");
      setShowCreateFormMobile(false);
    }
  };

  // Render Mural Panel directly if the public panel is activated (for TV monitor/dashboard visualizers)
  if (showPublicPanel) {
    return (
      <MuralPanel 
        chamados={chamados} 
        onClose={() => setShowPublicPanel(false)} 
        onRefresh={() => recarregar()}
        loading={loading}
      />
    );
  }

  // Render Login interface if user isn't authenticated
  if (!user) {
    return (
      <LoginScreen 
        onLogin={login} 
        loading={loading} 
        onOpenPanel={() => setShowPublicPanel(true)} 
      />
    );
  }

  // Filtered Chamados List
  const filteredChamados = chamados.filter(c => {
    const matchesPrio = filterPrioridade === "Todas" || c.prioridade === filterPrioridade;
    const matchesStatus = filterStatus === "Todas" || c.status === filterStatus;
    const matchesSearch = searchQuery.trim() === "" || 
      c.paciente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.origem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.destino.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.maqueiro && c.maqueiro.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.solicitante && c.solicitante.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesPrio && matchesStatus && matchesSearch;
  });

  // Color mappings for Priorities tailored for clinical light mode
  const getPriorityClasses = (prio: PrioridadeChamado) => {
    switch(prio) {
      case "Emergencia":
        return {
          badge: "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse font-extrabold uppercase",
          border: "border-l-4 border-l-rose-500",
          lightBg: "bg-rose-50/40"
        };
      case "Alta":
        return {
          badge: "bg-amber-100 text-amber-800 border border-amber-200 font-bold uppercase",
          border: "border-l-4 border-l-amber-500",
          lightBg: "bg-amber-50/20"
        };
      case "Media":
        return {
          badge: "bg-[#e3f2fd] text-[#1872b8] border border-[#1872b8]/20 font-semibold",
          border: "border-l-4 border-l-[#1872b8]",
          lightBg: "bg-[#e3f2fd]/10"
        };
      case "Baixa":
        return {
          badge: "bg-slate-100 text-slate-600 border border-slate-200 font-normal",
          border: "border-l-4 border-l-slate-400",
          lightBg: "bg-slate-50"
        };
    }
  };

  // Structured UI badge containing interactive progress indicators
  const getProgressTracker = (status: StatusChamado) => {
    const steps = [
      { key: "Aguardando", pct: 15, label: "Fila", color: "bg-amber-500" },
      { key: "Aceito", pct: 45, label: "Aceito", color: "bg-sky-500" },
      { key: "Em_Transporte", pct: 75, label: "Trânsito", color: "bg-[#1872b8]" },
      { key: "Finalizado", pct: 100, label: "Entregue", color: "bg-emerald-500" }
    ];

    if (status === "Cancelado") {
      return (
        <div className="flex flex-col gap-1 w-full max-w-[150px]">
          <div className="flex items-center justify-between text-[10px] font-bold text-rose-700 uppercase tracking-wider">
            <span>Cancelado</span>
            <span>0%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: `100%` }}></div>
          </div>
        </div>
      );
    }

    const currentStepIndex = steps.findIndex(s => s.key === status);
    const activeStep = steps[currentStepIndex] || steps[0];

    return (
      <div className="flex flex-col gap-1.5 w-full max-w-[160px] font-sans">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
          <span className="flex items-center gap-1 font-extrabold text-[#002C54]">
            <span className={`h-1.5 w-1.5 rounded-full ${activeStep.color} ${status === "Aguardando" || status === "Em_Transporte" ? "animate-ping" : ""}`}></span>
            {activeStep.label}
          </span>
          <span className="font-mono text-[#002C54]/70 font-bold">{activeStep.pct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
          <div className={`h-full ${activeStep.color} rounded-full transition-all duration-500`} style={{ width: `${activeStep.pct}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fbfe] text-slate-800 font-sans selection:bg-[#1872b8]/20 selection:text-[#1872b8] antialiased overflow-x-hidden">
      
      {/* Toast Overlay with subtle smooth motion */}
      <div id="toast-container" className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`p-4 rounded-xl shadow-lg border text-xs font-bold flex items-center justify-between pointer-events-auto backdrop-blur-md ${
                t.tipo === 'sucesso' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
                t.tipo === 'erro' ? 'bg-rose-50 border-rose-350 text-rose-800' :
                t.tipo === 'alerta' ? 'bg-amber-50 border-amber-300 text-amber-800' :
                'bg-white border-slate-200 text-slate-800 shadow-md'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    t.tipo === 'sucesso' ? 'bg-emerald-400' :
                    t.tipo === 'erro' ? 'bg-rose-400' :
                    'bg-[#42a5f5]'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    t.tipo === 'sucesso' ? 'bg-emerald-500' :
                    t.tipo === 'erro' ? 'bg-rose-500' :
                    'bg-[#1872b8]'
                  }`}></span>
                </span>
                <span className="leading-tight">{t.texto}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- Main Cockpit Header --- */}
      <header className="h-16 bg-[#002C54] border-b border-[#001D38] flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-md relative z-20 text-white">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-9 h-9 bg-white rounded-xl flex items-center justify-center font-bold shadow-md shadow-black/10"
          >
            <HospitalVidaLogo className="h-7 w-7" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black tracking-wider text-white">
                HOSPITAL <span className="text-[#42a5f5] font-black">VIDA</span>
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#001D38] text-[#42a5f5] border border-[#003B70]">
                SmartMaqueiro PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-350 tracking-wide uppercase font-semibold hidden sm:block">Humano por natureza • Painel de Gestão de Transportes Realtime</p>
          </div>

          {/* Connected Data Store Capsule */}
          <div className="ml-4 pl-4 border-l border-[#003B70] hidden md:flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isGoogleSheets ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></span>
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-300 bg-[#001D38] hover:bg-[#002547] px-2 py-1 rounded border border-[#003B70] transition-all" title="Origem dos Dados">
              {isGoogleSheets ? "GOOGLE PLANILHA ATIVA" : "MEMÓRIA LOCAL (SIMULADA)"}
            </span>
          </div>
        </div>

        {/* User profile & controls */}
        <div className="flex items-center gap-3.5">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] text-[#42a5f5] uppercase font-black tracking-widest leading-none">
              {user.tipo === "Admin" ? "DIRETORIA" : user.tipo}
            </p>
            <p className="text-xs font-bold text-white mt-1 leading-none">
              {user.nome}
            </p>
          </div>

          {/* Circle Avatar matching Hospital design */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setTempUseSheets(isGoogleSheets);
              setTempUrl(appsScriptUrl);
              setShowSettings(!showSettings);
            }}
            className="w-9 h-9 rounded-xl bg-[#001D38] border border-[#003B70] hover:border-[#1872b8] hover:bg-[#1872b8]/20 text-[#42a5f5] font-black text-xs uppercase cursor-pointer flex items-center justify-center shadow-inner"
            title="Sincronização e Áudios"
          >
            {user.nome.substring(0, 2).toUpperCase()}
          </motion.button>

          {/* Logout Icon */}
          <motion.button
            id="logout-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={logout}
            className="p-2 bg-[#001D38] hover:bg-rose-950/30 border border-[#003B70] text-slate-300 hover:text-rose-400 rounded-xl transition cursor-pointer"
            title="Encerrar Sessão"
          >
            <LogOut className="h-4.5 w-4.5" />
          </motion.button>
        </div>
      </header>

      {/* Preferences Modal Layer */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 bg-[#002C54]/30 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white text-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-150 space-y-5"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-[#002C54] flex items-center gap-2">
                  <Settings className="h-5 w-5 text-[#1872b8] animate-spin-slow" />
                  Preferências de Sincronia & Alertas
                </h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2.5">Origem de Dados dos Chamados</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTempUseSheets(false);
                        setTempUrl("");
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-left transition relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                        !tempUseSheets 
                          ? "border-[#1872b8] bg-[#e3f2fd]/40 text-[#1872b8]" 
                          : "border-slate-100 hover:border-slate-200 text-slate-500 bg-slate-50/50"
                      }`}
                    >
                      <span className="text-xs font-extrabold uppercase tracking-wide">Memória Demo</span>
                      <span className="text-[10px] text-slate-500 mt-2 leading-relaxed">Em memória no servidor. Dados são reiniciados ao dar logout.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTempUseSheets(true)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                        tempUseSheets 
                          ? "border-[#1872b8] bg-[#e3f2fd]/40 text-[#1872b8]" 
                          : "border-slate-100 hover:border-slate-200 text-slate-500 bg-slate-50/50"
                      }`}
                    >
                      <span className="text-xs font-extrabold uppercase tracking-wide">Planilha Google Sheets</span>
                      <span className="text-[10px] text-slate-500 mt-2 leading-relaxed">Integração CORS com sincronia automática bidirecional.</span>
                    </button>
                  </div>
                </div>

                {tempUseSheets && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-250 space-y-2.5">
                    <label htmlFor="script-url-input" className="block text-[10px] font-bold text-[#1872b8] uppercase tracking-widest">
                      URL da Implantação Executável (Web App Google GAS)
                    </label>
                    <input
                      id="script-url-input"
                      type="text"
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-mono text-[#002C54] placeholder-slate-400 focus:border-[#1872b8] focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Sempre verifique se a implantação do Apps Script está como <strong>Qualquer pessoa (Anyone)</strong>.
                    </p>
                  </div>
                )}

                {/* Sound testing section inside Modal */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                  <p className="text-xs font-bold text-[#002C54] flex items-center gap-1.5 uppercase tracking-wider">
                    <Volume2 className="h-4 w-4 text-[#1872b8]" />
                    Sinais Acústicos do Terminal
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={playHospitalBell} 
                      className="text-[10px] uppercase font-bold bg-white border border-slate-200 hover:bg-slate-100 py-2 px-1.5 rounded-xl text-slate-700 cursor-pointer"
                    >
                      🛎️ Standard
                    </button>
                    <button 
                      onClick={playEmergencySiren} 
                      className="text-[10px] uppercase font-bold bg-rose-50 border border-rose-200 hover:bg-rose-100 py-2 px-1.5 rounded-xl text-rose-700 cursor-pointer"
                    >
                      🚨 Alerta Emerg
                    </button>
                    <button 
                      onClick={playSuccessChime} 
                      className="text-[10px] uppercase font-bold bg-[#e3f2fd] border border-[#bbdefb] hover:bg-[#b3e5fc] py-2 px-1.5 rounded-xl text-[#1872b8] cursor-pointer"
                    >
                      ✅ Conclusão
                    </button>
                  </div>
                </div>

                {/* Reset local memory (only if Local API active) */}
                {!tempUseSheets && (
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        resetLocalDemo();
                        setShowSettings(false);
                      }}
                      className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold py-2 rounded-xl text-[10px] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      <RotateCcw className="h-4 w-4 text-[#1872b8]" />
                      Apagar Dados e Resetar Simulador Local
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-800 font-bold text-xs hover:bg-slate-50 cursor-pointer uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    saveIntegrationConfig(tempUseSheets, tempUrl);
                    setShowSettings(false);
                  }}
                  className="px-5 py-2 bg-[#1872b8] text-white rounded-xl font-bold text-xs hover:bg-[#1565c0] cursor-pointer uppercase tracking-wider"
                >
                  Aplicar Sincronia
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation Sub-Bar styled in premium light white */}
      <div className="bg-white border-b border-slate-200/80 py-2.5 px-4 sm:px-6 flex items-center justify-between overflow-x-auto gap-4 shrink-0 relative z-10">
        <div className="flex items-center gap-1.5 shrink-0 scrollbar-none">
          <button
            id="tab-btn-fila"
            onClick={() => setActiveTab('fila')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 cursor-pointer ${
              activeTab === 'fila' 
                ? 'bg-[#e3f2fd]/70 text-[#1872b8] border border-[#1872b8]/20 shadow-sm' 
                : 'text-slate-500 hover:bg-[#e3f2fd]/20 hover:text-[#1872b8]'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Fila de Chamados 
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] border border-slate-200 text-[#1872b8] font-mono font-bold leading-normal">
              {filteredChamados.length}
            </span>
          </button>

          <button
            id="tab-btn-mural"
            onClick={() => setActiveTab('mural')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 cursor-pointer ${
              activeTab === 'mural' 
                ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm font-extrabold' 
                : 'text-slate-500 hover:bg-teal-50/30 hover:text-teal-600'
            }`}
          >
            <Monitor className="h-4 w-4 text-teal-500" />
            Mural Monitor (TV)
          </button>

          <button
            id="tab-btn-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-[#e3f2fd]/70 text-[#1872b8] border border-[#1872b8]/20 shadow-sm' 
                : 'text-slate-500 hover:bg-[#e3f2fd]/20 hover:text-[#1872b8]'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Painel Analítico
            {user.tipo === "Admin" && (
              <span className="text-[10px]" title="Acesso Supervisor">👑</span>
            )}
          </button>

          <button
            id="tab-btn-logs"
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 cursor-pointer ${
              activeTab === 'logs' 
                ? 'bg-[#e3f2fd]/70 text-[#1872b8] border border-[#1872b8]/20 shadow-sm' 
                : 'text-slate-500 hover:bg-[#e3f2fd]/20 hover:text-[#1872b8]'
            }`}
          >
            <FileText className="h-4 w-4" />
            Auditoria & logs
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] border border-slate-200 text-slate-500 font-mono leading-normal">
              {logs.length}
            </span>
          </button>

          <button
            id="tab-btn-gas"
            onClick={() => setActiveTab('gas')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 cursor-pointer ${
              activeTab === 'gas' 
                ? 'bg-[#e3f2fd]/70 text-[#1872b8] border border-[#1872b8]/20 shadow-sm' 
                : 'text-slate-500 hover:bg-[#e3f2fd]/20 hover:text-[#1872b8]'
            }`}
          >
            <Database className="h-4 w-4 text-[#1872b8]" />
            Conectar Planilha
          </button>

          {user.tipo === "Admin" && (
            <button
              id="tab-btn-usuarios"
              onClick={() => setActiveTab('usuarios')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 cursor-pointer ${
                activeTab === 'usuarios' 
                  ? 'bg-[#e3f2fd]/70 text-[#1872b8] border border-[#1872b8]/20 shadow-sm' 
                  : 'text-slate-500 hover:bg-[#e3f2fd]/20 hover:text-[#1872b8]'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Administrador
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] border border-slate-200 text-slate-500 font-mono leading-normal">
                {allUsers.length}
              </span>
            </button>
          )}
        </div>

        {/* Sync panel on the right */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10.5px] font-mono text-slate-400 hidden lg:inline-flex items-center gap-1.5 font-bold">
            <span className="h-1.5 w-1.5 duration-1000 animate-ping rounded-full bg-[#1872b8]"></span>
            SINC AUTOMÁTICA (5S)
          </span>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => recarregar()}
            className="px-3.5 py-1.5 text-xs bg-[#e3f2fd] hover:bg-[#bbdefb] border border-[#bbdefb] rounded-lg text-[#1872b8] transition flex items-center gap-1.5 font-bold cursor-pointer"
            title="Sincronizar manual agora"
          >
            {loading ? (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full border border-[#1872b8] border-t-transparent animate-spin"></span>
                Sincronizando...
              </span>
            ) : (
              "Recarregar 🔄"
            )}
          </motion.button>
        </div>
      </div>

      {/* --- Main High-Density Grid --- */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden relative">
        
        {/* --- LEFT SIDE: NOVA SOLICITAÇÃO & TEAM INDICATORS --- */}
        <aside className="col-span-12 lg:col-span-3 bg-white border-r border-slate-200/80 p-5 flex flex-col gap-5 overflow-y-auto shrink-0 scrollbar-thin text-slate-800">
          <div className="space-y-3">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Painel de Indicadores</span>
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
            </h2>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#f0f4f8] p-3 rounded-2xl border border-slate-200/60 shadow-inner">
                <span className="text-[22px] font-mono font-black text-[#002C54] block leading-none">
                  {stats ? stats.totalCount : "---"}
                </span>
                <span className="text-[9.5px] text-slate-500 uppercase font-extrabold tracking-wider mt-1.5 block">Total</span>
              </div>

              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
                <span className="text-[22px] font-mono font-black text-amber-750 block leading-none">
                  {stats ? stats.aguardandoCount : "---"}
                </span>
                <span className="text-[9.5px] text-amber-600 uppercase font-extrabold tracking-wider mt-1.5 block">Aguardando</span>
              </div>

              <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-150 col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[20px] font-mono font-black text-emerald-850 block leading-none">
                    {stats ? `${stats.tempoMedioAtendimento}m` : "---"}
                  </span>
                  <span className="text-[9px] text-[#15803d] uppercase font-extrabold tracking-wider mt-1.5 block">Tempo Médio Atendim.</span>
                </div>
                <div className="text-right">
                  <span className="text-2xs font-mono font-bold text-slate-500 block">
                    {stats ? stats.finalizadosCount : 0} SUPLEMENTADOS
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Create Request Block */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[10px] font-black text-[#002C54] uppercase tracking-widest flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4 text-[#1872b8]" />
                Nova Demanda de Maca
              </h2>
              {user.tipo !== "Enfermagem" && (
                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                  Simulador ({user.tipo})
                </span>
              )}
            </div>

            <form onSubmit={handleCreateRequestSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label htmlFor="paciente-name" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Nome Completo Paciente
                </label>
                <input
                  id="paciente-name"
                  type="text"
                  required
                  placeholder="Nome do Paciente"
                  value={paciente}
                  onChange={(e) => setPaciente(e.target.value)}
                  className="block h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#002C54] font-bold placeholder-slate-450 focus:border-[#1872b8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1872b8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label htmlFor="origem-select" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Origem Setor
                  </label>
                  <select
                    id="origem-select"
                    value={origem}
                    onChange={(e) => setOrigem(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 font-bold focus:border-[#1872b8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1872b8] select-none cursor-pointer"
                  >
                    {activeOrigins.map((s, idx) => (
                      <option key={`origem-${idx}`} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="destino-select" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Destino
                  </label>
                  <select
                    id="destino-select"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 font-bold focus:border-[#1872b8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1872b8] select-none cursor-pointer"
                  >
                    {activeDestinations.map((s, idx) => (
                      <option key={`destino-${idx}`} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Nível de Prioridade
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['Baixa', 'Media', 'Alta', 'Emergencia'] as PrioridadeChamado[]).map((p) => {
                    let btnColor = "border-slate-200 text-slate-500 hover:bg-[#e3f2fd]/20 bg-slate-50";
                    if (prioridade === p) {
                      if (p === 'Emergencia') btnColor = "bg-rose-550 text-white border-rose-550 font-extrabold ring-4 ring-rose-500/15";
                      else if (p === 'Alta') btnColor = "bg-amber-500 text-white border-amber-500 font-bold";
                      else if (p === 'Media') btnColor = "bg-[#1872b8] text-white border-[#1872b8] font-bold";
                      else btnColor = "bg-slate-500 text-white border-slate-500";
                    } else {
                      if (p === 'Emergencia') btnColor = "hover:border-rose-300 hover:bg-rose-50 text-rose-700 border-slate-200";
                      else if (p === 'Alta') btnColor = "hover:border-amber-300 hover:bg-amber-50 text-amber-700 border-slate-200";
                    }
                    return (
                      <button
                        id={`btn-prio-${p}`}
                        key={p}
                        type="button"
                        onClick={() => setPrioridade(p)}
                        className={`py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border text-center transition-all cursor-pointer ${btnColor}`}
                      >
                        {p === "Media" ? "Média" : p === "Emergencia" ? "Emerg." : p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="observacao" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Restrições / Observação Médica
                </label>
                <textarea
                  id="observacao"
                  rows={2}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="EX: Paciente em isolamento Máscara N95, dreno, grades elevadas..."
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 placeholder-slate-400 focus:border-[#1872b8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1872b8] font-sans"
                />
              </div>

              <motion.button
                id="submit-chamado-btn"
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#1872b8] hover:bg-[#1565c0] text-white font-black py-2.5 px-4 rounded-xl shadow-md shadow-[#1872b8]/10 flex items-center justify-center gap-1.5 transition duration-200 text-xs uppercase tracking-wider cursor-pointer font-sans"
              >
                <PlusCircle className="h-4.5 w-4.5 text-white" />
                ABRIR CHAMADO
              </motion.button>
            </form>
          </div>

          {/* Realtime Ward Team status */}
          <div className="border-t border-slate-150 pt-5 mt-auto">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
              <span>Equipe Ativa</span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                ● {usuariosOnlineCount}
              </span>
            </h2>
            <div className="space-y-2 max-h-40 overflow-y-auto shrink-0 scrollbar-none">
              <div className="flex items-center justify-between text-xs bg-[#f0f4f8] p-2 rounded-xl border border-slate-200/50 shadow-sm">
                <span className="font-bold text-[#002C54] flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {user.nome}
                </span>
                <span className="px-2 py-0.5 bg-[#e3f2fd] text-[#1872b8] rounded text-[9px] font-bold uppercase border border-[#bbdefb]">
                  Você
                </span>
              </div>
              
              {usuariosOnline
                .filter(u => u !== user.nome)
                .map((u, i) => (
                  <div key={`usr-online-${i}`} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-150">
                    <span className="font-semibold text-slate-650 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                      {u}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">Ativo</span>
                  </div>
                ))}
            </div>
          </div>
        </aside>

        {/* --- MAIN INTERACTIVE DISPLAY (Tabs Rendered dynamically) --- */}
        <main className="col-span-12 lg:col-span-9 bg-[#f8fbfe] flex flex-col overflow-y-auto scrollbar-thin text-slate-800">

          {/* TAB: REAL-TIME PRIORITY MURAL FOR TV / TERMINALS */}
          {activeTab === 'mural' && (
            <div className="flex flex-col flex-1 min-h-[calc(100vh-4rem)]">
              <MuralPanel 
                chamados={chamados} 
                onClose={() => setActiveTab('fila')} 
                isLoggedIn={true}
                onRefresh={() => recarregar()}
                loading={loading}
              />
            </div>
          )}

          {/* TAB 1: REAL-TIME COLLABORATIVE TIMELINE QUEUE */}
          {activeTab === 'fila' && (
            <div className="flex flex-col flex-1">
              
              {/* Dynamic Action Filter Bar */}
              <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-10 shrink-0 select-none shadow-[0_1px_4px_rgba(0,0,0,0.015)]">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl px-2.5 py-1 text-xs text-slate-500 border border-slate-200">
                    <Filter className="h-3 w-3 text-[#1872b8]" />
                    <span className="font-bold uppercase text-[9px]">Status:</span>
                    <select
                      id="filter-status"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="text-xs text-slate-800 bg-transparent outline-none cursor-pointer font-bold font-sans ml-1 select-none"
                    >
                      <option value="Todas">Todos</option>
                      <option value="Aguardando">Aguardando</option>
                      <option value="Aceito">Aceito</option>
                      <option value="Em_Transporte">Em Curso</option>
                      <option value="Finalizado">Concluido</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl px-2.5 py-1 text-xs text-slate-500 border border-slate-200">
                    <span className="font-bold uppercase text-[9px] tracking-wide">Prio:</span>
                    <select
                      id="filter-prio"
                      value={filterPrioridade}
                      onChange={(e) => setFilterPrioridade(e.target.value)}
                      className="text-xs text-slate-800 bg-transparent outline-none cursor-pointer font-bold font-sans ml-1 select-none"
                    >
                      <option value="Todas">Todas Prios</option>
                      <option value="Emergencia">🚨 Emergência</option>
                      <option value="Alta">⚠️ Alta</option>
                      <option value="Media">Média</option>
                      <option value="Baixa">Baixa</option>
                    </select>
                  </div>
                </div>

                {/* Filter query search bar */}
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filtrar paciente, maqueiro, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-8 h-9 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-405 focus:border-[#1872b8] focus:outline-none font-sans"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-800 cursor-pointer text-sm font-bold bg-transparent"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Error alerts */}
              {error && (
                <div className="mx-6 my-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold">Aviso sobre conexão:</p>
                    <p className="mt-0.5 text-slate-600">{error}</p>
                    <button 
                      onClick={() => setShowSettings(true)}
                      className="mt-1.5 text-[#1872b8] underline font-black block hover:text-[#1565c0] uppercase tracking-widest text-2xs"
                    >
                      Ajustar configurações de rede agora
                    </button>
                  </div>
                </div>
              )}

              {/* Redesigned Grid of Chamados */}
              <div className="p-4 sm:p-6 flex-1">
                <div className="space-y-3">
                  {filteredChamados.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl p-10 bg-white shadow-sm max-w-lg mx-auto">
                      <ClipboardList className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                      <p className="font-bold text-[#002C54] text-sm">Nenhum Atendimento Recente</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Essa categoria está limpa. Não há solicitações no filtro selecionado no momento.</p>
                      <button 
                        onClick={() => {
                          setPaciente("Paciente Teste"); 
                          setPrioridade("Emergencia");
                        }}
                        className="text-[#1872b8] hover:text-[#1565c0] duration-200 font-black text-xs uppercase tracking-wider block mx-auto mt-4 border border-slate-150 px-3 py-1.5 rounded-xl bg-slate-50 cursor-pointer shadow-sm"
                      >
                        Simular Chamado de Emergência ⚡
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3.5">
                      <AnimatePresence mode="popLayout">
                        {filteredChamados.map((c) => {
                          const styling = getPriorityClasses(c.prioridade);
                          const isEmergency = c.prioridade === "Emergencia";
                          return (
                            <motion.div 
                              key={c.id}
                              layout
                              initial={{ opacity: 0, scale: 0.98, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.98, y: -10 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className={`relative p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#1872b8]/40 transition-all shadow-[0_4px_16px_rgba(0,47,92,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden ${styling.border} ${isEmergency ? 'shadow-[inset_0_0_20px_rgba(239,68,68,0.01)]' : ''}`}
                            >
                              
                              {/* Left section: Priority, Patient details and requesting info */}
                              <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono ${styling.badge}`}>
                                    {c.prioridade === "Emergencia" ? "🚨 Emergência" : c.prioridade === "Media" ? "Média" : c.prioridade}
                                  </span>
                                  <span className="text-[10px] font-mono text-[#1872b8]/70 tracking-wider font-bold">
                                    {c.id}
                                  </span>
                                </div>

                                <div className="space-y-0.5">
                                  <h3 className="text-xs sm:text-sm font-black text-[#002C54] uppercase tracking-wider truncate">
                                    {c.paciente}
                                  </h3>
                                  <div className="flex items-center gap-2 text-2xs text-slate-500 font-mono tracking-widest uppercase mt-1">
                                    <span>Solicitante: <strong className="text-slate-705 font-bold">{c.solicitante}</strong></span>
                                  </div>
                                </div>
                              </div>

                              {/* Center-Left section: Travel Route capsules */}
                              <div className="md:w-[28%] shrink-0 space-y-1">
                                <div className="flex items-center gap-1.5 text-[11px] font-sans font-extrabold uppercase tracking-wide leading-none">
                                  <span className="bg-slate-50 text-slate-700 border border-slate-150 rounded px-2 py-1 truncate max-w-[130px]" title={c.origem}>
                                    {c.origem}
                                  </span>
                                  <ArrowRight className="h-3.5 w-3.5 text-[#1872b8] shrink-0" />
                                  <span className="bg-[#e3f2fd]/85 text-[#1872b8] border border-[#1872b8]/20 rounded px-2 py-1 truncate max-w-[130px]" title={c.destino}>
                                    {c.destino}
                                  </span>
                                </div>

                                {c.observacao && (
                                  <p className="text-[10px] text-slate-600 italic font-mono truncate max-w-xs mt-1 bg-amber-50/40 p-1 px-2 rounded border border-amber-250/20" title={c.observacao}>
                                    "{c.observacao}"
                                  </p>
                                )}
                              </div>

                              {/* Center section: Structured progress indicator */}
                              <div className="md:w-[20%] shrink-0 flex items-center">
                                {getProgressTracker(c.status)}
                              </div>

                              {/* Dynamic elapsed time capsule */}
                              <div className="flex items-center gap-1 shrink-0 md:w-[80px] font-mono text-[10px] text-slate-500">
                                <Clock className="h-3 w-3 text-[#1872b8]" />
                                <span>{getElapsedTimeText(c.criadoEm)}</span>
                              </div>

                              {/* Right section: Action Control Deck */}
                              <div className="shrink-0 flex items-center justify-end md:w-[150px]">
                                
                                {/* Maqueiro Work Flow controls */}
                                {user.tipo === "Maqueiro" && (
                                  <div className="w-full">
                                    {c.status === "Aguardando" && (
                                      <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => atualizarStatus(c.id, "Aceito")}
                                        className="w-full bg-[#1872b8] hover:bg-[#1565c0] text-white font-extrabold text-[10px] tracking-widest uppercase px-3 py-2 rounded-xl transition shadow-md duration-200 cursor-pointer text-center"
                                      >
                                        Aceitar Maca
                                      </motion.button>
                                    )}

                                    {c.status === "Aceito" && c.maqueiro?.includes(user.nome) && (
                                      <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => atualizarStatus(c.id, "Em_Transporte")}
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] tracking-widest uppercase px-3 py-2 rounded-xl transition duration-200 cursor-pointer text-center"
                                      >
                                        Iniciar Rota
                                      </motion.button>
                                    )}

                                    {c.status === "Em_Transporte" && c.maqueiro?.includes(user.nome) && (
                                      <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => atualizarStatus(c.id, "Finalizado")}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] tracking-widest uppercase px-3 py-2 rounded-xl transition duration-200 cursor-pointer text-center animate-pulse"
                                      >
                                        Finalizar Corrida
                                      </motion.button>
                                    )}

                                    {c.maqueiro && !c.maqueiro.includes(user.nome) && (
                                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block text-center py-1 bg-slate-50 rounded-lg border border-slate-200">
                                        Por: {c.maqueiro.substring(0, 15)}...
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Enfermagem specific controls */}
                                {user.tipo === "Enfermagem" && (
                                  <div className="w-full flex justify-end">
                                    {c.status === "Aguardando" ? (
                                      <motion.button
                                        whileHover={{ scale: 1.02, backgroundColor: "rgba(239, 68, 68, 0.05)" }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => atualizarStatus(c.id, "Cancelado")}
                                        className="text-[10px] tracking-widest font-extrabold uppercase border border-rose-200 text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition cursor-pointer"
                                      >
                                        Cancelar
                                      </motion.button>
                                    ) : (
                                      <span className="text-[10px] text-slate-550 font-semibold uppercase tracking-wider bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 truncate max-w-[130px] block" title={c.maqueiro || "Atendido"}>
                                        {c.status === "Finalizado" ? "✓ Encerrado" : `Em Rota (${c.maqueiro || "Maqueiro"})`}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Admin Supervisor Dashboard controls overrides */}
                                {user.tipo === "Admin" && (
                                  <div className="flex flex-col gap-1 w-full bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => atualizarStatus(c.id, "Aceito")}
                                        className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-[9px] font-black py-1 rounded text-[#1872b8] duration-150 uppercase"
                                      >
                                        Aceitar
                                      </button>
                                      <button
                                        onClick={() => atualizarStatus(c.id, "Em_Transporte")}
                                        className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-[9px] font-black py-1 rounded text-[#1872b8] duration-150 uppercase"
                                      >
                                        Curso
                                      </button>
                                      <button
                                        onClick={() => atualizarStatus(c.id, "Finalizado")}
                                        className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-[9px] font-black py-1 rounded text-emerald-700 duration-150 uppercase"
                                      >
                                        Fim
                                      </button>
                                    </div>
                                    {c.maqueiro && (
                                      <div className="text-[9px] text-slate-500 text-center font-mono uppercase bg-slate-100/50 border-t border-slate-200 py-0.5 mt-1 block font-bold">
                                        Atrib: {c.maqueiro}
                                      </div>
                                    )}
                                  </div>
                                )}

                              </div>

                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: INTERACTIVE ANALYTICAL BENTO BOARD */}
          {activeTab === 'dashboard' && (
            <div className="p-4 sm:p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-base font-extrabold text-[#002C54] uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#1872b8]" />
                    Bento de Performance Operacional
                  </h2>
                  <p className="text-xs text-slate-550 mt-1">Status global condensado do plantão médico, auditoria interna e tempos de atendimento.</p>
                </div>

                <div className="bg-slate-100 p-2 rounded-xl text-xs flex gap-2 font-mono items-center border border-slate-200">
                  <span className="text-slate-500 uppercase text-[9.5px]">Sincronia:</span>
                  <strong className={isGoogleSheets ? 'text-emerald-700' : 'text-[#1872b8]'}>
                    {isGoogleSheets ? "API GOOGLE" : "NUVEM INTEGRADA"}
                  </strong>
                </div>
              </div>

              {/* Bento cards stack */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-left shadow-[0_2px_8px_rgba(0,47,92,0.015)]">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Atendimentos Médios</span>
                  <p className="text-2xl sm:text-3xl font-mono font-black text-[#002C54] mt-2 leading-none">
                    {stats ? `${stats.tempoMedioAtendimento}m` : "---"}
                  </p>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mt-2.5">Meta aceitável: &lt; 15 min</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-left shadow-[0_2px_8px_rgba(0,47,92,0.015)]">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Concluídos com Sucesso</span>
                  <p className="text-2xl sm:text-3xl font-mono font-black text-emerald-700 mt-2 leading-none">
                    {stats ? stats.finalizadosCount : "---"}
                  </p>
                  <span className="text-[9px] text-emerald-600 font-bold block uppercase tracking-wider mt-2.5">Descarga concluída</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-left shadow-[0_2px_8px_rgba(0,47,92,0.015)]">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Pacientes Aguardando</span>
                  <p className="text-2xl sm:text-3xl font-mono font-black text-amber-700 mt-2 leading-none">
                    {stats ? stats.aguardandoCount : "---"}
                  </p>
                  <span className="text-[9px] text-amber-600 font-bold block uppercase tracking-wider mt-2.5">Risco de congestionamento</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-left shadow-[0_2px_8px_rgba(0,47,92,0.015)]">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Histórico de Corridas</span>
                  <p className="text-2xl sm:text-3xl font-mono font-black text-[#1872b8] mt-2 leading-none">
                    {stats ? stats.totalCount : "---"}
                  </p>
                  <span className="text-[9px] text-[#1a5f96] font-bold block uppercase tracking-wider mt-2.5">Log global carregado</span>
                </div>

              </div>

              {/* Proportional graphs panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Priority Split stats */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-4 shadow-sm shadow-[#002c54]/5">
                  <h3 className="text-xs font-black text-[#002C54] uppercase tracking-widest flex items-center justify-between">
                    <span>Volumetria por Prioridade</span>
                    <Zap className="h-4 w-4 text-[#1872b8]" />
                  </h3>

                  <div className="space-y-4">
                    {stats ? (
                      Object.entries(stats.porPrioridade).map(([prio, val]) => {
                        const values = Object.values(stats.porPrioridade) as number[];
                        const maxVal = Math.max(...values, 1);
                        const pct = ((val as number) / maxVal) * 100;
                        return (
                          <div key={prio} className="space-y-1.5 flex flex-col font-sans">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-extrabold text-[#002C54] uppercase tracking-wider text-[10.5px]">
                                {prio === 'Media' ? 'Média' : prio === 'Emergencia' ? '🚨 Emergência' : prio}
                              </span>
                              <span className="font-mono bg-slate-50 px-2 py-0.5 rounded text-[10.5px] border border-slate-200 font-bold">{val} chamados</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-700 ${
                                  prio === 'Emergencia' ? 'bg-rose-500' :
                                  prio === 'Alta' ? 'bg-amber-500' :
                                  prio === 'Media' ? 'bg-[#1872b8]' :
                                  'bg-slate-400'
                                }`} 
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-450 p-4 text-center">Nenhum histórico a computar.</p>
                    )}
                  </div>
                </div>

                {/* Performance Rank */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-4 shadow-sm shadow-[#002c54]/5">
                  <h3 className="text-xs font-black text-[#002C54] uppercase tracking-widest flex items-center justify-between">
                    <span>Ranking dos Maqueiros de Plantão</span>
                    <Users className="h-4 w-4 text-[#1872b8]" />
                  </h3>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto scrollbar-none">
                    {stats && Object.keys(stats.corridasMaqueiro).length > 0 ? (
                      (Object.entries(stats.corridasMaqueiro) as [string, number][])
                        .sort((a, b) => b[1] - a[1])
                        .map(([maqueiro, count], idx) => (
                          <div key={maqueiro} className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-150">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[#1872b8] font-bold text-[11px]">0{idx + 1}.</span>
                              <span className="font-bold text-[#002C54] uppercase text-[11px] font-sans">{maqueiro}</span>
                            </div>
                            <span className="font-mono bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg px-2.5 py-1 text-[10px] font-bold">
                              {count} concluídos
                            </span>
                          </div>
                        ))
                    ) : (
                      <div className="text-center p-8 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-xs text-slate-450">Nenhuma corrida concluída no momento.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Flow Hotspots */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 col-span-1 md:col-span-2 space-y-3  shadow-sm shadow-[#002c54]/5">
                  <span className="text-xs font-black text-[#002C54] uppercase tracking-widest block font-sans">Setores Críticos de Solicitação de Transportes (Hotspots)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    {stats && Object.keys(stats.porOrigem).length > 0 ? (
                      Object.entries(stats.porOrigem)
                        .slice(0, 8)
                        .map(([sector, count]) => (
                          <div key={sector} className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-center flex flex-col justify-between">
                            <span className="text-[10px] text-slate-550 uppercase font-black truncate leading-none block" title={sector}>{sector}</span>
                            <span className="text-lg font-mono font-black text-[#1872b8] mt-3 leading-none">{count} chamados</span>
                          </div>
                        ))
                    ) : (
                      <p className="text-xs text-slate-450 text-center col-span-4 p-4">Sem fluxogramas calculados.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: COMMAND LINE EVENT STREAM AUDITING AND FEED LOGGING */}
          {activeTab === 'logs' && (
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h2 className="text-sm font-black text-[#002C54] uppercase tracking-wider flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Central de Logística e Transparência de Dados
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Auditoria de rastreio de ações em tempo real no contêiner.</p>
                </div>
                {logs.length > 0 && (
                  <span className="text-[10px] font-mono bg-slate-50 border border-slate-250 px-3 py-1 rounded-xl text-slate-600 font-black uppercase tracking-wider">
                    Total: {logs.length} Eventos
                  </span>
                )}
              </div>

              {/* Terminal code display layout */}
              <div className="bg-[#1a202c] text-slate-200 rounded-2xl p-4 font-mono text-2xs leading-relaxed max-h-[480px] overflow-y-auto space-y-2 border border-slate-800 shadow-inner">
                {logs.length === 0 ? (
                  <p className="text-slate-400 text-center py-10 uppercase tracking-widest text-[10px]">Sem registros gravados.</p>
                ) : (
                  logs.map((l) => (
                    <div key={l.id} className="border-b border-slate-800/60 pb-1.5 flex items-start flex-wrap gap-2 text-[10.5px]">
                      <span className="text-slate-500 font-semibold">
                        [{new Date(l.data).toLocaleTimeString()}]
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-black tracking-widest ${
                        l.tipo === 'ALERTA' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                        l.tipo === 'AÇÃO' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {l.tipo}
                      </span>
                      <span className="text-slate-305 flex-1 min-w-[200px]">{l.descricao}</span>
                      <span className="text-slate-400 text-[10px] italic">operador: {l.usuario}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: STEP-BY-STEP INTEGRATION MANUAL */}
          {activeTab === 'gas' && (
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h2 className="text-base font-extrabold text-[#002C54] uppercase tracking-wider">Conectar com Planilha Corporativa</h2>
                  <p className="text-xs text-slate-500 mt-1">Conecte o SmartMaqueiro diretamente com o Google Drive para persistência de dados.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 text-left text-xs leading-relaxed space-y-4 shadow-sm shadow-[#002c54]/5">
                <h3 className="font-extrabold text-[#002C54] flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="h-5 w-5 text-[#1872b8]" />
                  Passo-a-passo Configuração do Apps Script
                </h3>
                
                <ol className="list-decimal pl-5 space-y-3.5 text-slate-650 font-semibold">
                  <li>
                    Acesse seu <strong>Drive</strong> e crie uma nova planilha vazia no <strong>Google Sheets</strong> chamada <code className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-205 text-[#1872b8] font-mono text-2xs">SmartMaqueiro_BD</code>.
                  </li>
                  <li>
                    Renomeie as abas para conter 4 abas vazias com os nomes exatos: <code className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-205 text-[#1872b8] font-mono text-2xs">chamados</code>, <code className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-205 text-[#1872b8] font-mono text-2xs">usuarios</code>, <code className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-205 text-[#1872b8] font-mono text-2xs">locais</code>, e <code className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-205 text-[#1872b8] font-mono text-2xs">logs</code>.
                  </li>
                  <li>
                    Defina os cabeçalhos das colunas (exatamente na 1ª linha de cada aba):
                    <div className="space-y-2 mt-2 font-mono text-[11px] text-slate-600">
                      <div>
                        <strong className="text-[#002C54]">aba `chamados`:</strong>
                        <code className="bg-slate-50 p-1.5 rounded border border-slate-200 block mt-1 select-all overflow-x-auto">id | paciente | origem | destino | prioridade | observacao | status | solicitante | maqueiro | criadoEm | aceitoEm | iniciadoEm | finalizadoEm</code>
                      </div>
                      <div>
                        <strong className="text-[#002C54]">aba `usuarios`:</strong>
                        <code className="bg-slate-50 p-1.5 rounded border border-slate-200 block mt-1 select-all overflow-x-auto">id | usuario | nome | tipo</code>
                      </div>
                      <div>
                        <strong className="text-[#002C54]">aba `locais`:</strong>
                        <code className="bg-slate-50 p-1.5 rounded border border-slate-200 block mt-1 select-all overflow-x-auto">id | nome | tipo</code>
                      </div>
                    </div>
                  </li>
                  <li>
                    Abra o menu <strong className="text-[#002C54]">Extensões</strong> &gt; <strong className="text-[#002C54]">Apps Script</strong> na barra do Sheets.
                  </li>
                  <li>
                    Substitua todo o conteúdo pelo script completo copiado através do botão abaixo.
                  </li>
                  <li>
                    Clique em salvar (ícone de disquete) e no botão azul <strong className="text-[#002C54]">Implantar &gt; Nova implantação</strong>.
                  </li>
                  <li>
                    Na engrenagem selecione <strong className="text-[#002C54]">App da Web</strong>, configure "Executar como" para <strong className="text-[#1872b8]">Você</strong> e "Quem tem acesso" para <strong className="text-[#1872b8]">Qualquer pessoa (Anyone)</strong>.
                  </li>
                  <li>
                    Cole a URL do Apps Script que copiou (terminando com <code className="text-[#1872b8]">/exec</code>) nas preferências do SmartMaqueiro (clique no avatar com suas iniciais no topo do painel).
                  </li>
                </ol>
              </div>

              {/* Code display with copy mechanism */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xs font-extrabold text-slate-550 uppercase tracking-widest">Código do Apps Script</h3>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 text-2xs bg-white border border-slate-200 text-slate-705 shadow-sm font-black uppercase tracking-wider py-2 px-4 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-slate-400" />
                        Copiar Código
                      </>
                    )}
                  </motion.button>
                </div>
                
                <pre className="p-4 bg-[#1a202c] text-slate-350 border border-slate-800 rounded-2xl font-mono text-[10.5px] overflow-x-auto max-h-[350px] scrollbar-thin leading-snug">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>

            </div>
          )}

          {/* TAB 5: CREATE AND MANAGE USERS */}
          {activeTab === 'usuarios' && user.tipo === "Admin" && (
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h2 className="text-base font-extrabold text-[#002C54] uppercase tracking-wider">Controle Geral de Usuários</h2>
                  <p className="text-xs text-slate-500 mt-1">Cadastre e monitore as credenciais profissionais autorizadas para o plantão clínico.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form column (1/3 weight) */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left">
                    <h3 className="text-sm font-bold text-[#002C54] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <UserPlus className="h-4.5 w-4.5 text-[#1872b8]" />
                      Novo Cadastro Profissional
                    </h3>

                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newUsername.trim()) {
                        alert("Por favor, digite o nome de usuário.");
                        return;
                      }
                      if (!newDisplayName.trim()) {
                        alert("Por favor, digite o nome completo.");
                        return;
                      }
                      const res = await criarUsuario(newUsername.trim(), newUserType, newDisplayName.trim());
                      if (res) {
                        setNewUsername("");
                        setNewDisplayName("");
                        setNewUserType("Enfermagem");
                      }
                    }} className="space-y-4 text-xs font-semibold">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                          Nome de Usuário (Login)
                        </label>
                        <input
                          type="text"
                          required
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value.replace(/\s+/g, "").toLowerCase())}
                          placeholder="Ex: marcosoliveira, Enf_martha"
                          className="block h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#002C54] placeholder-slate-400 focus:border-[#1872b8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1872b8] transition-all font-mono"
                        />
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">Usado para identificação no painel de simulação.</p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                          Nome Completo ou Crachá
                        </label>
                        <input
                          type="text"
                          required
                          value={newDisplayName}
                          onChange={(e) => setNewDisplayName(e.target.value)}
                          placeholder="Ex: Enf. Marcos Oliveira, Maqueiro Tiago"
                          className="block h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#002C54] placeholder-slate-400 focus:border-[#1872b8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1872b8] transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                          Função Corporativa
                        </label>
                        <div className="grid grid-cols-1 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setNewUserType("Enfermagem")}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left cursor-pointer ${
                              newUserType === "Enfermagem"
                                ? "border-[#1872b8] bg-[#e3f2fd]/30 text-[#1872b8] font-bold"
                                : "border-slate-100 text-slate-500 bg-slate-50/50 hover:border-slate-200"
                            }`}
                          >
                            <Heart className="h-4 w-4 text-[#1872b8]" />
                            <div>
                              <p className="text-[10px] uppercase font-bold tracking-wide">Enfermagem</p>
                              <p className="text-[8px] text-slate-400 mt-0.5 font-normal">Autoriza criar e finalizar chamados na ala</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNewUserType("Maqueiro")}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left cursor-pointer ${
                              newUserType === "Maqueiro"
                                ? "border-[#1872b8] bg-[#e3f2fd]/30 text-[#1872b8] font-bold"
                                : "border-slate-100 text-slate-500 bg-slate-50/50 hover:border-slate-200"
                            }`}
                          >
                            <Truck className="h-4 w-4 text-[#1872b8]" />
                            <div>
                              <p className="text-[10px] uppercase font-bold tracking-wide">Maqueiro</p>
                              <p className="text-[8px] text-slate-400 mt-0.5 font-normal">Executa os transportes em tempo real</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNewUserType("Admin")}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left cursor-pointer ${
                              newUserType === "Admin"
                                ? "border-[#1872b8] bg-[#e3f2fd]/30 text-[#1872b8] font-bold"
                                : "border-slate-100 text-slate-500 bg-slate-50/50 hover:border-slate-200"
                            }`}
                          >
                            <ShieldAlert className="h-4 w-4 text-[#1872b8]" />
                            <div>
                              <p className="text-[10px] uppercase font-bold tracking-wide">Diretoria (Admin)</p>
                              <p className="text-[8px] text-slate-400 mt-0.5 font-normal">Supervisão estatística e gerencial</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="flex w-full items-center justify-center rounded-xl bg-[#1872b8] hover:bg-[#1565c0] text-white font-bold py-2.5 px-4 text-[10.5px] uppercase tracking-wider shadow-sm transition cursor-pointer"
                      >
                        <UserPlus className="h-4 w-4 mr-1.5" />
                        Cadastrar Profissional
                      </button>
                    </form>
                  </div>
                </div>

                {/* Users List column (2/3 weight) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
                      <h3 className="text-sm font-bold text-[#002C54] uppercase tracking-wider flex items-center gap-2">
                        <Users className="h-4.5 w-4.5 text-[#1872b8]" />
                        Quadro Clínico Autorizado
                      </h3>
                      <span className="text-[9px] font-extrabold px-2.5 py-1 bg-slate-150 text-slate-600 rounded-lg uppercase tracking-wider">
                        {allUsers.length} Cadastros Ativos
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-wider">
                            <th className="pb-2.5">Código ID</th>
                            <th className="pb-2.5">Usuário (Login)</th>
                            <th className="pb-2.5">Nome de Crachá</th>
                            <th className="pb-2.5 text-right font-black">Cargo / Função</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {allUsers.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-slate-400 italic font-semibold">
                                Carregando quadro clínico ou lista de usuários vazia.
                              </td>
                            </tr>
                          ) : (
                            allUsers.map((u) => (
                              <tr key={u.id} className="hover:bg-slate-50/50 transition">
                                <td className="py-3 font-mono text-[10px] text-slate-400 font-bold">{u.id}</td>
                                <td className="py-3 font-mono text-[10.5px] text-slate-600 font-semibold">@{u.usuario}</td>
                                <td className="py-3 font-bold text-[#002C54]">{u.nome}</td>
                                <td className="py-3 text-right">
                                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-extrabold tracking-wide uppercase ${
                                    u.tipo === "Admin" ? "bg-purple-100 text-purple-700 border border-purple-200" :
                                    u.tipo === "Enfermagem" ? "bg-indigo-100 text-indigo-700 border border-indigo-200" :
                                    "bg-[#e3f2fd] text-[#1872b8] border border-[#bbdefb]"
                                  }`}>
                                    {u.tipo}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-5 bg-[#e3f2fd]/10 p-3.5 border border-dashed border-[#1f8cd0]/30 rounded-xl space-y-1">
                      <p className="text-[10px] font-black text-[#002C54] uppercase tracking-wider flex items-center gap-1.5 leading-normal">
                        💡 Sincronização Automática
                      </p>
                      <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">
                        Ao cadastrar um novo profissional nesta aba, as credenciais passam a ser reconhecidas imediatamente no menu de login corporativo do Hospital Vida e em todos os terminais.
                      </p>
                    </div>

                  </div>
                </div>

              </div>

              <div className="flex items-center justify-between pb-3 pt-6 border-b border-slate-200">
                <div>
                  <h2 className="text-base font-extrabold text-[#002C54] uppercase tracking-wider">Controle de Origens e Destinos</h2>
                  <p className="text-xs text-slate-500 mt-1">Gerencie separadamente os setores de Origem e de Destino ativos para seleção de chamados.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form column for location */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left">
                    <h3 className="text-sm font-bold text-[#002C54] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <MapPin className="h-4.5 w-4.5 text-[#1872b8]" />
                      Novo Setor Clínico
                    </h3>

                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newLocalNome.trim()) {
                        alert("Por favor, digite o nome do local.");
                        return;
                      }
                      const res = await criarLocal(newLocalNome.trim(), newLocalTipo);
                      if (res) {
                        setNewLocalNome("");
                      }
                    }} className="space-y-4 text-xs font-semibold">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                          Nome do Setor / Quarto / Ala
                        </label>
                        <input
                          type="text"
                          required
                          value={newLocalNome}
                          onChange={(e) => setNewLocalNome(e.target.value)}
                          placeholder="Ex: Sala de Raio-X 02, Quarto 304"
                          className="block h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#002C54] placeholder-slate-450 focus:border-[#1872b8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1872b8] transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Classificação do Setor
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setNewLocalTipo("Origem")}
                            className={`px-3 py-2.5 rounded-xl text-center font-bold text-[10px] uppercase tracking-wider border transition-all cursor-pointer ${
                              newLocalTipo === "Origem"
                                ? "bg-[#e3f2fd] text-[#1872b8] border-[#1872b8]/40 font-black"
                                : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            Setor: Origem
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewLocalTipo("Destino")}
                            className={`px-3 py-2.5 rounded-xl text-center font-bold text-[10px] uppercase tracking-wider border transition-all cursor-pointer ${
                              newLocalTipo === "Destino"
                                ? "bg-[#e3f2fd] text-[#1872b8] border-[#1872b8]/40 font-black"
                                : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            Setor: Destino
                          </button>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-relaxed">
                          Define em qual seletor de formulário este setor será disponibilizado para a equipe.
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="flex w-full items-center justify-center rounded-xl bg-[#1872b8] hover:bg-[#1565c0] text-white font-bold py-2.5 px-4 text-[10.5px] uppercase tracking-wider shadow-sm transition cursor-pointer"
                      >
                        <PlusCircle className="h-4 w-4 mr-1.5" />
                        Cadastrar Setor
                      </button>
                    </form>
                  </div>
                </div>

                {/* Locations list block */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <h3 className="text-sm font-bold text-[#002C54] uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="h-4.5 w-4.5 text-[#1872b8]" />
                        Setores Ativos no Plantão
                      </h3>
                      <span className="text-[9px] font-extrabold px-2.5 py-1 bg-slate-150 text-slate-600 rounded-lg uppercase tracking-wider">
                        {(locais.length || (activeOrigins.length + activeDestinations.length))} Setores Ativos
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Origins column list */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex justify-between items-center">
                          <span>Setor: Origem</span>
                          <span className="bg-[#e3f2fd] text-[#1872b8] px-1.5 py-0.2 rounded font-mono text-[9px]">{activeOrigins.length}</span>
                        </h4>
                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                          {activeOrigins.map((name, idx) => (
                            <div key={`orig-${idx}`} className="flex items-center gap-2 p-2 bg-emerald-50/40 rounded-xl border border-emerald-100/50 text-xs text-emerald-800">
                              <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span className="font-bold truncate">{name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Destinations column list */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex justify-between items-center">
                          <span>Setor: Destino</span>
                          <span className="bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-mono text-[9px]">{activeDestinations.length}</span>
                        </h4>
                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                          {activeDestinations.map((name, idx) => (
                            <div key={`dest-${idx}`} className="flex items-center gap-2 p-2 bg-[#e3f2fd]/20 rounded-xl border border-[#e3f2fd] text-xs text-[#002C54]">
                              <MapPin className="h-3.5 w-3.5 text-[#1872b8] shrink-0" />
                              <span className="font-bold truncate">{name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 bg-[#e3f2fd]/10 p-3.5 border border-dashed border-[#1f8cd0]/30 rounded-xl space-y-1">
                      <p className="text-[10px] font-black text-[#002C54] uppercase tracking-wider flex items-center gap-1.5 leading-normal">
                        💡 Controle Dinâmico Separado
                      </p>
                      <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">
                        Ao separar Origens (onde o paciente está) de Destinos (para onde o paciente vai), minimizamos erros de registro pela Enfermagem e garantimos as rotas clínicas perfeitamente mapeadas.
                      </p>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* --- High Density Footer --- */}
      <footer className="h-10 bg-[#002C54] border-t border-slate-200/20 text-blue-200 flex items-center justify-between px-4 sm:px-6 text-[9.5px] font-mono tracking-widest shrink-0 select-none uppercase font-semibold">
        <div className="flex items-center gap-5">
          <span>SMARTMAQUEIRO v2.4-CONNECTED</span>
          <span className="hidden md:inline text-blue-300/30">|</span>
          <span className="hidden md:inline">SYSTEM STATUS: ACTIVE [CLOUD INGRESS OK]</span>
        </div>
        <div className="flex items-center gap-4 text-blue-100">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            SINC INTEGRAÇÃO ATIVA
          </span>
        </div>
      </footer>
    </div>
  );
}
