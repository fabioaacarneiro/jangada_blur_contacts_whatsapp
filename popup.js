// Blur de Contatos para WhatsApp: a janelinha do botão na barra da Jangada.
//
// Lê e grava as mesmas escolhas do script da página (a chave "config" do storage). O
// script do WhatsApp recebe a mudança na hora (storage.onChanged) e aplica, em todas as
// abas dele. "Escolher na tela" e "Limpar" vão por mensagem para a aba aberta.
(function () {
  "use strict";

  var api = window.jangada || window.chrome;
  var PADRAO = {
    ativo: true, nomes: true, fotos: true, previas: true, mensagens: true, midia: true,
    digitando: false, intensidade: 8, revelar: true, mostrarBotao: false,
    botao: { direita: 24, baixo: 96 }, versao: 2
  };
  var config = JSON.parse(JSON.stringify(PADRAO));
  var abaDoWhatsApp = null;

  function t(nome, subs) {
    return api.i18n.getMessage(nome, subs) || nome;
  }

  document.querySelectorAll("[data-t]").forEach(function (el) {
    el.textContent = t(el.getAttribute("data-t"));
  });
  document.documentElement.lang = api.i18n.getUILanguage();

  var campos = document.querySelectorAll("[data-chave]");

  function mostrar() {
    campos.forEach(function (c) {
      var k = c.getAttribute("data-chave");
      if (c.type === "checkbox") c.checked = !!config[k];
      else c.value = config[k];
    });
    document.getElementById("px").textContent = config.intensidade + "px";
    document.getElementById("opcoes").disabled = !config.ativo;
  }

  function guardar() {
    api.storage.local.set({ config: config });
  }

  campos.forEach(function (c) {
    c.addEventListener(c.type === "range" ? "input" : "change", function () {
      var k = c.getAttribute("data-chave");
      config[k] = c.type === "checkbox" ? c.checked : Number(c.value);
      mostrar();
      guardar();
    });
  });

  api.storage.local.get({ config: PADRAO }).then(function (d) {
    var g = (d && d.config) || {};
    Object.keys(PADRAO).forEach(function (k) {
      if (g[k] !== undefined) config[k] = g[k];
    });
    mostrar();
  });

  // A aba aberta é do WhatsApp? (A extensão só entra lá, então só lá pode escolher na tela.)
  function nota(texto) {
    var p = document.getElementById("nota");
    p.hidden = !texto;
    p.textContent = texto || "";
  }

  function estado(r) {
    var n = (r && r.escolhidos) || 0;
    document.getElementById("limpar").disabled = n === 0;
    nota(n ? t("escolhidos", [String(n)]) : "");
  }

  api.tabs.query({ active: true, currentWindow: true }).then(function (abas) {
    var a = abas[0];
    if (a && a.url && a.url.indexOf("https://web.whatsapp.com/") === 0) {
      abaDoWhatsApp = a.id;
      return api.tabs.sendMessage(a.id, { tipo: "estado" }).then(estado);
    }
    throw new Error("fora do WhatsApp");
  }).catch(function () {
    abaDoWhatsApp = null;
    document.getElementById("escolher").disabled = true;
    document.getElementById("limpar").disabled = true;
    nota(t("foraDoWhatsApp"));
  });

  document.getElementById("escolher").addEventListener("click", function () {
    if (abaDoWhatsApp == null) return;
    api.tabs.sendMessage(abaDoWhatsApp, { tipo: "escolher" }).then(function () {
      window.close();
    });
  });

  document.getElementById("limpar").addEventListener("click", function () {
    if (abaDoWhatsApp == null) return;
    api.tabs.sendMessage(abaDoWhatsApp, { tipo: "limpar" }).then(estado);
  });
})();
