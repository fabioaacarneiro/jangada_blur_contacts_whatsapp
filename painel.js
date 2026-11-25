// Blur de Contatos para WhatsApp: o botão flutuante e o painel de escolhas.
//
// Tudo fica num Shadow DOM: o CSS do WhatsApp não entra nele, e o desfoque não o pega.
// Usa o núcleo (blur.js) pelo window.jangadaBlur.
(function () {
  "use strict";

  var nucleo = window.jangadaBlur;
  if (!nucleo) {
    console.error("Blur de Contatos: o blur.js não carregou antes do painel.js.");
    return;
  }

  // ---------------------------------------------------------------------------------------
  // Textos (português ou inglês, pela língua do navegador)
  // ---------------------------------------------------------------------------------------

  var TEXTOS = {
    pt: {
      titulo: "Blur de Contatos",
      ligado: "Desfoque ligado",
      nomes: "Nomes",
      fotos: "Fotos de perfil",
      previas: "Prévias na lista",
      mensagens: "Mensagens",
      midia: "Fotos e vídeos",
      digitando: "O que você digita",
      intensidade: "Intensidade",
      revelar: "Revelar ao passar o mouse",
      mostrarBotao: "Mostrar este botão",
      escolher: "Escolher na tela",
      limpar: "Limpar escolhas",
      atalhos: "Ctrl+Alt+B liga/desliga · Ctrl+Alt+J abre este painel",
      avisoEscolha: "Clique no que quer ocultar (ou mostrar de novo) · ↑ pega o de fora, ↓ volta · Esc termina",
      concluir: "Concluir",
      escolhidos: function (n) {
        return n === 1 ? "1 escolhido (até recarregar)" : n + " escolhidos (até recarregar)";
      },
      botaoLigado: "Desfoque ligado: clique para as opções, arraste para mover",
      botaoDesligado: "Desfoque desligado: clique para as opções, arraste para mover",
      fechar: "Fechar"
    },
    en: {
      titulo: "Contact Blur",
      ligado: "Blur on",
      nomes: "Names",
      fotos: "Profile photos",
      previas: "Chat list previews",
      mensagens: "Messages",
      midia: "Photos and videos",
      digitando: "What you type",
      intensidade: "Strength",
      revelar: "Reveal on hover",
      mostrarBotao: "Show this button",
      escolher: "Pick on screen",
      limpar: "Clear picks",
      atalhos: "Ctrl+Alt+B toggles · Ctrl+Alt+J opens this panel",
      avisoEscolha: "Click what you want to hide (or show again) · ↑ picks the outer one, ↓ goes back · Esc ends",
      concluir: "Done",
      escolhidos: function (n) {
        return n === 1 ? "1 picked (until reload)" : n + " picked (until reload)";
      },
      botaoLigado: "Blur on: click for options, drag to move",
      botaoDesligado: "Blur off: click for options, drag to move",
      fechar: "Close"
    }
  };
  var T = /^pt\b/i.test(navigator.language || "") ? TEXTOS.pt : TEXTOS.en;

  // ---------------------------------------------------------------------------------------
  // A estrutura
  // ---------------------------------------------------------------------------------------

  var OLHO =
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path class="risco" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="M4 4l16 16"/></svg>';

  var CSS = [
    ":host{all:initial}",
    "*{box-sizing:border-box;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}",
    ".fab{position:fixed;z-index:2147483646;width:40px;height:40px;border-radius:50%;border:0;padding:0;",
    "display:grid;place-items:center;cursor:grab;color:#fff;background:#00a884;opacity:.55;",
    "box-shadow:0 2px 8px rgba(0,0,0,.35);transition:opacity .15s,background .15s;touch-action:none}",
    ".fab:hover,.fab:focus-visible,.fab.aberto{opacity:1}",
    ".fab:focus-visible{outline:2px solid #fff;outline-offset:2px}",
    ".fab .risco{display:inline}",
    ".fab.desligado{background:#54656f}",
    ".fab.desligado .risco{display:none}",
    ".fab.arrastando{cursor:grabbing;opacity:1}",
    ".painel{position:fixed;z-index:2147483647;width:280px;max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);overflow:auto;",
    "padding:14px;border-radius:12px;background:#1f2c33;color:#e9edef;font-size:13px;line-height:1.35;",
    "box-shadow:0 8px 28px rgba(0,0,0,.45)}",
    ".painel[hidden],.aviso[hidden],.realce[hidden],.fab[hidden]{display:none}",
    ".topo{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}",
    "h2{margin:0;font-size:15px;font-weight:600}",
    ".x{border:0;background:none;color:#aebac1;font-size:20px;line-height:1;cursor:pointer;padding:2px 6px;border-radius:6px}",
    ".x:hover{background:rgba(255,255,255,.08);color:#fff}",
    "label{display:flex;align-items:center;gap:10px;padding:6px 4px;border-radius:6px;cursor:pointer;user-select:none}",
    "label:hover{background:rgba(255,255,255,.05)}",
    "input[type=checkbox]{width:16px;height:16px;margin:0;accent-color:#00a884;cursor:pointer}",
    ".geral{font-weight:600;border-bottom:1px solid rgba(255,255,255,.1);border-radius:0;margin-bottom:6px;padding-bottom:10px}",
    "fieldset{border:0;margin:0;padding:0}",
    "fieldset:disabled{opacity:.45}",
    ".faixa{display:flex;align-items:center;gap:10px;padding:8px 4px}",
    ".faixa span{min-width:0;flex:none}",
    "input[type=range]{flex:1;accent-color:#00a884;min-width:0}",
    ".faixa output{flex:none;width:40px;text-align:right;color:#aebac1;font-variant-numeric:tabular-nums}",
    "hr{border:0;border-top:1px solid rgba(255,255,255,.1);margin:8px 0}",
    ".acoes{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}",
    "button.acao{flex:1;border:0;border-radius:8px;padding:8px 10px;font-size:13px;cursor:pointer;background:#00a884;color:#fff;font-weight:600}",
    "button.acao.sec{background:rgba(255,255,255,.08);color:#e9edef;font-weight:500}",
    "button.acao:hover{filter:brightness(1.1)}",
    "button.acao:disabled{opacity:.4;cursor:default;filter:none}",
    ".nota{margin:8px 4px 0;color:#8696a0;font-size:12px}",
    ".atalhos{margin:10px 4px 0;color:#8696a0;font-size:11.5px}",
    ".aviso{position:fixed;z-index:2147483647;top:12px;left:50%;transform:translateX(-50%);max-width:calc(100vw - 32px);",
    "display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;padding:8px 10px 8px 14px;border-radius:10px;",
    "background:#1f2c33;color:#e9edef;font-size:13px;box-shadow:0 6px 22px rgba(0,0,0,.45);pointer-events:none}",
    // O aviso deixa o mouse passar (dá para escolher o que está atrás dele); só os botões o pegam.
    ".aviso button{cursor:pointer;pointer-events:auto}",
    ".aviso .acoes{margin:0}",
    ".aviso button.acao{flex:none;padding:6px 10px}",
    ".realce{position:fixed;z-index:2147483645;pointer-events:none;border:2px solid #00a884;border-radius:4px;",
    "background:rgba(0,168,132,.15);transition:all .05s linear}"
  ].join("");

  var hospedeiro = document.createElement("div");
  hospedeiro.id = "jangada-blur-ui";
  var sombra = hospedeiro.attachShadow({ mode: "open" });

  var caixas = nucleo.CATEGORIAS.map(function (c) {
    return '<label><input type="checkbox" data-chave="' + c + '"><span>' + T[c] + "</span></label>";
  }).join("");

  sombra.innerHTML =
    "<style>" + CSS + "</style>" +
    '<button class="fab" type="button">' + OLHO + "</button>" +
    '<div class="painel" role="dialog" aria-label="' + T.titulo + '" hidden>' +
    '<div class="topo"><h2>' + T.titulo + '</h2><button class="x" type="button" title="' + T.fechar + '" aria-label="' + T.fechar + '">×</button></div>' +
    '<label class="geral"><input type="checkbox" data-chave="ativo"><span>' + T.ligado + "</span></label>" +
    "<fieldset>" + caixas +
    '<div class="faixa"><span>' + T.intensidade + '</span><input type="range" min="2" max="24" step="1" data-chave="intensidade"><output></output></div>' +
    '<label><input type="checkbox" data-chave="revelar"><span>' + T.revelar + "</span></label>" +
    "</fieldset>" +
    '<label><input type="checkbox" data-chave="mostrarBotao"><span>' + T.mostrarBotao + "</span></label>" +
    "<hr>" +
    '<div class="acoes"><button class="acao escolher" type="button">' + T.escolher + '</button>' +
    '<button class="acao sec limpar" type="button">' + T.limpar + "</button></div>" +
    '<p class="nota contagem" hidden></p>' +
    '<p class="atalhos">' + T.atalhos + "</p>" +
    "</div>" +
    '<div class="aviso" role="status" hidden><span>' + T.avisoEscolha + '</span><span class="nota contagem2"></span>' +
    '<div class="acoes"><button class="acao sec limpar2" type="button">' + T.limpar + '</button>' +
    '<button class="acao concluir" type="button">' + T.concluir + "</button></div></div>" +
    '<div class="realce" hidden></div>';

  function $(s) {
    return sombra.querySelector(s);
  }

  var fab = $(".fab");
  var painel = $(".painel");
  var aviso = $(".aviso");
  var realce = $(".realce");
  var campos = sombra.querySelectorAll("[data-chave]");
  var saida = $(".faixa output");
  var conjunto = $("fieldset");

  // Fora do <body>: o WhatsApp não mexe no <html>, então o painel não some quando ele
  // redesenha a página.
  document.documentElement.appendChild(hospedeiro);

  // ---------------------------------------------------------------------------------------
  // Mostrar as escolhas
  // ---------------------------------------------------------------------------------------

  var visivel = false;

  function posicionarBotao(cfg) {
    var b = cfg.botao || { direita: 24, baixo: 96 };
    var maxD = Math.max(0, window.innerWidth - 48);
    var maxB = Math.max(0, window.innerHeight - 48);
    fab.style.right = Math.max(8, Math.min(maxD, b.direita)) + "px";
    fab.style.bottom = Math.max(8, Math.min(maxB, b.baixo)) + "px";
  }

  function mostrar(cfg) {
    for (var i = 0; i < campos.length; i++) {
      var c = campos[i];
      var k = c.getAttribute("data-chave");
      if (c.type === "checkbox") c.checked = !!cfg[k];
      else c.value = cfg[k];
    }
    saida.textContent = cfg.intensidade + "px";
    conjunto.disabled = !cfg.ativo;
    fab.classList.toggle("desligado", !cfg.ativo);
    fab.title = cfg.ativo ? T.botaoLigado : T.botaoDesligado;
    fab.setAttribute("aria-label", fab.title);
    fab.hidden = !cfg.mostrarBotao;
    posicionarBotao(cfg);
    if (visivel) posicionarPainel();
  }

  nucleo.aoMudar(mostrar);

  for (var i = 0; i < campos.length; i++) {
    campos[i].addEventListener(campos[i].type === "range" ? "input" : "change", function (e) {
      var c = e.currentTarget;
      var k = c.getAttribute("data-chave");
      var o = {};
      o[k] = c.type === "checkbox" ? c.checked : Number(c.value);
      nucleo.mudar(o);
    });
  }

  // ---------------------------------------------------------------------------------------
  // Abrir e fechar o painel (ao lado do botão, ou no canto se o botão estiver escondido)
  // ---------------------------------------------------------------------------------------

  function posicionarPainel() {
    var largura = painel.offsetWidth || 280;
    var altura = painel.offsetHeight || 420;
    var r = fab.hidden ? { left: window.innerWidth - 64, right: window.innerWidth - 24, top: window.innerHeight - 64, bottom: window.innerHeight - 24 } : fab.getBoundingClientRect();
    var esquerda = Math.min(Math.max(8, r.right - largura), window.innerWidth - largura - 8);
    var topo = r.top - altura - 8;
    if (topo < 8) topo = Math.min(r.bottom + 8, window.innerHeight - altura - 8);
    painel.style.left = Math.max(8, esquerda) + "px";
    painel.style.top = Math.max(8, topo) + "px";
  }

  function abrir() {
    if (nucleo.escolha.ativa()) return;
    visivel = true;
    painel.hidden = false;
    fab.classList.add("aberto");
    atualizarContagem();
    posicionarPainel();
    var geral = painel.querySelector('[data-chave="ativo"]');
    if (geral) geral.focus();
  }

  function fechar() {
    visivel = false;
    painel.hidden = true;
    fab.classList.remove("aberto");
  }

  function alternar() {
    if (visivel) fechar();
    else abrir();
  }

  nucleo.aoAbrirPainel(alternar);
  $(".x").addEventListener("click", fechar);

  // Clique fora fecha.
  window.addEventListener("pointerdown", function (e) {
    if (visivel && e.composedPath().indexOf(hospedeiro) < 0) fechar();
  });
  // Na captura: o WhatsApp não chega a ver (nem a engolir) o Esc que fecha o painel.
  window.addEventListener(
    "keydown",
    function (e) {
      if (visivel && e.key === "Escape") {
        e.stopPropagation();
        fechar();
      }
    },
    true
  );
  window.addEventListener("resize", function () {
    posicionarBotao(nucleo.config());
    if (visivel) posicionarPainel();
  });

  // ---------------------------------------------------------------------------------------
  // O botão: clique abre o painel; arrastar muda o lugar (e o lugar fica guardado).
  // ---------------------------------------------------------------------------------------

  var arraste = null;

  fab.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    var r = fab.getBoundingClientRect();
    arraste = { x: e.clientX, y: e.clientY, dx: r.right - e.clientX, dy: r.bottom - e.clientY, moveu: false };
    fab.setPointerCapture(e.pointerId);
  });

  fab.addEventListener("pointermove", function (e) {
    if (!arraste) return;
    if (!arraste.moveu && Math.abs(e.clientX - arraste.x) + Math.abs(e.clientY - arraste.y) < 5) return;
    arraste.moveu = true;
    fab.classList.add("arrastando");
    if (visivel) fechar();
    fab.style.right = Math.max(8, Math.min(window.innerWidth - 48, window.innerWidth - e.clientX - arraste.dx)) + "px";
    fab.style.bottom = Math.max(8, Math.min(window.innerHeight - 48, window.innerHeight - e.clientY - arraste.dy)) + "px";
  });

  function soltar(e) {
    if (!arraste) return;
    var moveu = arraste.moveu;
    arraste = null;
    fab.classList.remove("arrastando");
    if (fab.hasPointerCapture && fab.hasPointerCapture(e.pointerId)) fab.releasePointerCapture(e.pointerId);
    if (moveu) {
      nucleo.mudar({ botao: { direita: parseFloat(fab.style.right) || 24, baixo: parseFloat(fab.style.bottom) || 96 } });
    } else if (e.type === "pointerup") {
      alternar();
    }
  }
  fab.addEventListener("pointerup", soltar);
  fab.addEventListener("pointercancel", soltar);
  // Teclado: Enter e espaço no botão abrem o painel (o clique do mouse já passou pelo pointerup).
  fab.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      alternar();
    }
  });

  // ---------------------------------------------------------------------------------------
  // Escolher na tela
  // ---------------------------------------------------------------------------------------

  function atualizarContagem() {
    var n = nucleo.escolha.contar();
    var p = $(".contagem");
    p.hidden = n === 0;
    p.textContent = T.escolhidos(n);
    $(".contagem2").textContent = n ? "· " + T.escolhidos(n) : "";
    $(".limpar").disabled = n === 0;
    $(".limpar2").disabled = n === 0;
  }

  var quadro = 0;
  var alvoAtual = null;

  function desenharRealce() {
    quadro = 0;
    if (!nucleo.escolha.ativa() || !alvoAtual || !alvoAtual.isConnected) {
      realce.hidden = true;
      return;
    }
    var r = alvoAtual.getBoundingClientRect();
    realce.hidden = false;
    realce.style.left = r.left - 2 + "px";
    realce.style.top = r.top - 2 + "px";
    realce.style.width = r.width + 4 + "px";
    realce.style.height = r.height + 4 + "px";
    // Acompanha a rolagem enquanto a escolha estiver aberta.
    quadro = requestAnimationFrame(desenharRealce);
  }

  nucleo.escolha.ligar(hospedeiro, function (ativa, alvo) {
    aviso.hidden = !ativa;
    alvoAtual = ativa ? alvo : null;
    if (!quadro) desenharRealce();
    atualizarContagem();
  });

  $(".escolher").addEventListener("click", function () {
    fechar();
    nucleo.escolha.iniciar();
  });
  $(".concluir").addEventListener("click", function () {
    nucleo.escolha.terminar();
  });
  $(".limpar").addEventListener("click", function () {
    nucleo.escolha.limpar();
  });
  $(".limpar2").addEventListener("click", function () {
    nucleo.escolha.limpar();
  });
})();
