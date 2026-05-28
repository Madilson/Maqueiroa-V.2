/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const GOOGLE_APPS_SCRIPT_CODE = `// ==========================================
// SMARTMAQUEIRO - API REST GOOGLE SHEETS
// ==========================================

// ==========================================
// CONFIGURAÇÃO
// ==========================================

// Cole aqui o ID da sua planilha
const SPREADSHEET_ID = "1zUeuM5QGFr01VAfhPM60eZw1RD1Z_wsr_TA6MzV6Nj4";

// ==========================================
// ABRIR PLANILHA
// ==========================================

function getSheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "COLOQUE_AQUI_O_ID_DA_SUA_PLANILHA") {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      return SpreadsheetApp.getActiveSpreadsheet();
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ==========================================
// GET API
// ==========================================

function doGet(e) {

  var action = (e && e.parameter && e.parameter.action)
    ? e.parameter.action
    : "chamados";

  var sheet = getSheet();

  try {

    // ======================================
    // CHAMADOS
    // ======================================

    if (action === "chamados") {

      var chamadosSheet = sheet.getSheetByName("chamados");

      if (!chamadosSheet) {
        return createJsonResponse({
          error: "Aba 'chamados' não encontrada"
        });
      }

      var data = chamadosSheet.getDataRange().getValues();

      if (data.length <= 1) {
        return createJsonResponse([]);
      }

      var headers = data[0];
      var list = [];

      for (var i = 1; i < data.length; i++) {

        var row = data[i];
        var item = {};

        for (var j = 0; j < headers.length; j++) {
          item[headers[j]] = row[j];
        }

        list.push(item);
      }

      // Ordena pelos mais recentes
      list.sort(function(a, b) {

        return (
          new Date(b.criadoEm || "1970-01-01").getTime() -
          new Date(a.criadoEm || "1970-01-01").getTime()
        );

      });

      return createJsonResponse(list);
    }

    // ======================================
    // LOGS
    // ======================================

    if (action === "logs") {

      var logsSheet = sheet.getSheetByName("logs");

      if (!logsSheet) {
        return createJsonResponse({
          error: "Aba 'logs' não encontrada"
        });
      }

      var logsData = logsSheet.getDataRange().getValues();

      if (logsData.length <= 1) {
        return createJsonResponse([]);
      }

      var logsHeaders = logsData[0];
      var logsList = [];

      for (var l = 1; l < logsData.length; l++) {

        var logsRow = logsData[l];
        var logsItem = {};

        for (var lj = 0; lj < logsHeaders.length; lj++) {
          logsItem[logsHeaders[lj]] = logsRow[lj];
        }

        logsList.push(logsItem);
      }

      logsList.reverse();

      return createJsonResponse(logsList);
    }

    // ======================================
    // USUÁRIOS
    // ======================================

    if (action === "usuarios") {

      var usuariosSheet = sheet.getSheetByName("usuarios");

      if (!usuariosSheet) {
        return createJsonResponse({
          error: "Aba 'usuarios' não encontrada"
        });
      }

      var usuariosData = usuariosSheet.getDataRange().getValues();

      if (usuariosData.length <= 1) {
        return createJsonResponse([]);
      }

      var usuariosHeaders = usuariosData[0];
      var usuariosList = [];

      for (var u = 1; u < usuariosData.length; u++) {

        var usuariosRow = usuariosData[u];
        var usuariosItem = {};

        for (var uj = 0; uj < usuariosHeaders.length; uj++) {
          usuariosItem[usuariosHeaders[uj]] = usuariosRow[uj];
        }

        usuariosList.push(usuariosItem);
      }

      return createJsonResponse(usuariosList);
    }

    // ======================================
    // LOCAIS (ORIGEM E DESTINO)
    // ======================================

    if (action === "locais") {

      var locaisSheet = sheet.getSheetByName("locais");

      if (!locaisSheet) {
        return createJsonResponse({
          error: "Aba 'locais' não encontrada"
        });
      }

      var locaisData = locaisSheet.getDataRange().getValues();

      if (locaisData.length <= 1) {
        return createJsonResponse([]);
      }

      var locaisHeaders = locaisData[0];
      var locaisList = [];

      for (var l = 1; l < locaisData.length; l++) {

        var locaisRow = locaisData[l];
        var locaisItem = {};

        for (var lj = 0; lj < locaisHeaders.length; lj++) {
          locaisItem[locaisHeaders[lj]] = locaisRow[lj];
        }

        locaisList.push(locaisItem);
      }

      return createJsonResponse(locaisList);
    }

    // ======================================
    // AÇÃO INVÁLIDA
    // ======================================

    return createJsonResponse({
      error: "Ação inválida"
    });

  } catch(error) {

    return createJsonResponse({
      error: error.toString()
    });

  }
}

// ==========================================
// POST API
// ==========================================

function doPost(e) {

  var sheet = getSheet();

  try {

    // Verifica body
    if (!e || !e.postData || !e.postData.contents) {

      return createJsonResponse({
        error: "Body JSON não enviado"
      });

    }

    var rawBody = e.postData.contents;

    var data;

    try {

      data = JSON.parse(rawBody);

    } catch(parseError) {

      return createJsonResponse({
        error: "JSON inválido"
      });

    }

    var action = data.action;

    // ======================================
    // LOGIN
    // ======================================

    if (action === "login") {

      var username = data.username;
      var tipo = data.tipo;
      var nome = data.nome || username;

      var usrSheet = sheet.getSheetByName("usuarios");

      if (!usrSheet) {

        usrSheet = sheet.insertSheet("usuarios");

        usrSheet.appendRow([
          "id",
          "usuario",
          "nome",
          "tipo"
        ]);
      }

      var usersData = usrSheet.getDataRange().getValues();

      var foundUser = null;

      for (var i = 1; i < usersData.length; i++) {

        if (
          usersData[i][1] === username &&
          usersData[i][3] === tipo
        ) {

          foundUser = {
            id: usersData[i][0],
            usuario: usersData[i][1],
            nome: usersData[i][2],
            tipo: usersData[i][3]
          };

          break;
        }
      }

      // Cria usuário automaticamente
      if (!foundUser) {

        var newId = "U-" + Math.floor(Math.random() * 10000);

        usrSheet.appendRow([
          newId,
          username,
          nome,
          tipo
        ]);

        foundUser = {
          id: newId,
          usuario: username,
          nome: nome,
          tipo: tipo
        };
      }

      writeLog(
        "INFO",
        "Usuário '" + nome + "' logou no sistema.",
        nome
      );

      return createJsonResponse({
        success: true,
        user: foundUser
      });
    }

    // ======================================
    // CRIAR USUÁRIO
    // ======================================

    if (action === "criar_usuario") {

      var username = data.username;
      var tipo = data.tipo;
      var nome = data.nome || username;

      var usrSheet = sheet.getSheetByName("usuarios");

      if (!usrSheet) {

        usrSheet = sheet.insertSheet("usuarios");

        usrSheet.appendRow([
          "id",
          "usuario",
          "nome",
          "tipo"
        ]);
      }

      var usersData = usrSheet.getDataRange().getValues();

      var found = false;

      for (var i = 1; i < usersData.length; i++) {

        if (usersData[i][1] === username) {

          found = true;

          break;
        }
      }

      if (found) {

        return createJsonResponse({
          error: "Este nome de usuário já está cadastrado."
        });

      }

      var newId = "U-" + Math.floor(Math.random() * 10000);

      usrSheet.appendRow([
        newId,
        username,
        nome,
        tipo
      ]);

      var userObj = {
        id: newId,
        usuario: username,
        nome: nome,
        tipo: tipo
      };

      writeLog(
        "INFO",
        "Novo usuário " + nome + " (" + tipo + ") criado pelo Administrador.",
        "Admin"
      );

      return createJsonResponse({
        success: true,
        user: userObj
      });
    }

    // ======================================
    // CADASTRAR LOCAL (ORIGEM / DESTINO)
    // ======================================

    if (action === "criar_local") {

      var nomeLocal = data.nome;
      var tipoLocal = data.tipo || "Origem"; // default to Origem

      if (!nomeLocal) {
        return createJsonResponse({
          error: "O nome do local é obrigatório."
        });
      }

      var locaisSheet = sheet.getSheetByName("locais");

      if (!locaisSheet) {

        locaisSheet = sheet.insertSheet("locais");

        locaisSheet.appendRow([
          "id",
          "nome",
          "tipo"
        ]);
      }

      var locaisData = locaisSheet.getDataRange().getValues();

      var foundLocal = false;

      for (var i = 1; i < locaisData.length; i++) {
        // Find duplicate for both name and tipo
        var rowName = locaisData[i][1] ? locaisData[i][1].toString().toLowerCase() : "";
        var rowType = locaisData[i][2] ? locaisData[i][2].toString().toLowerCase() : "";
        if (rowName === nomeLocal.toString().toLowerCase() && rowType === tipoLocal.toString().toLowerCase()) {

          foundLocal = true;

          break;
        }
      }

      if (foundLocal) {

        return createJsonResponse({
          error: "Este local já está cadastrado para este tipo (" + tipoLocal + ")."
        });

      }

      var newLocalId = "LC-" + Math.floor(Math.random() * 10000);

      locaisSheet.appendRow([
        newLocalId,
        nomeLocal,
        tipoLocal
      ]);

      var localObj = {
        id: newLocalId,
        nome: nomeLocal,
        tipo: tipoLocal
      };

      writeLog(
        "INFO",
        "Novo setor '" + nomeLocal + "' (Tipo: " + tipoLocal + ") cadastrado pelo Administrador.",
        "Admin"
      );

      return createJsonResponse({
        success: true,
        local: localObj
      });
    }

    // ======================================
    // NOVO CHAMADO
    // ======================================

    if (action === "novo_chamado") {

      var chamadosSheet = sheet.getSheetByName("chamados");

      if (!chamadosSheet) {

        return createJsonResponse({
          error: "Aba 'chamados' não encontrada"
        });
      }

      var idNum = 1000 + chamadosSheet.getLastRow();

      var novoId = "CH-" + idNum;

      var paciente = data.paciente || "";
      var origem = data.origem || "";
      var destino = data.destino || "";

      var prioridade = data.prioridade || "Media";

      var observacao = data.observacao || "";

      var solicitante = data.solicitante || "Enfermagem";

      var status = "Aguardando";

      var criadoEm = new Date().toISOString();

      chamadosSheet.appendRow([
        novoId,
        paciente,
        origem,
        destino,
        prioridade,
        observacao,
        status,
        solicitante,
        "",
        criadoEm,
        "",
        "",
        ""
      ]);

      writeLog(
        prioridade === "Emergência" || prioridade === "Emergencia"
          ? "ALERTA"
          : "INFO",

        "Novo chamado " + novoId,

        solicitante
      );

      return createJsonResponse({
        success: true,
        id: novoId
      });
    }

    // ======================================
    // ATUALIZAR STATUS
    // ======================================

    if (action === "atualizar_status") {

      var chamadosSheet2 = sheet.getSheetByName("chamados");

      if (!chamadosSheet2) {

        return createJsonResponse({
          error: "Aba 'chamados' não encontrada"
        });
      }

      var id = data.id;

      var statusAtual = data.status;

      var maqueiro = data.maqueiro || "";

      var rows = chamadosSheet2.getDataRange().getValues();

      var targetRowIndex = -1;

      for (var r = 1; r < rows.length; r++) {

        if (rows[r][0] === id) {

          targetRowIndex = r + 1;

          break;
        }
      }

      if (targetRowIndex === -1) {

        return createJsonResponse({
          error: "Chamado não encontrado"
        });
      }

      var nowStr = new Date().toISOString();

      // STATUS
      chamadosSheet2
        .getRange(targetRowIndex, 7)
        .setValue(statusAtual);

      // MAQUEIRO
      if (maqueiro) {

        chamadosSheet2
          .getRange(targetRowIndex, 9)
          .setValue(maqueiro);
      }

      // DATAS
      if (statusAtual === "Aceito") {

        chamadosSheet2
          .getRange(targetRowIndex, 11)
          .setValue(nowStr);

      } else if (statusAtual === "Em_Transporte") {

        chamadosSheet2
          .getRange(targetRowIndex, 12)
          .setValue(nowStr);

      } else if (statusAtual === "Finalizado") {

        chamadosSheet2
          .getRange(targetRowIndex, 13)
          .setValue(nowStr);
      }

      writeLog(
        "AÇÃO",
        "Chamado " + id + " atualizado para " + statusAtual,
        maqueiro || "Sistema"
      );

      return createJsonResponse({
        success: true,
        id: id,
        status: statusAtual
      });
    }

    return createJsonResponse({
      error: "Ação POST inválida"
    });

  } catch(err) {

    return createJsonResponse({
      error: err.toString()
    });

  }
}

// ==========================================
// JSON RESPONSE
// ==========================================

function createJsonResponse(obj) {

  var output = ContentService.createTextOutput(
    JSON.stringify(obj)
  );

  output.setMimeType(
    ContentService.MimeType.JSON
  );

  return output;
}

// ==========================================
// LOGS
// ==========================================

function writeLog(tipo, descricao, usuario) {

  try {

    var sheet = getSheet();

    var logsSheet = sheet.getSheetByName("logs");

    if (!logsSheet) {

      logsSheet = sheet.insertSheet("logs");

      logsSheet.appendRow([
        "id",
        "data",
        "tipo",
        "descricao",
        "usuario"
      ]);
    }

    var logId = "L-" + Math.floor(Math.random() * 100000);

    logsSheet.appendRow([
      logId,
      new Date().toISOString(),
      tipo,
      descricao,
      usuario
    ]);

  } catch(e) {

    Logger.log(e);

  }
}
`;
