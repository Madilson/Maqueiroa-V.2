import React, { useState } from "react";
import { Usuario } from "../types";
import { ShieldAlert, Heart, Truck, HelpCircle, ArrowRight, UserCheck } from "lucide-react";
import { motion } from "motion/react";

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<any>;
  loading: boolean;
}

// Highly precise SVG clover flower made of 4 hearts in the exact shades of the Hospital Vida logo
export function HospitalVidaLogo({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Heart shape with rounded clean vector curvature */}
        <path id="heart-petal" d="M 0,-5 C -5,-13 -15,-9 -12,-1 C -9,6 0,14 0,14 C 0,14 9,6 12,-1 C 15,-9 5,-13 0,-5 Z" />
      </defs>
      {/* 4 hearts rotated around center (50, 50) */}
      {/* Top Petal - Medium Blue - Logo core */}
      <use href="#heart-petal" transform="translate(50, 48) rotate(0) scale(1.15)" fill="#1872b8" />
      <circle cx="50" cy="24" r="2.5" fill="#1872b8" />
      
      {/* Right Petal - Beautiful lighter Azure Blue */}
      <use href="#heart-petal" transform="translate(52, 50) rotate(90) scale(1.15)" fill="#42a5f5" />
      <circle cx="76" cy="50" r="2.5" fill="#42a5f5" />
      
      {/* Bottom Petal - Soft Sky Blue */}
      <use href="#heart-petal" transform="translate(50, 52) rotate(180) scale(1.15)" fill="#1f8cd0" />
      <circle cx="50" cy="76" r="2.5" fill="#1f8cd0" />
      
      {/* Left Petal - Deep Navy Blue */}
      <use href="#heart-petal" transform="translate(48, 50) rotate(270) scale(1.15)" fill="#002C54" />
      <circle cx="24" cy="50" r="2.5" fill="#002C54" />
    </svg>
  );
}

