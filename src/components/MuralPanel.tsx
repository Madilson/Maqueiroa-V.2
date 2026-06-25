import React, { useState, useEffect } from "react";
import { Chamado, PrioridadeChamado } from "../types";
import { 
  Activity, 
  ArrowRight, 
  Clock, 
  MapPin, 
  ArrowLeft, 
  Monitor, 
  Volume2, 
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Users
} from "lucide-react";
import { HospitalVidaLogo } from "./LoginScreen";
import { playHospitalBell, playEmergencySiren } from "./AudioAlerts";
import { motion, AnimatePresence } from "motion/react";

interface MuralPanelProps {
  chamados: Chamado[];
  onClose: () => void;
  isLoggedIn?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
}

export function MuralPanel({ chamados, onClose, isLoggedIn = false, onRefresh, loading = false }: MuralPanelProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filterPriority, setFilterPriority] = useState<string>("Todas");
  const [knownActiveIds, setKnownActiveIds] = useState<string[]>([]);
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  // Keep a running clock for hospital precision
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Track known active transport IDs to play sound chimes when a new request is announced
  useEffect(() => {
    const currentActiveIds = chamados
      .filter(c => c.status === "Aguardando" || c.status === "Aceito" || c.status === "Em_Transporte")
      .map(c => c.id);

    if (!initialSyncDone) {
      setKnownActiveIds(currentActiveIds);
      setInitialSyncDone(true);
      return;
    }

    const brandNewIds = currentActiveIds.filter(id => !knownActiveIds.includes(id));

    if (brandNewIds.length > 0) {
      // Find the priorities of newly added calls
      const newlyAdded = chamados.filter(c => brandNewIds.includes(c.id));
      const containsEmergency = newlyAdded.some(c => c.prioridade === "Emergencia");

      if (containsEmergency) {
        playEmergencySiren();
      } else {
        playHospitalBell();
      }
      setKnownActiveIds(currentActiveIds);
    } else if (
      currentActiveIds.length !== knownActiveIds.length ||
      currentActiveIds.some((id, idx) => !knownActiveIds.includes(id))
    ) {
      setKnownActiveIds(currentActiveIds);
    }
  }, [chamados, initialSyncDone, knownActiveIds]);

  // Map priorities to numerical value for sorting
  const getPriorityWeight = (prio: PrioridadeChamado): number => {
    switch (prio) {
      case "Emergencia": return 4;
      case "Alta": return 3;
      case "Media": return 2;
      case "Baixa": return 1;
      default: return 0;
    }
  };

  // Filter to show only active calls (not Finished or Cancelled) that Maqueiros need to retrieve
  const activeChamados = chamados.filter(c => 
    c.status === "Aguardando" || c.status === "Aceito" || c.status === "Em_Transporte"
  );

  // Sort: First by Priority level (Highest first), second by creation time (Oldest first)
  const sortedChamados = [...activeChamados].sort((a, b) => {
    const weightA = getPriorityWeight(a.prioridade);
    const weightB = getPriorityWeight(b.prioridade);
    
    // Sort by priority weight descending
    if (weightB !== weightA) {
      return weightB - weightA;
    }
    
    // If priorities are equal, show oldest first (FIFO)
    const timeA = a.criadoEm ? new Date(a.criadoEm).getTime() : 0;
    const timeB = b.criadoEm ? new Date(b.criadoEm).getTime() : 0;
    return timeA - timeB;
  });

  // Apply visual tag filter if selected
  const visibleChamados = sortedChamados.filter(c => 
    filterPriority === "Todas" || c.prioridade === filterPriority
  );

  // Helper inside panel to track elapsed minutes
  const getElapsedMinutes = (isoString?: string): number => {
    if (!isoString) return 0;
    const diffMs = Date.now() - new Date(isoString).getTime();
    return Math.floor(diffMs / 60000);
  };

  const getElapsedTimeText = (isoString?: string): string => {
    if (!isoString) return "---";
    const mins = getElapsedMinutes(isoString);
    if (mins < 1) return "Agora mesmo";
    if (mins === 1) return "Há 1 min";
    if (mins < 60) return `Há ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours === 1) return "Há 1h";
    return `Há ${hours}h`;
  };

  // Render Priority styles tailored for high-luminance TV panel screens with Hospital Vida branding tones
  const getPanelPriorityStyles = (prio: PrioridadeChamado) => {
    switch(prio) {
      case "Emergencia":
        return {
          glow: "shadow-[0_0_15px_rgba(239,68,68,0.22)] border-rose-500/30 bg-rose-500/5",
          badge: "bg-rose-500 text-white font-black animate-pulse border border-rose-400",
          text: "text-rose-400 font-extrabold",
          pillGlow: "bg-rose-500"
        };
      case "Alta":
        return {
          glow: "shadow-[0_0_12px_rgba(245,158,11,0.15)] border-amber-500/25 bg-amber-500/5",
          badge: "bg-amber-500 text-slate-950 font-bold border border-amber-400",
          text: "text-amber-400 font-bold",
          pillGlow: "bg-amber-500"
        };
      case "Media":
        return {
          glow: "border-[#419DDC]/30 bg-[#419DDC]/5",
          badge: "bg-[#0072CE] text-white font-semibold border border-[#419DDC]/40",
          text: "text-[#419DDC]",
          pillGlow: "bg-[#0072CE]"
        };
      case "Baixa":
        return {
          glow: "border-[#003B6E]/60 bg-[#001E3D]/40",
          badge: "bg-[#002C54] text-slate-200 font-normal border border-[#003B6E]",
          text: "text-slate-400",
          pillGlow: "bg-slate-600"
        };
    }
  };

  // Helper counts
  const countAguardando = activeChamados.filter(c => c.status === "Aguardando").length;
  const countEmRota = activeChamados.filter(c => c.status === "Aceito" || c.status === "Em_Transporte").length;
  const countEmergencias = activeChamados.filter(c => c.prioridade === "Emergencia").length;

  return (
    <div className="min-h-screen bg-[#00152b] text-slate-100 flex flex-col font-sans antialiased overflow-x-hidden relative">
      
      {/* Dynamic Background visual glows with exact Hospital Vida Sky-Blue tones */}
      <div className="absolute top-0 right-1/4 w-[50rem] h-[30rem] bg-[#419DDC]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[35rem] h-[35rem] bg-[#0072CE]/6 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Light hospital grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#002C54_1px,transparent_1px),linear-gradient(to_bottom,#002C54_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)]" />

      {/* --- MURAL TOP NAV-HEADER --- */}
      <header className="h-20 bg-[#002244]/95 border-b border-[#003B6E] flex items-center justify-between px-6 shrink-0 relative z-30 shadow-xl backdrop-blur-md">
        
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2.5 bg-[#002C54] hover:bg-[#003B6E] text-slate-300 hover:text-white rounded-xl border border-[#003B6E] transition flex items-center justify-center cursor-pointer"
            title="Sair do Painel"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>

          <div className="flex items-center gap-3">
            <div className="h-11 w-11 bg-white rounded-3xl flex items-center justify-center font-bold shadow-lg">
              <HospitalVidaLogo className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-lg font-black tracking-wider text-white">
                  HOSPITAL <span className="text-[#419DDC] font-black">VIDA</span>
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono tracking-widest font-bold bg-[#00152b] text-[#419DDC] border border-[#419DDC]/20 uppercase">
                  Mural de Macas Real-time
                </span>
              </div>
              <p className="text-[10px] text-slate-350 tracking-wide uppercase font-semibold hidden sm:block">Painel de Monitoramento de Transportes Ativos por Prioridade</p>
            </div>
          </div>
        </div>

        {/* Real-time Digital Hospital Clock */}
        <div className="text-center hidden md:flex flex-col items-center bg-[#00152b]/80 px-4 py-1.5 rounded-2xl border border-[#003B6E] shadow-inner">
          <span className="text-xs text-slate-400 uppercase font-black tracking-widest font-mono">Hora do Servidor</span>
          <span className="text-lg font-bold font-mono text-[#419DDC] leading-none mt-0.5 tracking-wider">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="text-[9px] text-[#419DDC]/70 uppercase font-bold tracking-wider mt-0.5 font-mono">
            {currentTime.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' })}
          </span>
        </div>

        {/* Side Actions Controls */}
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2.5 bg-[#002C54] hover:bg-[#003B6E] text-slate-300 hover:text-white rounded-xl border border-[#003B6E] transition flex items-center gap-2 font-bold text-xs uppercase cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar Qr</span>
            </button>
          )}

          <div className="text-right flex flex-col justify-center bg-[#00152b]/80 border border-[#003B6E] rounded-xl px-3 py-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block leading-none">Acesso Terminal</span>
            <span className="text-xs font-extrabold text-[#ffffff] mt-1 tracking-wide leading-none uppercase">
              {isLoggedIn ? "Conectado" : "Painel Público"}
            </span>
          </div>
        </div>
      </header>

      {/* --- CONDENSED PRE-INDICATORS (BENTO STYLE) --- */}
      <section className="bg-[#002244]/40 border-b border-[#003B6E]/50 py-4 px-6 relative z-20 shrink-0">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-[#002244]/80 p-3.5 rounded-2xl border border-rose-500/15 flex items-center justify-between shadow-lg relative overflow-hidden">
            {countEmergencias > 0 && (
              <div className="absolute top-0 right-0 h-1.5 w-full bg-rose-500 animate-pulse"></div>
            )}
            <div>
              <span className="text-[10.5px] text-rose-400 uppercase font-black tracking-wider block">🚨 Emergências Ativas</span>
              <p className="text-2xl font-mono font-black text-rose-400 mt-1 leading-none">
                {countEmergencias}
              </p>
            </div>
            <div className={`h-10 w-10 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-center text-rose-400 ${countEmergencias > 0 ? 'animate-bounce' : ''}`}>
              <AlertCircle className="h-5.5 w-5.5" />
            </div>
          </div>

          <div className="bg-[#002244]/80 p-3.5 rounded-2xl border border-[#419DDC]/15 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[10.5px] text-[#419DDC] uppercase font-black tracking-wider block">⏳ Pacientes em Fila</span>
              <p className="text-2xl font-mono font-black text-[#419DDC] mt-1 leading-none">
                {countAguardando}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#419DDC]/5 border border-[#419DDC]/20 flex items-center justify-center text-[#419DDC]">
              <Clock className="h-5.5 w-5.5" />
            </div>
          </div>

          <div className="bg-[#002244]/80 p-3.5 rounded-2xl border border-teal-500/15 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[10.5px] text-teal-400 uppercase font-black tracking-wider block">🏃 Transporte em Curso</span>
              <p className="text-2xl font-mono font-black text-teal-400 mt-1 leading-none">
                {countEmRota}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-teal-500/5 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Activity className="h-5.5 w-5.5" />
            </div>
          </div>

        </div>
      </section>

      {/* --- MAIN DISPLAY CONTENT --- */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6 relative z-10 overflow-y-auto">
        
        {/* Row controls and title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#003B6E]/50 pb-4 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <Monitor className="h-6 w-6 text-[#419DDC] animate-pulse" />
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-white">Pranchão Geral de Despacho Clínico</h2>
              <p className="text-xs text-slate-350 mt-1 font-semibold">Triagem de prioridade clínica sequencial. Novas admissões são ordenadas no topo.</p>
            </div>
          </div>

          {/* Micro Filter badges on TV Board */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-455 tracking-widest mr-1">Filtrar Mural:</span>
            {["Todas", "Emergencia", "Alta", "Media", "Baixa"].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wide border transition-all text-center cursor-pointer ${
                  filterPriority === p 
                    ? "bg-[#419DDC] text-white border-[#3da1e0] shadow-md shadow-[#419DDC]/20" 
                    : "bg-[#001E3D] border-[#003B6E] hover:border-[#419DDC]/30 text-slate-350"
                }`}
              >
                {p === "Todas" ? "Ver Tudo" : p === "Media" ? "Média" : p === "Emergencia" ? "🚨 Emergência" : p}
              </button>
            ))}
          </div>
        </div>

        {/* --- DYNAMIC TRANSFERS STACK LAYOUT --- */}
        <div className="flex-1 flex flex-col">
          {visibleChamados.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-[#001E3D]/30 border-2 border-dashed border-[#003B6E]/60 rounded-3xl p-10 max-w-xl mx-auto w-full my-auto"
            >
              <Activity className="mx-auto h-16 w-16 text-slate-700 mb-4" />
              <h3 className="font-black text-white text-base uppercase tracking-wider">Fila Totalmente Limpa</h3>
              <p className="text-xs text-slate-350 max-w-sm mx-auto mt-2 leading-relaxed">
                Nenhum maqueiro foi requisitado ou há transportes pendentes sob a prioridade <strong className="text-[#419DDC]">"{filterPriority}"</strong> neste instante. Excelente trabalho de gestão hospitalar!
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {visibleChamados.map((c, index) => {
                  const styles = getPanelPriorityStyles(c.prioridade);
                  const isCritical = c.prioridade === "Emergencia";
                  const elapsedMins = getElapsedMinutes(c.criadoEm);
                  const isWaitingTooLong = (c.prioridade === "Emergencia" && elapsedMins >= 10) || (c.prioridade === "Alta" && elapsedMins >= 15);

                  const elapsedMs = c.criadoEm ? Date.now() - new Date(c.criadoEm).getTime() : 100000;
                  const isBrandNew = elapsedMs < 90000; // 90 seconds

                  const animProps = isBrandNew 
                    ? {
                        initial: { opacity: 0, scale: 0.9, y: 30 },
                        animate: { 
                          opacity: 1, 
                          scale: [0.9, 1.05, 1], 
                          y: 0 
                        },
                        transition: { duration: 0.7, ease: "easeOut" }
                      }
                    : {
                        initial: { opacity: 0, scale: 0.97, y: 15 },
                        animate: { opacity: 1, scale: 1, y: 0 },
                        transition: { duration: 0.3, ease: "easeInOut" }
                      };

                  return (
                    <motion.div
                      key={c.id}
                      layout
                      {...animProps}
                      exit={{ opacity: 0, scale: 0.95, y: -15 }}
                      className={`relative p-5 rounded-2xl bg-[#002244]/90 border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-xl ${styles.glow} ${
                        isBrandNew 
                          ? "border-cyan-400/80 ring-2 ring-cyan-400/30 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.15)]" 
                          : isCritical 
                            ? "border-rose-500/40 ring-2 ring-rose-500/15" 
                            : "border-[#003B6E]"
                      }`}
                    >
                      
                      {/* Left Block: TV Number, Priority Pill & Patient Display */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Number count for quick reference */}
                        <div className="h-10 w-10 shrink-0 bg-[#00152b] border border-[#003B6E] rounded-xl flex items-center justify-center font-mono font-black text-[#419DDC] tracking-wider">
                          {(index + 1).toString().padStart(2, '0')}
                        </div>

                        <div className="space-y-2 flex-grow min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded text-[9px] font-mono tracking-wider transition-all uppercase ${styles.badge}`}>
                              {c.prioridade === "Emergencia" ? "🚨 Emergência" : c.prioridade === "Media" ? "Média" : c.prioridade}
                            </span>
                            <span className="text-[10px] font-mono text-[#419DDC]/80 tracking-widest font-bold">
                              #{c.id}
                            </span>
                            {isBrandNew && (
                              <span className="px-2 py-0.5 rounded bg-cyan-400 text-slate-950 font-black text-[9px] tracking-wider animate-bounce flex items-center gap-1 uppercase shrink-0">
                                <Sparkles className="h-3 w-3 inline" /> Novo Chamado!
                              </span>
                            )}
                            {isWaitingTooLong && !isBrandNew && (
                              <span className="px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-black text-[9px] tracking-wider animate-pulse flex items-center gap-1 uppercase">
                                <AlertCircle className="h-3 w-3 inline" /> Tempo Crítico!
                              </span>
                            )}
                          </div>

                          <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider leading-tight truncate">
                            {c.paciente}
                          </h3>
                        </div>
                      </div>

                      {/* Routes column with prominent arrows (Perfect visual guidance) */}
                      <div className="lg:w-[32%] shrink-0 space-y-1 bg-[#00152b]/50 p-3 rounded-xl border border-[#003B6E]/55">
                        <span className="text-[9px] text-[#419DDC]/80 font-bold uppercase tracking-widest block mb-1">Rota de Maca</span>
                        <div className="flex items-center gap-2 font-sans font-black uppercase text-xs sm:text-xs tracking-wide">
                          <span className="bg-[#002244] text-slate-200 border border-[#003B6E] rounded-lg px-2.5 py-1.5 truncate max-w-[140px]" title={c.origem}>
                            {c.origem}
                          </span>
                          <ArrowRight className="h-4.5 w-4.5 text-[#419DDC] shrink-0 animate-pulse" />
                          <span className="bg-[#003B6E]/40 text-[#419DDC] border border-[#004b93]/50 rounded-lg px-2.5 py-1.5 truncate max-w-[140px]" title={c.destino}>
                            {c.destino}
                          </span>
                        </div>
                        {c.observacao && (
                          <div className="pt-2">
                            <span className="text-[9px] text-amber-400 font-bold uppercase tracking-widest block">Restrições</span>
                            <p className="text-[11px] text-amber-300 font-semibold leading-relaxed truncate block max-w-sm mt-0.5" title={c.observacao}>
                              ⚠️ "{c.observacao}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Wait Time columns */}
                      <div className="lg:w-[15%] shrink-0 flex flex-col justify-center bg-[#00152b]/50 p-3 rounded-xl border border-[#003B6E]/55">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-1.5">Espera Decorrida</span>
                        <div className="flex items-center gap-1.5 text-xs sm:text-xs text-slate-200 font-mono font-black">
                          <Clock className={`h-4.5 w-4.5 ${isWaitingTooLong ? 'text-rose-400 animate-pulse' : 'text-[#419DDC]'}`} />
                          <span className={isWaitingTooLong ? 'text-rose-400 font-black' : 'text-slate-200'}>
                            {getElapsedTimeText(c.criadoEm)}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 mt-1 font-bold">
                          Pedido às {formatRequestTime(c.criadoEm)}
                        </span>
                      </div>

                      {/* Current Status Block */}
                      <div className="lg:w-[18%] shrink-0 flex items-center justify-end">
                        <div className="w-full text-center sm:text-right">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Status Operação</span>
                          
                          {c.status === "Aguardando" && (
                            <span className="inline-flex items-center justify-center w-full px-3 py-2 bg-amber-500/15 text-amber-400 rounded-xl text-xs font-black uppercase tracking-wider border border-amber-500/25 shadow-sm">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mr-2 animate-ping shrink-0" />
                              Aguardando Maca
                            </span>
                          )}

                          {c.status === "Aceito" && (
                            <div className="text-left sm:text-right space-y-1">
                              <span className="inline-flex items-center justify-center w-full px-3 py-2 bg-[#419DDC]/10 text-[#419DDC] rounded-xl text-xs font-black uppercase tracking-wider border border-[#419DDC]/30">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#419DDC] mr-2 animate-pulse shrink-0" />
                                Rota Aceita
                              </span>
                              {c.maqueiro && (
                                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider text-center mt-1">
                                  Por: {c.maqueiro}
                                </p>
                              )}
                            </div>
                          )}

                          {c.status === "Em_Transporte" && (
                            <div className="text-left sm:text-right space-y-1">
                              <span className="inline-flex items-center justify-center w-full px-3 py-2 bg-teal-500/15 text-teal-400 rounded-xl text-xs font-black uppercase tracking-wider border border-teal-500/30 animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 mr-2 animate-ping shrink-0" />
                                Em Transporte
                              </span>
                              {c.maqueiro && (
                                <p className="text-[10.5px] text-slate-200 font-extrabold uppercase tracking-wider text-center mt-1">
                                  Condutor: {c.maqueiro}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* --- High Density TV Footer --- */}
      <footer className="h-10 bg-[#00152b] border-t border-[#002C54] text-slate-400 flex items-center justify-between px-6 text-[9px] font-mono shrink-0 select-none uppercase font-bold tracking-widest">
        <div className="flex items-center gap-4">
          <span>HOSPITAL VIDA • SMARTMAQUEIRO PANEL MONITOR</span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="hidden sm:inline">Refresh ciclo: Auto (5000ms)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#419DDC]">
          <span className="w-1.5 h-1.5 bg-[#419DDC] rounded-full animate-ping"></span>
          REAL-TIME ACTIVES ONLINE
        </div>
      </footer>
    </div>
  );
}

// Quick helper to translate ISO Date nicely
function formatRequestTime(isoString?: string): string {
  if (!isoString) return "--:--";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch(e) {
    return "--:--";
  }
}
