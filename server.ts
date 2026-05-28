import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Chamado, StatusChamado, PrioridadeChamado, SystemLog, DashboardStats, Usuario, Local } from "./src/types";

// In-Memory Database for preview and local execution
let chamados: Chamado[] = [
  {
    id: "CH-1001",
    paciente: "Manoel de Souza Santos",
    origem: "Quarto 104",
    destino: "Radiologia (Raio-X)",
    prioridade: "Alta",
    observacao: "Paciente necessita de monitoramento de oxigênio de transporte (torpedo O2).",
    status: "Aguardando",
    solicitante: "Enf. Márcia Rocha",
    criadoEm: new Date(Date.now() - 4 * 60 * 1000).toISOString() // 4 mins ago
  },
  {
    id: "CH-1002",
    paciente: "Francisca das Chagas Lima",
    origem: "Pronto Socorro - Box 02",
    destino: "UTI Geral (Leito 08)",
    prioridade: "Emergencia",
    observacao: "Isolamento respiratório por precaução de contato. Máscara N95.",
    status: "Aceito",
    solicitante: "Enf. Thiago Costa",
    maqueiro: "Maqueiro João Silva",
    criadoEm: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    aceitoEm: new Date(Date.now() - 12 * 60 * 1000).toISOString()
  },
  {
    id: "CH-1003",
    paciente: "Carlos Daniel Albuquerque",
    origem: "Quarto 203 - Ala B",
    destino: "Centro de Tomografia",
    prioridade: "Media",
    observacao: "Paciente com dreno abdominal. Transporte em maca com grades de segurança elevadas.",
    status: "Em_Transporte",
    solicitante: "Enf. Patrícia Mendes",
    maqueiro: "Maqueiro Pedro Santos",
    criadoEm: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    aceitoEm: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    iniciadoEm: new Date(Date.now() - 18 * 60 * 1000).toISOString()
  },
  {
    id: "CH-1004",
    paciente: "Juliana Cardoso Alencar",
    origem: "Unidade de Internação 3º Andar",
    destino: "Centro Cirúrgico (Sala 04)",
    prioridade: "Alta",
    observacao: "Paciente em jejum. Pulseira de identificação e prontuário em mãos.",
    status: "Finalizado",
    solicitante: "Enf. Márcia Rocha",
    maqueiro: "Maqueiro João Silva",
    criadoEm: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    aceitoEm: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    iniciadoEm: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
    finalizadoEm: new Date(Date.now() - 35 * 60 * 1000).toISOString() // Took 17 mins transport
  },
  {
    id: "CH-1005",
    paciente: "Augusto Cesar de Lima",
    origem: "Pediatria - Recreação",
    destino: "Pediatria - Quarto 402",
    prioridade: "Baixa",
    observacao: "Transporte pode ser realizado em cadeira de rodas. Acompanhado pela mãe.",
    status: "Finalizado",
    solicitante: "Enf. Karine Ramos",
    maqueiro: "Maqueiro Pedro Santos",
    criadoEm: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    aceitoEm: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    iniciadoEm: new Date(Date.now() - 108 * 60 * 1000).toISOString(),
    finalizadoEm: new Date(Date.now() - 98 * 60 * 1000).toISOString() // Took 10 mins transport
  }
];

let logs: SystemLog[] = [
  {
    id: "L-1",
    data: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    tipo: "INFO",
    descricao: "Chamado CH-1005 registrado por Enf. Karine Ramos - Paciente: Augusto Cesar",
    usuario: "Enf. Karine Ramos"
  },
  {
    id: "L-2",
    data: new Date(Date.now() - 98 * 60 * 1000).toISOString(),
    tipo: "AÇÃO",
    descricao: "Chamado CH-1005 finalizado por Maqueiro Pedro Santos",
    usuario: "Maqueiro Pedro Santos"
  },
  {
    id: "L-3",
    data: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    tipo: "INFO",
    descricao: "Chamado CH-1004 registrado por Enf. Márcia Rocha - Paciente: Juliana Cardoso",
    usuario: "Enf. Márcia Rocha"
  },
  {
    id: "L-4",
    data: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    tipo: "AÇÃO",
    descricao: "Chamado CH-1004 concluído com sucesso. Origem: U.Internação -> Destino: Centro Cirúrgico",
    usuario: "Maqueiro João Silva"
  },
  {
    id: "L-5",
    data: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    tipo: "INFO",
    descricao: "Novo chamado urgente CH-1003 registrado de Quarto 203 para Tomografia",
    usuario: "Enf. Patrícia Mendes"
  },
  {
    id: "L-6",
    data: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    tipo: "ALERTA",
    descricao: "CHAMADO DE EMERGÊNCIA CH-1002 registrado: Pronto Socorro -> UTI Geral",
    usuario: "Enf. Thiago Costa"
  },
  {
    id: "L-7",
    data: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    tipo: "INFO",
    descricao: "Novo chamado urgente CH-1001 registrado de Quarto 104 para Radiologia",
    usuario: "Enf. Márcia Rocha"
  }
];