export function LoginScreen({ onLogin, loading }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // Pre-configured staff shortcuts with user & password simulation
  const shortcuts = [
    { username: "admin", password: "admin", nome: "Admin (Diretoria)", tipo: "Admin" as const, desc: "Acesso Geral Administrativo" },
    { username: "marcia", password: "123", nome: "Enf. Márcia Rocha", tipo: "Enfermagem" as const, desc: "Setor de Origem: Ala A / Triagem" },
    { username: "thiago", password: "123", nome: "Enf. Thiago Costa", tipo: "Enfermagem" as const, desc: "Setor de Origem: Pronto Socorro" },
    { username: "joao", password: "123", nome: "Maqueiro João Silva", tipo: "Maqueiro" as const, desc: "Portaria Central / Macas" },
    { username: "pedro", password: "123", nome: "Maqueiro Pedro Santos", tipo: "Maqueiro" as const, desc: "Maqueiros Setoriais" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      alert("Por favor, digite seu usuário.");
      return;
    }
    if (!password.trim()) {
      alert("Por favor, digite sua senha.");
      return;
    }
    onLogin(username.trim(), password);
  };

  const handleShortcutClick = (sc: typeof shortcuts[0]) => {
    setUsername(sc.username);
    setPassword(sc.password);
    onLogin(sc.username, sc.password);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#f8fbfe] px-4 py-8 sm:px-6 lg:px-8 overflow-hidden font-sans">
      
      {/* Sophisticated clinical brand lighting background */}
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-[#1872b8]/5 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-y-1/2 translate-x-1/2 w-[35rem] h-[35rem] bg-[#42a5f5]/60 rounded-full blur-[140px] pointer-events-none opacity-10" />
      
      {/* Soft clinical network grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2ecf5_1px,transparent_1px),linear-gradient(to_bottom,#e2ecf5_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] opacity-40" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md space-y-6 z-10"
      >
        
        {/* Hospital Vida Authentic Brand Header */}
        <div id="brand-header" className="text-center space-y-2">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-md border border-slate-100 ring-2 ring-slate-100/50"
          >
            <HospitalVidaLogo className="w-18 h-18 text-slate-900" />
          </motion.div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight text-[#002C54] flex items-center justify-center gap-1.5 uppercase">
              HOSPITAL <span className="text-[#1f8cd0] font-medium">VIDA</span>
            </h2>
            <p className="text-xs font-semibold text-[#002C54]/80 tracking-wide">
              Humano por natureza
            </p>
            <div className="h-0.5 w-12 bg-gradient-to-r from-[#1872b8] to-[#42a5f5] mx-auto rounded-full my-2"></div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              SmartMaqueiro • Despacho Inteligente de Macas realtime
            </p>
          </div>
        </div>

        {/* Auth Panel card */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-150 backdrop-blur-sm">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h3 className="text-sm font-bold text-[#002C54] uppercase tracking-wider flex items-center gap-1.5">
              Portal de Identificação Profissional
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Insira suas credenciais corporativas do Hospital Vida para iniciar o plantão.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Custom Inputs with High Usability Design */}
            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <label htmlFor="username" className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Usuário do Plantão
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: admin, marcia, joao"
                  className="block h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#002C54] placeholder-slate-400 focus:border-[#1872b8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1872b8] transition-all font-mono"
                />
              </div>

              <div className="space-y-1 text-left">
                <label htmlFor="senha-input" className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Senha de Acesso
                </label>
                <input
                  id="senha-input"
                  name="senha-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="block h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#002C54] placeholder-slate-400 focus:border-[#1872b8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1872b8] transition-all"
                />
              </div>
            </div>

            <p className="text-[9.5px] text-slate-400 font-semibold leading-relaxed text-left py-1">
              * Para contas de simulação padrões, a senha é <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">123</code> (com exceção do <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">admin</code> que é <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">admin</code>).
            </p>

            <motion.button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex w-full items-center justify-center rounded-xl bg-[#1872b8] hover:bg-[#1565c0] text-white font-bold py-3 px-4 text-xs uppercase tracking-wider shadow-md shadow-[#1872b8]/10 hover:shadow-[#1872b8]/20 transition disabled:bg-slate-300 disabled:text-slate-500 cursor-pointer"
            >
              {loading ? "Verificando Credenciais..." : "Entrar no Sistema"}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </motion.button>
          </form>

          {/* Quick Simulation shortcuts with exact brand styles */}
          <div className="mt-6 border-t border-slate-100 pt-5 text-left">
            <h4 className="text-[10px] font-black text-[#002C54] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-[#1872b8]" />
              Entrar em Modo Simulação (1-Clique)
            </h4>
            
            <div className="grid grid-cols-1 gap-2">
              {shortcuts.map((sc) => (
                <button
                  id={`shortcut-btn-${sc.username}`}
                  key={sc.username}
                  type="button"
                  onClick={() => handleShortcutClick(sc)}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-150 bg-slate-50/50 text-left hover:border-[#1872b8]/40 hover:bg-[#e3f2fd]/20 transition-all select-none group cursor-pointer"
                >
                  <div className="space-y-0.5 max-w-[70%]">
                    <p className="text-xs font-bold text-[#002C54] group-hover:text-[#1872b8] transition-colors truncate">{sc.nome}</p>
                    <p className="text-[10px] text-slate-500 truncate">{sc.desc}</p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wide uppercase ${
                    sc.tipo === "Admin" ? "bg-purple-100 text-purple-700 border border-purple-200" :
                    sc.tipo === "Enfermagem" ? "bg-indigo-100 text-indigo-700 border border-indigo-200" :
                    "bg-[#e3f2fd] text-[#1872b8] border border-[#bbdefb]"
                  }`}>
                    {sc.tipo === "Admin" ? "Administrador" : sc.tipo}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Info footer in Navy Palette */}
        <div className="text-center text-[10px] text-slate-500 font-mono flex py-1.5 bg-slate-100/50 rounded-xl justify-center gap-1.5 px-3 items-center border border-slate-150 uppercase tracking-wider max-w-sm mx-auto">
          <span>Selo de Integridade • Conexão Criptografada</span>
        </div>

      </motion.div>
    </div>
  );
}
