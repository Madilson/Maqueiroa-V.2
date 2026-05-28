# SmartMaqueiro 🏥 - Sistema Inteligente de Despacho de Maqueiros

O **SmartMaqueiro** é um sistema completo, moderno e de alta densidade para gestão e solicitação de maqueiros hospitalares em tempo real. Projetado para otimizar fluxos de transporte de pacientes em ambientes de saúde de alta criticidade, ele permite a colaboração instantânea entre equipes de Enfermagem, Maqueiros e Administração Geral.

Este projeto suporta tanto simulação de banco de dados em memória local (API Express contêinerizada rodando na porta 3000) quanto integração em tempo real de nível de produção com planilhas corporativas via **Google Sheets** e **Google Apps Script**.

---

## 🚀 Funcionalidades Principais

1. **Login Rápido de Simulação**
   * Perfis pré-definidos com 1 clique para simulação fácil: **Admin**, **Enfermagem** (Márcia, Thiago) e **Maqueiros** (João, Pedro).
   * Sessão limpa e segura persistida em `localStorage`.

2. **Área da Enfermagem 🩺**
   * Criação simplificada de solicitações de transporte de pacientes.
   * Campos detalhados: Nome do Paciente, Origem Hospitalar, Destino Hospitalar, Prioridade e Observações Médicas Especiais (ex: torpedo de oxigênio de transporte, dreno, isolamento respiratório).
   * Visualização da fila em tempo real com opção de cancelamento de chamados não iniciados.

3. **Painel do Maqueiro 🛏️**
   * Lista unificada de chamados com atualização reativa a cada 5 segundos.
   * Fluxo interativo de ação:
     * **Aceitar Chamado:** Reserva o chamado para si.
     * **Iniciar Transporte:** Altera o status para "Em Transporte/Em Curso" e registra a hora de partida.
     * **Finalizar Chamado:** Conclui o percurso, libera o maqueiro e calcula a métrica de tempo de atendimento automaticamente.

4. **Painel do Administrador (Dashboard) 👑**
   * **Métricas Operacionais:** Tempo médio de atendimento em minutos, volume de solicitações, quantidade de maqueiros ativos e detalhamento estatístico de filas.
   * **Indicadores Visuais:** Distribuição por prioridades do transporte hospitalar (Baixa, Média, Alta, Emergência), ranking com leaderboard de corridas de maqueiros, e hotspots geográficos dos setores mais demandados.
   * **Visualização de Auditoria:** Monitoramento de logs em tempo real com registro de auditoria detalhado das ações do sistema.

5. **Experiência Multi-Sensorial Hospitalar 🔊**
   * Notificações visuais flutuantes em tempo de execução (Toasts).
   * Alertas sonoros sintetizados nativos via **Web Audio API** (sem dependência de arquivos de áudio externos):
     * **Chamado Geral:** Campainha de chamada clássica harmonizada.
     * **Emergência:** Sirene oscilante de aviso rápido.
     * **Conclusão:** Chime harmônico de sucesso.

---

## 🛠️ Tecnologias Utilizadas

* **React 19** & **TypeScript 5**
* **Tailwind CSS v4** (Design "High Density", cores corporativas de saúde, tipografia nítida e alta densidade de informação)
* **Express & Node.js** (Servidor de retaguarda e proxy estático local)
* **Google Apps Script** (Ponte API reativa)
* **Google Sheets** (Banco de dados na nuvem transparente e gratuito)
* **Lucide React** (Ícones hospitalares)

---

## 📋 Configuração e Banco de Dados (Google Sheets)

O sistema SmartMaqueiro pode ler e escrever diretamente em uma planilha do Google Sheets. Siga estas etapas para configurar:

### Passo 1: Preparar a Planilha do Google
1. Crie uma planilha em branco no seu Google Drive com o nome **Planilha SmartMaqueiro**.
2. Crie **3 abas** com os nomes exatos:
   * `chamados`
   * `usuarios`
   * `logs`
3. Na aba **chamados**, coloque a seguinte linha de cabeçalho na linha 1 (células `A1` até `M1`):
   ```text
   id | paciente | origem | destino | prioridade | observacao | status | solicitante | maqueiro | criadoEm | aceitoEm | iniciadoEm | finalizadoEm
   ```
4. Na aba **usuarios**, coloque a seguinte linha de cabeçalho na linha 1 (células `A1` até `D1`):
   ```text
   id | usuario | nome | tipo
   ```
   *Você pode adicionar usuários iniciais a partir da linha 2, por exemplo:*
   * `U-1` | `marcia` | `Enf. Márcia Rocha` | `Enfermagem`
   * `U-2` | `joao` | `Maqueiro João Silva` | `Maqueiro`
   * `U-3` | `admin` | `Dr. Geraldo Fontes` | `Admin`
5. Na aba **logs**, coloque a seguinte linha de cabeçalho na linha 1 (células `A1` até `E1`):
   ```text
   id | data | tipo | descricao | usuario
   ```

### Passo 2: Implementar o Google Apps Script
1. Na sua planilha, clique em **Extensões** &gt; **Apps Script**.
2. Cole o código completo que você encontra dentro do aplicativo SmartMaqueiro na aba **"Tutorial Google Sheets"**. (Este código contém os endpoints `doGet` e `doPost` configurados).
3. Salve o projeto do script.
4. Clique em **Implantar** (botão azul) &gt; **Nova implantação**.
5. Clique no ícone de engrenagem e selecione **App da Web** (Web App).
6. Configure exatamente assim:
   * **Executar como:** *Você (seu e-mail)*
   * **Quem tem acesso:** *Qualquer pessoa (Anyone)*
7. Clique em **Implantar**. (Talvez o Google peça permissões de acesso aos dados, clique em "Avançado" e dê permissão).
8. Copie a **URL do App da Web** gerada pelo assistente (ela termina com `/exec`).

### Passo 3: Ativar no Aplicativo
1. Abra a tela principal do **SmartMaqueiro**.
2. No canto superior direito, clique na sua iniciais/avatar do perfil para abrir as **Configurações**.
3. Selecione a opção **"Google Sheets Integrado"**.
4. Cole a URL do aplicativo da web no campo disponibilizado.
5. Clique em **Salvar Configurações**. O status no cabeçalho mudará para **"SHEETS: CONECTADO"** e as atualizações agora serão persistidas na sua planilha em tempo real!

---

## 🚀 Como Executar o Projeto Localmente

### Dependências
Para executar o projeto, instale as dependências:
```bash
npm install
```

### Modo de Desenvolvimento
O aplicativo monta o servidor Express local na porta 3000 em conjunto com o compilador reativo para o front-end:
```bash
npm run dev
```

### Compilar para Produção (Deploy na Vercel ou VPS)
Isto compilará os arquivos estáticos para a pasta `dist` e preparará o script do servidor unificado:
```bash
npm run build
```

Depois, para rodar em produção:
```bash
npm start
```

---

## ⚙️ Variáveis de Ambiente (`.env`)

Renomeie `.env.example` para `.env` e configure conforme necessário:
```env
# URL do Apps Script para carregar por padrão
VITE_APPS_SCRIPT_URL="https://script.google.com/macros/s/.../exec"

# Porta do servidor
PORT=3000
```