let usuariosOnline = new Set<string>(["Enf. Márcia Rocha", "Enf. Thiago Costa", "Maqueiro João Silva", "Maqueiro Pedro Santos", "Dr. Geraldo (Admin)"]);

let usuarios: Usuario[] = [
  { id: "U-1", usuario: "admin", nome: "Dr. Geraldo Fontes", tipo: "Admin" },
  { id: "U-2", usuario: "marcia", nome: "Enf. Márcia Rocha", tipo: "Enfermagem" },
  { id: "U-3", usuario: "thiago", nome: "Enf. Thiago Costa", tipo: "Enfermagem" },
  { id: "U-4", usuario: "joao", nome: "Maqueiro João Silva", tipo: "Maqueiro" },
  { id: "U-5", usuario: "pedro", nome: "Maqueiro Pedro Santos", tipo: "Maqueiro" }
];

let locais: Local[] = [
  { id: "LC-1", nome: "Pronto Socorro - Triagem", tipo: "Origem" },
  { id: "LC-2", nome: "Pronto Socorro - Box 01", tipo: "Origem" },
  { id: "LC-3", nome: "Pronto Socorro - Box 02", tipo: "Origem" },
  { id: "LC-4", nome: "Pronto Socorro - Choque", tipo: "Origem" },
  { id: "LC-5", nome: "Recepção Principal", tipo: "Origem" },
  { id: "LC-6", nome: "Quarto 101 (Ala A)", tipo: "Origem" },
  { id: "LC-7", nome: "Quarto 104", tipo: "Destino" },
  { id: "LC-8", nome: "Quarto 203 - Ala B", tipo: "Destino" },
  { id: "LC-9", nome: "Quarto 204", tipo: "Destino" },
  { id: "LC-10", nome: "UTI Geral (Leito 08)", tipo: "Destino" },
  { id: "LC-11", nome: "UTI Coronária", tipo: "Destino" },
  { id: "LC-12", nome: "Pediatria - Recreação", tipo: "Destino" },
  { id: "LC-13", nome: "Pediatria - Quarto 402", tipo: "Destino" },
  { id: "LC-14", nome: "Radiologia (Raio-X)", tipo: "Origem" },
  { id: "LC-15", nome: "Centro de Tomografia", tipo: "Destino" },
  { id: "LC-16", nome: "Centro Cirúrgico (Sala 04)", tipo: "Destino" },
  { id: "LC-17", nome: "Ressonância Magnética", tipo: "Destino" },
  { id: "LC-18", nome: "Centro Obstétrico", tipo: "Destino" },
  { id: "LC-19", nome: "Laboratório de Análises", tipo: "Origem" },
  { id: "LC-20", nome: "Banco de Sangue", tipo: "Origem" },
  { id: "LC-21", nome: "Hemodiálise", tipo: "Destino" },
  { id: "LC-22", nome: "Fisioterapia", tipo: "Destino" },
  { id: "LC-23", nome: "Maternidade", tipo: "Destino" }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Log middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // CORS headers
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  // --- API ROUTES ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: "in-memory-db", timestamp: new Date().toISOString() });
  });

  // Reset demo state
  app.post("/api/reset", (req, res) => {
    chamados = [
      {
        id: "CH-1001",
        paciente: "Manoel de Souza Santos",
        origem: "Quarto 104",
        destino: "Radiologia (Raio-X)",
        prioridade: "Alta",
        observacao: "Paciente necessita de monitoramento de oxigênio de transporte (torpedo O2).",
        status: "Aguardando",
        solicitante: "Enf. Márcia Rocha",
        criadoEm: new Date(Date.now() - 4 * 60 * 1000).toISOString()
      },
      {
        id: "CH-1002",
        paciente: "Francisca das Chagas Lima",
        origem: "Pronto Socorro - Box 02",
        destino: "UTI Geral (Leito 08)",
        prioridade: "Emergencia",
        observacao: "Isolamento respiratório por precaução de contato. Máscara N95.",
        status: "Aceito",
        solicitante: "Enf. Thiago Costa",
        maqueiro: "Maqueiro João Silva",
        criadoEm: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        aceitoEm: new Date(Date.now() - 12 * 60 * 1000).toISOString()
      },
      {
        id: "CH-1003",
        paciente: "Carlos Daniel Albuquerque",
        origem: "Quarto 203 - Ala B",
        destino: "Centro de Tomografia",
        prioridade: "Media",
        observacao: "Paciente com dreno abdominal. Transporte em maca com grades de segurança elevadas.",
        status: "Em_Transporte",
        solicitante: "Enf. Patrícia Mendes",
        maqueiro: "Maqueiro Pedro Santos",
        criadoEm: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        aceitoEm: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        iniciadoEm: new Date(Date.now() - 18 * 60 * 1000).toISOString()
      }
    ];

    logs = [
      {
        id: "L-RST",
        data: new Date().toISOString(),
        tipo: "ALERTA",
        descricao: "Banco de dados local reiniciado para demonstração padrão",
        usuario: "Sistema"
      }
    ];
    usuarios = [
      { id: "U-1", usuario: "admin", nome: "Dr. Geraldo Fontes", tipo: "Admin" },
      { id: "U-2", usuario: "marcia", nome: "Enf. Márcia Rocha", tipo: "Enfermagem" },
      { id: "U-3", usuario: "thiago", nome: "Enf. Thiago Costa", tipo: "Enfermagem" },
      { id: "U-4", usuario: "joao", nome: "Maqueiro João Silva", tipo: "Maqueiro" },
      { id: "U-5", usuario: "pedro", nome: "Maqueiro Pedro Santos", tipo: "Maqueiro" }
    ];
    locais = [
      { id: "LC-1", nome: "Pronto Socorro - Triagem", tipo: "Origem" },
      { id: "LC-2", nome: "Pronto Socorro - Box 01", tipo: "Origem" },
      { id: "LC-3", nome: "Pronto Socorro - Box 02", tipo: "Origem" },
      { id: "LC-4", nome: "Pronto Socorro - Choque", tipo: "Origem" },
      { id: "LC-5", nome: "Recepção Principal", tipo: "Origem" },
      { id: "LC-6", nome: "Quarto 101 (Ala A)", tipo: "Origem" },
      { id: "LC-7", nome: "Quarto 104", tipo: "Destino" },
      { id: "LC-8", nome: "Quarto 203 - Ala B", tipo: "Destino" },
      { id: "LC-9", nome: "Quarto 204", tipo: "Destino" },
      { id: "LC-10", nome: "UTI Geral (Leito 08)", tipo: "Destino" },
      { id: "LC-11", nome: "UTI Coronária", tipo: "Destino" },
      { id: "LC-12", nome: "Pediatria - Recreação", tipo: "Destino" },
      { id: "LC-13", nome: "Pediatria - Quarto 402", tipo: "Destino" },
      { id: "LC-14", nome: "Radiologia (Raio-X)", tipo: "Origem" },
      { id: "LC-15", nome: "Centro de Tomografia", tipo: "Destino" },
      { id: "LC-16", nome: "Centro Cirúrgico (Sala 04)", tipo: "Destino" },
      { id: "LC-17", nome: "Ressonância Magnética", tipo: "Destino" },
      { id: "LC-18", nome: "Centro Obstétrico", tipo: "Destino" },
      { id: "LC-19", nome: "Laboratório de Análises", tipo: "Origem" },
      { id: "LC-20", nome: "Banco de Sangue", tipo: "Origem" },
      { id: "LC-21", nome: "Hemodiálise", tipo: "Destino" },
      { id: "LC-22", nome: "Fisioterapia", tipo: "Destino" },
      { id: "LC-23", nome: "Maternidade", tipo: "Destino" }
    ];
    usuariosOnline = new Set<string>(["Enf. Márcia Rocha", "Enf. Thiago Costa", "Maqueiro João Silva", "Maqueiro Pedro Santos", "Admin"]);
    res.json({ success: true, message: "Banco de dados local resetado." });
  });

  // Login handler
  app.post("/api/login", (req, res) => {
    const { username, password, nome, tipo } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: "Preencha o nome de usuário." });
    }

    const cleanUser = username.trim().toLowerCase();
    
    // Check if admin is trying to login, enforce admin password
    if (cleanUser === "admin") {
      if (password !== "admin") {
        return res.status(401).json({ error: "Senha incorreta para o administrador." });
      }
    }

    const userNameStr = nome || username;
    usuariosOnline.add(userNameStr);

    const existsInDb = usuarios.some(u => u.usuario === cleanUser && u.tipo === tipo);
    if (!existsInDb) {
      usuarios.push({
        id: "U-" + Math.floor(Math.random() * 10000),
        usuario: cleanUser,
        nome: userNameStr,
        tipo: tipo
      });
    }

    // Register active log
    const newLog: SystemLog = {
      id: "LOG-" + Math.floor(Math.random() * 100000),
      data: new Date().toISOString(),
      tipo: "INFO",
      descricao: `Usuário '${userNameStr}' efetuou login.`,
      usuario: userNameStr
    };
    logs.unshift(newLog);

    res.json({
      success: true,
      user: {
        id: "U-" + Math.floor(Math.random() * 1000),
        usuario: cleanUser,
        nome: userNameStr,
        tipo: tipo
      }
    });
  });

  // GET all users
  app.get("/api/usuarios", (req, res) => {
    res.json(usuarios);
  });

  // POST create user
  app.post("/api/usuarios", (req, res) => {
    const { username, tipo, nome } = req.body;
    if (!username || !tipo || !nome) {
      return res.status(400).json({ error: "Nome de usuário, tipo e nome por extenso são obrigatórios." });
    }
    const formattedUsername = username.trim().toLowerCase();
    const exists = usuarios.some(u => u.usuario === formattedUsername);
    if (exists) {
      return res.status(400).json({ error: "Este nome de usuário já está cadastrado." });
    }
    const nuevoUsuario: Usuario = {
      id: "U-" + Math.floor(Math.random() * 10000),
      usuario: formattedUsername,
      nome: nome.trim(),
      tipo
    };
    usuarios.push(nuevoUsuario);

    // Register log
    const newLog: SystemLog = {
      id: "LOG-" + Math.floor(Math.random() * 100000),
      data: new Date().toISOString(),
      tipo: "INFO",
      descricao: `Novo usuário '${nome.trim()}' (${tipo}) criado pelo Administrador.`,
      usuario: "Admin"
    };
    logs.unshift(newLog);

    res.status(201).json({ success: true, user: nuevoUsuario });
  });

  // GET all locations (origens and destinos)
  app.get("/api/locais", (req, res) => {
    res.json(locais);
  });

  // POST create location
  app.post("/api/locais", (req, res) => {
    const { nome, tipo } = req.body;
    if (!nome) {
      return res.status(400).json({ error: "O nome do local é obrigatório." });
    }
    const finalTipo = tipo === "Destino" ? "Destino" : "Origem";
    const formattedNome = nome.trim();
    const exists = locais.some(l => l.nome.toLowerCase() === formattedNome.toLowerCase() && l.tipo === finalTipo);
    if (exists) {
      return res.status(400).json({ error: `Este local já está cadastrado como ${finalTipo}.` });
    }
    const novoLocal: Local = {
      id: "LC-" + Math.floor(Math.random() * 10000),
      nome: formattedNome,
      tipo: finalTipo
    };
    locais.push(novoLocal);

    // Register log
    const newLog: SystemLog = {
      id: "LOG-" + Math.floor(Math.random() * 100000),
      data: new Date().toISOString(),
      tipo: "INFO",
      descricao: `Novo setor '${formattedNome}' (Tipo: ${finalTipo}) cadastrado pelo Administrador.`,
      usuario: "Admin"
    };
    logs.unshift(newLog);

    res.status(201).json({ success: true, local: novoLocal });
  });

  // GET chamados
  app.get("/api/chamados", (req, res) => {
    res.json(chamados);
  });

  // POST chamado (Create New Request)
  app.post("/api/chamados", (req, res) => {
    const { paciente, origem, destino, prioridade, observacao, solicitante } = req.body;
    
    if (!paciente || !origem || !destino) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes: paciente, origem e destino." });
    }

    const idNum = 1000 + chamados.length + 1;
    const novoChamado: Chamado = {
      id: `CH-${idNum}`,
      paciente,
      origem,
      destino,
      prioridade: prioridade || "Media",
      observacao: observacao || "",
      status: "Aguardando",
      solicitante: solicitante || "Enf. Geral",
      criadoEm: new Date().toISOString()
    };

    chamados.unshift(novoChamado); // Add to the top of the queue

    // Add Log
    const newLog: SystemLog = {
      id: "LOG-" + Math.floor(Math.random() * 100000),
      data: new Date().toISOString(),
      tipo: prioridade === "Emergencia" ? "ALERTA" : "INFO",
      descricao: `Solicitado transporte para ${paciente} (${origem} -> ${destino}) [Prio: ${prioridade}]`,
      usuario: solicitante || "Enf. Geral"
    };
    logs.unshift(newLog);

    res.status(201).json(novoChamado);
  });

  // PUT atualizar status do chamado
  app.put("/api/chamados/:id", (req, res) => {
    const { id } = req.params;
    const { status, maqueiro, solicitante } = req.body;

    const idx = chamados.findIndex(c => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: `Chamado com id ${id} não encontrado.` });
    }

    const chamado = chamados[idx];
    const timestampStr = new Date().toISOString();
    
    // Status Logic transition
    if (status) {
      chamado.status = status as StatusChamado;
      if (status === "Aceito") {
        chamado.aceitoEm = timestampStr;
        if (maqueiro) chamado.maqueiro = maqueiro;
      } else if (status === "Em_Transporte") {
        chamado.iniciadoEm = timestampStr;
      } else if (status === "Finalizado") {
        chamado.finalizadoEm = timestampStr;
      }
    }

    if (maqueiro && !chamado.maqueiro) {
      chamado.maqueiro = maqueiro;
    }

    // Register Log
    const operator = maqueiro || solicitante || "Sistema";
    const newLog: SystemLog = {
      id: "LOG-" + Math.floor(Math.random() * 100000),
      data: timestampStr,
      tipo: "AÇÃO",
      descricao: `Chamado ${id} alterado para status '${status}' por ${operator}`,
      usuario: operator
    };
    logs.unshift(newLog);

    res.json(chamado);
  });

  // GET logs
  app.get("/api/logs", (req, res) => {
    res.json(logs);
  });

  // GET stats (Dashboard)
  app.get("/api/stats", (req, res) => {
    let finalizados = chamados.filter(c => c.status === "Finalizado");
    
    // Avg service time (Minutes from criadoEm to finalizadoEm)
    let totalTimeMin = 0;
    let countsTime = 0;
    finalizados.forEach(c => {
      if (c.criadoEm && c.finalizadoEm) {
        const diffMs = new Date(c.finalizadoEm).getTime() - new Date(c.criadoEm).getTime();
        const diffMin = diffMs / (1000 * 60);
        totalTimeMin += diffMin;
        countsTime++;
      }
    });

    const tempoMedio = countsTime > 0 ? parseFloat((totalTimeMin / countsTime).toFixed(1)) : 12.5;

    // Split by priority
    const porPrioridade = { Baixa: 0, Media: 0, Alta: 0, Emergencia: 0 };
    // Split by origin, destination
    const porOrigem: Record<string, number> = {};
    const porDestino: Record<string, number> = {};
    // Split by runner
    const corridasMaqueiro: Record<string, number> = {};

    chamados.forEach(c => {
      if (c.prioridade in porPrioridade) {
        porPrioridade[c.prioridade]++;
      }
      porOrigem[c.origem] = (porOrigem[c.origem] || 0) + 1;
      porDestino[c.destino] = (porDestino[c.destino] || 0) + 1;
      
      if (c.maqueiro && c.status === "Finalizado") {
        corridasMaqueiro[c.maqueiro] = (corridasMaqueiro[c.maqueiro] || 0) + 1;
      }
    });

    const stats: DashboardStats = {
      totalCount: chamados.length,
      aguardandoCount: chamados.filter(c => c.status === "Aguardando").length,
      emTransporteCount: chamados.filter(c => c.status === "Em_Transporte" || c.status === "Aceito").length,
      finalizadosCount: finalizados.length,
      canceladosCount: chamados.filter(c => c.status === "Cancelado").length,
      tempoMedioAtendimento: tempoMedio,
      porPrioridade,
      porOrigem,
      porDestino,
      corridasMaqueiro
    };

    res.json({
      stats,
      usuariosOnlineCount: usuariosOnline.size,
      usuariosOnline: Array.from(usuariosOnline)
    });
  });

  // --- VITE MIDDLEWARE FOR DEVELOPMENT OR PRODUCTION STATIC SERVING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SmartMaqueiro server boot complete. Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
