import { useState, useEffect, useCallback, useRef } from "react";
import { Chamado, StatusChamado, PrioridadeChamado, SystemLog, DashboardStats, Usuario, Local } from "../types";
import { playHospitalBell, playEmergencySiren, playSuccessChime } from "../components/AudioAlerts";

export interface ToastMessage {
  id: string;
  texto: string;
  tipo: 'sucesso' | 'info' | 'alerta' | 'erro';
}

export function useSmartMaqueiroData() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [usuariosOnline, setUsuariosOnline] = useState<string[]>([]);
  const [usuariosOnlineCount, setUsuariosOnlineCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [allUsers, setAllUsers] = useState<Usuario[]>([]);
  const [locais, setLocais] = useState<Local[]>([]);

  // Config integration
  const [isGoogleSheets, setIsGoogleSheets] = useState(() => {
    const saved = localStorage.getItem("sm_is_google_sheets");
    if (saved !== null) {
      return saved === "true";
    }
    return true; // Default to true since sheets integration is requested
  });
  const [appsScriptUrl, setAppsScriptUrl] = useState(() => {
    const savedUrl = localStorage.getItem("sm_apps_script_url");
    const fallbackUrl = "https://script.google.com/macros/s/AKfycbwEGuK0EtYpzJjdfy8Qb7NLWJOhLFwWfa559KPDVjCLp_t6WdKDl6qU3EHCp4xO58aY/exec";
    const envUrl = (import.meta as any).env?.VITE_APPS_SCRIPT_URL || fallbackUrl;
    if (savedUrl && (savedUrl.includes("AKfycbz") || savedUrl.trim() === "")) {
      localStorage.setItem("sm_apps_script_url", envUrl);
      return envUrl;
    }
    return savedUrl || envUrl;
  });

  // Active session
  const [user, setUser] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem("sm_logged_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Track the previous amount of calling IDs to sound notifications
  const prevChamadosCountRef = useRef<number>(0);
  const prevChamadosStatusMapRef = useRef<Record<string, StatusChamado>>({});

  const addToast = useCallback((texto: string, tipo: ToastMessage['tipo'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, texto, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Save config
  const saveIntegrationConfig = (useSheets: boolean, urlStr: string) => {
    setIsGoogleSheets(useSheets);
    setAppsScriptUrl(urlStr);
    localStorage.setItem("sm_is_google_sheets", String(useSheets));
    localStorage.setItem("sm_apps_script_url", urlStr);
    addToast(
      useSheets 
        ? "Configuração salva: Integrado com Google Sheets" 
        : "Configuração salva: Usando API Local / Em memória",
      "sucesso"
    );
  };

  // Base API endpoint
  const getApiUrl = useCallback(() => {
    // Return relative path. This avoids window.location.origin returning "null" inside sandboxed browser iframes
    return "";
  }, []);

  const safeJson = useCallback(async (res: Response): Promise<any> => {
    if (!res.ok) {
      throw new Error(`Resposta inválida do servidor (Código HTTP: ${res.status}).`);
    }
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      throw new Error("O servidor retornou uma página HTML em vez de dados JSON. O servidor backend pode estar iniciando.");
    }
    return res.json();
  }, []);

  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 30000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (err: any) {
      clearTimeout(id);
      if (err.name === 'AbortError' || err.message?.includes('abort') || err.message?.includes('signal')) {
        throw new Error(`A requisição expirou (Limite de ${timeout / 1000}s). O Google Sheets ou servidor está offline ou lento.`);
      }
      throw err;
    }
  };

  // Load All data
  const loadData = useCallback(async (silently = false) => {
    if (!silently) setLoading(true);
    setError(null);

    try {
      if (isGoogleSheets && appsScriptUrl) {
        // --- GOOGLE SHEETS MODE ---
        // Fetch via standard CORS proxy / GET request directly to Google Apps Script Web App
        const baseGasUrl = appsScriptUrl.trim();
        
        // Execute concurrently using Promise.all with a generous 30s timeout to maximize performance and avoid timeouts
        const [resChamados, resLogs, resUsers, resLocais] = await Promise.all([
          fetchWithTimeout(`${baseGasUrl}?action=chamados`, {}, 30000).then(safeJson),
          fetchWithTimeout(`${baseGasUrl}?action=logs`, {}, 30000).then(safeJson).catch((e) => {
            console.warn("Log fetch failed, using fallback:", e);
            return [];
          }),
          fetchWithTimeout(`${baseGasUrl}?action=usuarios`, {}, 30000).then(safeJson).catch((e) => {
            console.warn("Users fetch failed, using fallback:", e);
            return [];
          }),
          fetchWithTimeout(`${baseGasUrl}?action=locais`, {}, 30000).then(safeJson).catch((e) => {
            console.warn("Locais fetch failed, using fallback:", e);
            return [];
          })
        ]) as [any, any, any, any];

        if (resChamados && resChamados.error) throw new Error(resChamados.error);
        
        // Map raw cell values back if formatted differently from App Script JSON output
        const loadedChamados: Chamado[] = (resChamados || []).map((c: any) => ({
          ...c,
          prioridade: c.prioridade as PrioridadeChamado || "Media",
          status: c.status as StatusChamado || "Aguardando"
        }));

        const loadedLogs: SystemLog[] = resLogs || [];
        
        setChamados(loadedChamados);
        setLogs(loadedLogs);

        // Pre-build stats locally since google apps script doesn't have an built-in complex aggregates endpoint
        const finalizados = loadedChamados.filter((c) => c.status === "Finalizado");
        let totalTimeMin = 0;
        let countsTime = 0;
        finalizados.forEach((c) => {
          if (c.criadoEm && c.finalizadoEm) {
            const di = new Date(c.criadoEm).getTime();
            const df = new Date(c.finalizadoEm).getTime();
            if (df > di) {
              totalTimeMin += (df - di) / 60000;
              countsTime++;
            }
          }
        });

        const tempoMedio = countsTime > 0 ? parseFloat((totalTimeMin / countsTime).toFixed(1)) : 10;
        const porPrioridade = { Baixa: 0, Media: 0, Alta: 0, Emergencia: 0 };
        const porOrigem: Record<string, number> = {};
        const porDestino: Record<string, number> = {};
        const corridasMaqueiro: Record<string, number> = {};

        loadedChamados.forEach((c) => {
          if (c.prioridade in porPrioridade) porPrioridade[c.prioridade]++;
          porOrigem[c.origem] = (porOrigem[c.origem] || 0) + 1;
          porDestino[c.destino] = (porDestino[c.destino] || 0) + 1;
          if (c.maqueiro && c.status === "Finalizado") {
            corridasMaqueiro[c.maqueiro] = (corridasMaqueiro[c.maqueiro] || 0) + 1;
          }
        });

        const computedStats: DashboardStats = {
          totalCount: loadedChamados.length,
          aguardandoCount: loadedChamados.filter((c) => c.status === "Aguardando").length,
          emTransporteCount: loadedChamados.filter((c) => c.status === "Em_Transporte" || c.status === "Aceito").length,
          finalizadosCount: finalizados.length,
          canceladosCount: loadedChamados.filter((c) => c.status === "Cancelado").length,
          tempoMedioAtendimento: tempoMedio,
          porPrioridade,
          porOrigem,
          porDestino,
          corridasMaqueiro
        };

        setStats(computedStats);
        
        const loadedUsersList: Usuario[] = (resUsers || []).map((u: any) => ({
          id: u.id || "U-" + Math.floor(Math.random() * 10000),
          usuario: u.usuario || "",
          nome: u.nome || "",
          tipo: u.tipo as Usuario['tipo'] || "Enfermagem"
        }));
        setAllUsers(loadedUsersList);

        const loadedLocaisList: Local[] = (resLocais || []).map((l: any) => {
          const nomeKey = Object.keys(l).find(k => k.toLowerCase() === 'nome') || 'nome';
          const tipoKey = Object.keys(l).find(k => k.toLowerCase() === 'tipo') || 'tipo';
          const idKey = Object.keys(l).find(k => k.toLowerCase() === 'id') || 'id';

          const rawTipo = String(l[tipoKey] || "").trim();
          const tipoFinal: 'Origem' | 'Destino' = (rawTipo === "Destino" || rawTipo === "Destino Final" || rawTipo.toLowerCase().includes("destino")) ? "Destino" : "Origem";

          return {
            id: l[idKey] || "LC-" + Math.floor(Math.random() * 10000),
            nome: String(l[nomeKey] || "").trim(),
            tipo: tipoFinal
          };
        });
        setLocais(loadedLocaisList);

        const mappedUsersList = loadedUsersList.map((u) => u.nome || u.usuario);
        setUsuariosOnline(mappedUsersList.length > 0 ? mappedUsersList : ["Enfermagem Integrada", "Maqueiro Integrado"]);
        setUsuariosOnlineCount(mappedUsersList.length || 2);
        
      } else {
        // --- LOCAL BACKEND SERVER MODE (Express in container) ---
        const url = getApiUrl();
        
        const fetchAndParse = async (endpoint: string, fallback: any) => {
          try {
            const res = await fetchWithTimeout(`${url}${endpoint}`);
            const json = await safeJson(res);
            return { failed: false, data: json };
          } catch (err: any) {
            console.warn(`Erro na chamada ${endpoint}:`, err);
            return { failed: true, data: fallback };
          }
        };

        const [chamadosData, logsData, statsData, usuariosData, locaisData] = await Promise.all([
          fetchAndParse("/api/chamados", []),
          fetchAndParse("/api/logs", []),
          fetchAndParse("/api/stats", null),
          fetchAndParse("/api/usuarios", []),
          fetchAndParse("/api/locais", [])
        ]);

        if (!chamadosData.failed && chamadosData.data) {
          setChamados(chamadosData.data);
        }
        if (!logsData.failed && logsData.data) {
          setLogs(logsData.data);
        }
        if (!statsData.failed && statsData.data) {
          setStats(statsData.data.stats);
          setUsuariosOnline(statsData.data.usuariosOnline || []);
          setUsuariosOnlineCount(statsData.data.usuariosOnlineCount || 0);
        }
        if (!usuariosData.failed && usuariosData.data) {
          setAllUsers(usuariosData.data);
        }
        if (!locaisData.failed && locaisData.data) {
          const loadedLocaisList: Local[] = (locaisData.data || []).map((l: any) => {
            const nomeKey = Object.keys(l).find(k => k.toLowerCase() === 'nome') || 'nome';
            const tipoKey = Object.keys(l).find(k => k.toLowerCase() === 'tipo') || 'tipo';
            const idKey = Object.keys(l).find(k => k.toLowerCase() === 'id') || 'id';

            const rawTipo = String(l[tipoKey] || "").trim();
            const tipoFinal: 'Origem' | 'Destino' = (rawTipo === "Destino" || rawTipo === "Destino Final" || rawTipo.toLowerCase().includes("destino")) ? "Destino" : "Origem";

            return {
              id: l[idKey] || "LC-" + Math.floor(Math.random() * 10000),
              nome: String(l[nomeKey] || "").trim(),
              tipo: tipoFinal
            };
          });
          setLocais(loadedLocaisList);
        }

        // If all core endpoints failed, raise a connection error
        if (chamadosData.failed && logsData.failed && statsData.failed) {
          throw new Error("Não foi possível estabelecer contato com a API do servidor local.");
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar os dados:", err);
      // Construct a highly detailed help message
      let explicitMsg = "";
      if (isGoogleSheets) {
        if (!appsScriptUrl) {
          explicitMsg = "Modo Google Sheets ativo, mas URL do script não foi configurada nas configurações de rede.";
        } else {
          explicitMsg = `Falha ao conectar com o Google Sheets: ${err.message || ''}. Certifique-se de que a URL do Apps Script é pública, possui autorização para 'Qualquer pessoa' (Anyone), e que seu navegador permite requisições externas CORS.`;
        }
      } else {
        explicitMsg = `Erro de conexão local: ${err.message || 'O servidor pode estar iniciando.'} (Failed to fetch)`;
      }
      setError(explicitMsg);
    } finally {
      setLoading(false);
    }
  }, [isGoogleSheets, appsScriptUrl, getApiUrl]);

  // Monitor additions to trigger Web Audio bells/toasts
  useEffect(() => {
    if (chamados.length === 0) return;

    const previousCount = prevChamadosCountRef.current;
    const previousStatusMap = prevChamadosStatusMapRef.current;

    // Detect new calls added
    if (previousCount > 0 && chamados.length > previousCount) {
      const novidades = chamados.filter(c => !previousStatusMap[c.id]);
      novidades.forEach(n => {
        addToast(`Novo chamado registrado: ${n.paciente} (${n.origem} → ${n.destino})`, n.prioridade === "Emergencia" ? "erro" : "info");
        if (n.prioridade === "Emergencia") {
          playEmergencySiren();
        } else {
          playHospitalBell();
        }
      });
    }

    // Detect status updates for porter accepting/concluding tasks
    chamados.forEach(c => {
      const prevStatus = previousStatusMap[c.id];
      if (prevStatus && prevStatus !== c.status) {
        if (c.status === "Aceito") {
          addToast(`Chamado de ${c.paciente} aceito pelo maqueiro ${c.maqueiro || ''}`, "info");
        } else if (c.status === "Em_Transporte") {
          addToast(`Paciente ${c.paciente} em trânsito de ${c.origem} para ${c.destino}`, "info");
        } else if (c.status === "Finalizado") {
          addToast(`Transporte concluído: ${c.paciente} entregue em ${c.destino}`, "sucesso");
          playSuccessChime();
        } else if (c.status === "Cancelado") {
          addToast(`Chamado de ${c.paciente} foi cancelado!`, "erro");
        }
      }
    });

    // Update trackers
    prevChamadosCountRef.current = chamados.length;
    const newStatusMap: Record<string, StatusChamado> = {};
    chamados.forEach(c => {
      newStatusMap[c.id] = c.status;
    });
    prevChamadosStatusMapRef.current = newStatusMap;

  }, [chamados, addToast]);

  // Periodic automatic fetch every 5000ms as requested
  useEffect(() => {
    loadData(true); // Initial load silently

    const interval = setInterval(() => {
      loadData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [loadData]);

  // Login action handler
  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim();

      if (!cleanUser) {
        throw new Error("Por favor, digite o usuário.");
      }

      // Password validation for admin
      if (cleanUser === "admin" && cleanPass !== "admin") {
        throw new Error("Senha incorreta para o administrador.");
      }

      // Resolve default user properties
      let resolvedTipo: Usuario['tipo'] = "Enfermagem";
      let resolvedNome = username;

      if (cleanUser === "admin") {
        resolvedTipo = "Admin";
        resolvedNome = "Dr. Geraldo Fontes";
      } else if (cleanUser === "marcia") {
        resolvedTipo = "Enfermagem";
        resolvedNome = "Enf. Márcia Rocha";
      } else if (cleanUser === "thiago") {
        resolvedTipo = "Enfermagem";
        resolvedNome = "Enf. Thiago Costa";
      } else if (cleanUser === "joao") {
        resolvedTipo = "Maqueiro";
        resolvedNome = "Maqueiro João Silva";
      } else if (cleanUser === "pedro") {
        resolvedTipo = "Maqueiro";
        resolvedNome = "Maqueiro Pedro Santos";
      } else {
        // Look up registered allUsers list
        const dbUser = allUsers.find(u => u.usuario.trim().toLowerCase() === cleanUser);
        if (dbUser) {
          resolvedTipo = dbUser.tipo;
          resolvedNome = dbUser.nome;
        } else {
          // Permissive fallback so testing any other account is smooth
          resolvedTipo = "Enfermagem";
          resolvedNome = username.charAt(0).toUpperCase() + username.slice(1);
        }
      }

      if (isGoogleSheets && appsScriptUrl) {
        // API Google sheets
        const payload = { 
          action: "login", 
          username: cleanUser, 
          tipo: resolvedTipo, 
          nome: resolvedNome,
          password: cleanPass
        };
        const response = (await fetchWithTimeout(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" }, // Apps Script loves plain text posts to avoid preflight
          body: JSON.stringify(payload)
        }).then(safeJson)) as any;

        if (response.error) throw new Error(response.error);
        if (response.user) {
          setUser(response.user);
          localStorage.setItem("sm_logged_user", JSON.stringify(response.user));
          addToast(`Sessão iniciada como ${response.user.nome}`, "sucesso");
          loadData();
          return response.user;
        }
      } else {
        // API Express
        const response = (await fetchWithTimeout(`${getApiUrl()}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            username: cleanUser, 
            tipo: resolvedTipo, 
            nome: resolvedNome,
            password: cleanPass
          })
        }).then(safeJson)) as any;

        if (response.error) throw new Error(response.error);
        if (response.user) {
          setUser(response.user);
          localStorage.setItem("sm_logged_user", JSON.stringify(response.user));
          addToast(`Sessão iniciada como ${response.user.nome}`, "sucesso");
          loadData();
          return response.user;
        }
      }
    } catch (err: any) {
      addToast(`Falha no login: ${err.message || "Erro de conexão"}`, "erro");
    } finally {
      setLoading(false);
    }
    return null;
  };

  // Logout action handler
  const logout = () => {
    if (user) {
      const uName = user.nome || user.usuario;
      localStorage.removeItem("sm_logged_user");
      setUser(null);
      addToast(`Sessão de ${uName} encerrada.`, "info");
    }
  };

  // Create request handler
  const criarChamado = async (
    paciente: string, 
    origem: string, 
    destino: string, 
    prioridade: PrioridadeChamado, 
    observacao: string
  ) => {
    try {
      const solicitanteName = user ? (user.nome || user.usuario) : "Enf. Anônima";
      
      if (isGoogleSheets && appsScriptUrl) {
        const payload = {
          action: "novo_chamado",
          paciente,
          origem,
          destino,
          prioridade,
          observacao,
          solicitante: solicitanteName
        };

        const res = (await fetchWithTimeout(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        }).then(safeJson)) as any;

        if (res.error) throw new Error(res.error);
        
        addToast(`Chamado registrado com sucesso para ${paciente}!`, "sucesso");
        loadData();
        return res;
      } else {
        const res = (await fetchWithTimeout(`${getApiUrl()}/api/chamados`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paciente,
            origem,
            destino,
            prioridade,
            observacao,
            solicitante: solicitanteName
          })
        }).then(safeJson)) as any;

        addToast(`Chamado registrado com sucesso para ${paciente}!`, "sucesso");
        loadData();
        return res;
      }
    } catch (err: any) {
      console.error(err);
      addToast(`Erro ao criar chamado: ${err.message || "Servidor offline"}`, "erro");
      return null;
    }
  };

  // Update status handler
  const atualizarStatus = async (id: string, novoStatus: StatusChamado) => {
    try {
      const maqueiroName = user && user.tipo === "Maqueiro" ? (user.nome || user.usuario) : "Maqueiro";
      const userOperator = user ? (user.nome || user.usuario) : "Sistema";

      if (isGoogleSheets && appsScriptUrl) {
        const payload = {
          action: "atualizar_status",
          id,
          status: novoStatus,
          maqueiro: maqueiroName,
          solicitante: userOperator
        };

        const res = (await fetchWithTimeout(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        }).then(safeJson)) as any;

        if (res.error) throw new Error(res.error);
        
        loadData();
        return true;
      } else {
        const res = (await fetchWithTimeout(`${getApiUrl()}/api/chamados/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: novoStatus,
            maqueiro: maqueiroName,
            solicitante: userOperator
          })
        }).then(safeJson)) as any;

        loadData();
        return true;
      }
    } catch (err: any) {
      console.error(err);
      addToast(`Erro ao atualizar status: ${err.message || "Conexão perdida"}`, "erro");
      return false;
    }
  };

  // Reset local state (For demo ease)
  const resetLocalDemo = async () => {
    if (isGoogleSheets) {
      addToast("Operação disponível apenas no Modo Local", "erro");
      return;
    }
    try {
      await fetchWithTimeout(`${getApiUrl()}/api/reset`, { method: "POST" });
      addToast("Simulação reiniciada para os padrões!", "sucesso");
      loadData();
    } catch (err) {
      addToast("Erro ao reiniciar simulação.", "erro");
    }
  };

  const criarUsuario = async (username: string, tipo: Usuario['tipo'], nome: string) => {
    setLoading(true);
    try {
      const formattedUsername = username.trim().toLowerCase();
      if (isGoogleSheets && appsScriptUrl) {
        const payload = {
          action: "criar_usuario",
          username: formattedUsername,
          tipo,
          nome: nome.trim()
        };
        const response = (await fetchWithTimeout(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        }).then(safeJson)) as any;

        if (response.error) {
          throw new Error(response.error);
        }
        addToast(`Usuário ${nome} criado com sucesso no Sheets!`, "sucesso");
        await loadData();
        return response.user;
      } else {
        const response = (await fetchWithTimeout(`${getApiUrl()}/api/usuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: formattedUsername, tipo, nome: nome.trim() })
        }).then(safeJson)) as any;

        if (response.error) {
          throw new Error(response.error);
        }
        addToast(`Usuário ${nome} cadastrado com sucesso!`, "sucesso");
        await loadData();
        return response.user;
      }
    } catch (err: any) {
      addToast(`Erro ao criar usuário: ${err.message || "Erro de conexão"}`, "erro");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const criarLocal = async (nome: string, tipo: 'Origem' | 'Destino') => {
    setLoading(true);
    try {
      const formattedNome = nome.trim();
      if (!formattedNome) {
        addToast("O nome do local é obrigatório.", "erro");
        return null;
      }
      if (isGoogleSheets && appsScriptUrl) {
        const payload = {
          action: "criar_local",
          nome: formattedNome,
          tipo
        };
        const response = (await fetchWithTimeout(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        }).then(safeJson)) as any;

        if (response.error) {
          throw new Error(response.error);
        }
        addToast(`Setor '${formattedNome}' (${tipo}) cadastrado com sucesso no Sheets!`, "sucesso");
        await loadData();
        return response.local;
      } else {
        const response = (await fetchWithTimeout(`${getApiUrl()}/api/locais`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome: formattedNome, tipo })
        }).then(safeJson)) as any;

        if (response.error) {
          throw new Error(response.error);
        }
        addToast(`Setor '${formattedNome}' (${tipo}) cadastrado com sucesso!`, "sucesso");
        await loadData();
        return response.local;
      }
    } catch (err: any) {
      addToast(`Erro ao cadastrar setor: ${err.message || "Erro de conexão"}`, "erro");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    chamados,
    logs,
    stats,
    allUsers,
    locais,
    usuariosOnline,
    usuariosOnlineCount,
    loading,
    error,
    user,
    toasts,
    isGoogleSheets,
    appsScriptUrl,
    activeRole: user?.tipo || null,
    
    login,
    logout,
    criarChamado,
    atualizarStatus,
    saveIntegrationConfig,
    criarUsuario,
    criarLocal,
    recarregar: () => loadData(),
    resetLocalDemo
  };
}
