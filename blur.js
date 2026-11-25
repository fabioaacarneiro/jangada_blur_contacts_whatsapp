// Blur de Contatos para WhatsApp: o núcleo.
//
// Guarda as escolhas (jangada.storage.local), liga e desliga as categorias no <html> (o
// blur.css faz o desfoque), marca os nomes e as prévias na lista de conversas, cuida dos
// atalhos e do modo "escolher na tela". O painel na página (painel.js) usa o que fica em
// window.jangadaBlur: cada arquivo de extensão da Jangada é uma função à parte, e esse é o
// jeito de dividir código entre eles (o window é o do mundo isolado; a página não o vê).
//
// Na Jangada com botão de extensão na barra, as escolhas ficam na janelinha do botão
// (popup.html): ela grava no storage e este script aplica na hora (storage.onChanged), e
// pede "escolher na tela" por mensagem. Na Jangada sem a barra, vale o botão flutuante.
(function () {
  "use strict";

  var raiz = document.documentElement;

  // As categorias, na ordem do painel. A chave vira o atributo data-jbc-CHAVE no <html>.
  var CATEGORIAS = ["nomes", "fotos", "previas", "mensagens", "midia", "digitando"];

  // A Jangada tem o botão das extensões na barra (e a janelinha dele)?
  var temBarra = !!(jangada.action && typeof jangada.action.setBadgeText === "function");

  // Privacidade primeiro: até as escolhas guardadas chegarem, vale o padrão (tudo
  // desfocado, menos o que você digita).
  var PADRAO = {
    ativo: true,
    nomes: true,
    fotos: true,
    previas: true,
    mensagens: true,
    midia: true,
    digitando: false,
    intensidade: 8,
    revelar: true,
    // Com a barra, as escolhas ficam na janelinha: o botão na página só se você quiser.
    mostrarBotao: !temBarra,
    botao: { direita: 24, baixo: 96 },
    versao: 2
  };

  var config = copiar(PADRAO);
  var ouvintes = [];

  function copiar(o) {
    return JSON.parse(JSON.stringify(o));
  }

  // --------------------------------------------------------------------------------------
  // Aplicar as escolhas na página
  // --------------------------------------------------------------------------------------

  var estiloVar = document.createElement("style");
  estiloVar.id = "jangada-blur-intensidade";
  (document.head || raiz).appendChild(estiloVar);

  function marcar(nome, ligado) {
    if (ligado) raiz.setAttribute("data-jbc-" + nome, "");
    else raiz.removeAttribute("data-jbc-" + nome);
  }

  function aplicar() {
    marcar("on", config.ativo);
    marcar("revelar", config.revelar);
    CATEGORIAS.forEach(function (c) {
      marcar(c, !!config[c]);
    });
    var px = Math.max(2, Math.min(24, Number(config.intensidade) || PADRAO.intensidade));
    estiloVar.textContent = ":root{--jbc-blur:" + px + "px}";
    // O WhatsApp troca o <head> às vezes: o estilo da intensidade volta se sair.
    if (!estiloVar.isConnected) (document.head || raiz).appendChild(estiloVar);
    ouvintes.forEach(function (f) {
      try {
        f(config);
      } catch (e) {
        console.error("Blur de Contatos:", e);
      }
    });
    // O selo do botão na barra avisa quando o desfoque está desligado.
    if (temBarra && config.ativo !== seloLigado) {
      seloLigado = config.ativo;
      jangada.action.setBadgeText({ text: config.ativo ? "" : "off" });
      jangada.action.setBadgeBackgroundColor({ color: "#54656f" });
    }
  }
  var seloLigado = null;

  function salvar() {
    jangada.storage.local.set({ config: config });
  }

  // Muda uma ou mais escolhas, aplica e guarda.
  function mudar(parcial) {
    Object.keys(parcial).forEach(function (k) {
      config[k] = parcial[k];
    });
    aplicar();
    salvar();
  }

  // Junta o que foi guardado com o padrão: uma versão nova pode trazer escolhas que a
  // guardada não tem.
  function juntar(guardado) {
    guardado = guardado || {};
    Object.keys(PADRAO).forEach(function (k) {
      config[k] = guardado[k] !== undefined ? guardado[k] : copiar(PADRAO)[k];
    });
  }

  aplicar();
  jangada.storage.local.get({ config: PADRAO }).then(function (dados) {
    var guardado = dados && dados.config ? dados.config : {};
    juntar(guardado);
    // As escolhas da versão 1 (sem a barra) tinham o botão na página ligado: com a barra,
    // ele sai uma vez (dá para pôr de volta na janelinha).
    if (temBarra && !guardado.versao) {
      config.mostrarBotao = false;
      config.versao = 2;
      salvar();
    }
    aplicar();
  });

  // Mudou na janelinha (ou em outra aba do WhatsApp): vale aqui na hora.
  if (jangada.storage.onChanged) {
    jangada.storage.onChanged.addListener(function (mudancas) {
      if (mudancas.config && mudancas.config.newValue) {
        juntar(mudancas.config.newValue);
        aplicar();
      }
    });
  }

  // --------------------------------------------------------------------------------------
  // A lista de conversas: o WhatsApp não dá nomes estáveis ao nome e à prévia de cada
  // conversa, então o script os acha e marca (data-jbc-nome, data-jbc-previa,
  // data-jbc-foto). Em cada linha da lista: o primeiro texto com título é o nome; os
  // outros textos são a prévia (a hora e o contador de não lidas ficam de fora); uma
  // imagem antes do nome é a foto.
  // --------------------------------------------------------------------------------------

  var HORA = /^\s*(\d{1,2}[:h]\d{2}(\s?[ap]\.?\s?m\.?)?|\d{1,2}\/\d{1,2}(\/\d{2,4})?|\d+|ontem|hoje|yesterday|today|domingo|segunda(-feira)?|terça(-feira)?|quarta(-feira)?|quinta(-feira)?|sexta(-feira)?|sábado|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s*$/i;

  function linhasDaLista(lista) {
    var linhas = lista.querySelectorAll('[role="listitem"]');
    if (!linhas.length) linhas = lista.querySelectorAll('[role="row"]');
    return linhas;
  }

  function marcarLinha(linha) {
    var textos = linha.querySelectorAll('span[title], span[dir="auto"], span[dir="ltr"], span[dir="rtl"]');
    if (!textos.length) return;
    var nome = linha.querySelector("[data-jbc-nome]") || linha.querySelector("span[title]") || textos[0];
    if (!nome.hasAttribute("data-jbc-nome")) nome.setAttribute("data-jbc-nome", "");
    for (var i = 0; i < textos.length; i++) {
      var t = textos[i];
      if (t === nome || nome.contains(t) || t.contains(nome)) continue;
      if (t.hasAttribute("data-jbc-previa")) continue;
      // Um texto dentro de outro já marcado já está desfocado com ele.
      if (t.parentElement && t.parentElement.closest("[data-jbc-previa]")) continue;
      if (HORA.test(t.textContent || "")) continue;
      t.setAttribute("data-jbc-previa", "");
    }
    var imgs = linha.querySelectorAll("img:not([data-jbc-foto])");
    for (var j = 0; j < imgs.length; j++) {
      var img = imgs[j];
      if (img.hasAttribute("data-plain-text") || img.classList.contains("emoji")) continue;
      // Só uma imagem que vem antes do nome é a foto (as de depois são emojis da prévia).
      if (nome.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_PRECEDING) {
        img.setAttribute("data-jbc-foto", "");
      }
    }
  }

  function marcarLista() {
    var lista = document.getElementById("pane-side");
    if (!lista) return;
    var linhas = linhasDaLista(lista);
    for (var i = 0; i < linhas.length; i++) marcarLinha(linhas[i]);
  }

  // Marca na hora em que o WhatsApp muda a lista: o MutationObserver responde antes de a
  // tela ser desenhada, então um nome novo não aparece nítido nem por um instante.
  var observador = new MutationObserver(function (registros) {
    var lista = document.getElementById("pane-side");
    if (!lista) return;
    for (var i = 0; i < registros.length; i++) {
      if (lista.contains(registros[i].target) || registros[i].target.contains(lista)) {
        marcarLista();
        return;
      }
    }
  });
  observador.observe(document.body || raiz, { childList: true, subtree: true });
  marcarLista();

  // --------------------------------------------------------------------------------------
  // Escolher na tela: um clique desfoca (ou volta a mostrar) o elemento sob o mouse.
  // Vale até recarregar a página: o WhatsApp recria os elementos e não há como reconhecê-
  // los de novo com segurança.
  // --------------------------------------------------------------------------------------

  var escolha = { ativa: false, alvo: null, subidas: [], aoMudar: null, ignorar: null };

  function contarEscolhidos() {
    return document.querySelectorAll("[data-jbc-manual]").length;
  }

  function avisarEscolha() {
    if (escolha.aoMudar) escolha.aoMudar(escolha.ativa, escolha.alvo, contarEscolhidos());
  }

  function ehNosso(e) {
    return escolha.ignorar && e.composedPath && e.composedPath().indexOf(escolha.ignorar) >= 0;
  }

  function aoMover(e) {
    if (ehNosso(e)) return;
    var t = e.target;
    if (!(t instanceof Element) || t === raiz || t === document.body) return;
    if (escolha.subidas.length && escolha.subidas[0] === t) return;
    escolha.subidas = [t];
    escolha.alvo = t;
    avisarEscolha();
  }

  function bloquear(e) {
    if (ehNosso(e)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  function aoClicar(e) {
    if (ehNosso(e)) return;
    bloquear(e);
    var t = escolha.alvo;
    if (!t) return;
    // Se já está dentro de algo escolhido, o clique tira a escolha de lá.
    var ja = t.closest("[data-jbc-manual]");
    if (ja) ja.removeAttribute("data-jbc-manual");
    else t.setAttribute("data-jbc-manual", "");
    avisarEscolha();
  }

  function aoTeclar(e) {
    if (!escolha.ativa) return;
    if (e.key === "Escape") {
      bloquear(e);
      terminarEscolha();
    } else if (e.key === "ArrowUp" && escolha.alvo) {
      // Seta para cima: pega o elemento de fora (o pai). Seta para baixo volta.
      bloquear(e);
      var pai = escolha.alvo.parentElement;
      if (pai && pai !== document.body && pai !== raiz) {
        escolha.subidas.push(pai);
        escolha.alvo = pai;
        avisarEscolha();
      }
    } else if (e.key === "ArrowDown" && escolha.subidas.length > 1) {
      bloquear(e);
      escolha.subidas.pop();
      escolha.alvo = escolha.subidas[escolha.subidas.length - 1];
      avisarEscolha();
    }
  }

  var EVENTOS_BLOQUEADOS = ["pointerdown", "pointerup", "mousedown", "mouseup", "dblclick", "contextmenu"];

  function iniciarEscolha() {
    if (escolha.ativa) return;
    escolha.ativa = true;
    escolha.alvo = null;
    escolha.subidas = [];
    raiz.setAttribute("data-jbc-escolhendo", "");
    window.addEventListener("mousemove", aoMover, true);
    window.addEventListener("click", aoClicar, true);
    EVENTOS_BLOQUEADOS.forEach(function (n) {
      window.addEventListener(n, bloquear, true);
    });
    avisarEscolha();
  }

  function terminarEscolha() {
    if (!escolha.ativa) return;
    escolha.ativa = false;
    escolha.alvo = null;
    escolha.subidas = [];
    raiz.removeAttribute("data-jbc-escolhendo");
    window.removeEventListener("mousemove", aoMover, true);
    window.removeEventListener("click", aoClicar, true);
    EVENTOS_BLOQUEADOS.forEach(function (n) {
      window.removeEventListener(n, bloquear, true);
    });
    avisarEscolha();
  }

  function limparEscolhidos() {
    var todos = document.querySelectorAll("[data-jbc-manual]");
    for (var i = 0; i < todos.length; i++) todos[i].removeAttribute("data-jbc-manual");
    avisarEscolha();
  }

  // --------------------------------------------------------------------------------------
  // Atalhos: Ctrl+Alt+B liga e desliga o desfoque; Ctrl+Alt+J abre o painel; Esc termina
  // a escolha na tela. Pela tecla física (e.code), para valer em qualquer teclado.
  // --------------------------------------------------------------------------------------

  var abrirPainel = null;

  window.addEventListener(
    "keydown",
    function (e) {
      if (escolha.ativa) {
        aoTeclar(e);
        return;
      }
      if (!e.ctrlKey || !e.altKey || e.shiftKey || e.metaKey) return;
      if (e.code === "KeyB") {
        e.preventDefault();
        e.stopImmediatePropagation();
        mudar({ ativo: !config.ativo });
      } else if (e.code === "KeyJ") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (abrirPainel) abrirPainel();
      }
    },
    true
  );

  // --------------------------------------------------------------------------------------
  // O que o painel (painel.js) usa.
  // --------------------------------------------------------------------------------------

  // A janelinha pede pela aba: escolher na tela, limpar as escolhas, o estado delas.
  if (jangada.runtime.onMessage) {
    jangada.runtime.onMessage.addListener(function (msg, remetente, responder) {
      if (!msg || typeof msg.tipo !== "string") return;
      if (msg.tipo === "escolher") iniciarEscolha();
      else if (msg.tipo === "limpar") limparEscolhidos();
      else if (msg.tipo !== "estado") return;
      responder({ escolhidos: contarEscolhidos(), escolhendo: escolha.ativa });
    });
  }

  window.jangadaBlur = {
    CATEGORIAS: CATEGORIAS,
    config: function () {
      return config;
    },
    mudar: mudar,
    aoMudar: function (f) {
      ouvintes.push(f);
      f(config);
    },
    aoAbrirPainel: function (f) {
      abrirPainel = f;
    },
    escolha: {
      iniciar: iniciarEscolha,
      terminar: terminarEscolha,
      limpar: limparEscolhidos,
      contar: contarEscolhidos,
      ativa: function () {
        return escolha.ativa;
      },
      // O painel diz qual é o elemento dele (ignorado na escolha) e quer saber das mudanças.
      ligar: function (elementoDoPainel, aoMudar) {
        escolha.ignorar = elementoDoPainel;
        escolha.aoMudar = aoMudar;
      }
    }
  };
})();
