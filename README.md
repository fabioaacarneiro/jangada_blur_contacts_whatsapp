# Blur de Contatos para WhatsApp

Uma extensão para a [Jangada](https://github.com/fabioaacarneiro/jangada) que desfoca o que é
pessoal no **WhatsApp Web**: nomes, fotos de perfil, prévias das conversas, mensagens, fotos e
vídeos, e até o que você digita. Serve para usar o WhatsApp com alguém do lado, ao compartilhar a
tela ou ao gravar um vídeo. Você escolhe o que ocultar, e passar o mouse por cima revela.

*English: [README.en.md](README.en.md).*

## Instalar

Pela janela da Jangada: **Preferências ▸ Instaladas**, cole o link abaixo, clique em
**Verificar**, confira o que a extensão pede e confirme.

```
https://github.com/fabioaacarneiro/jangada_blur_contacts_whatsapp
```

Pela linha de comando:

```sh
jangada --install https://github.com/fabioaacarneiro/jangada_blur_contacts_whatsapp
```

Depois abra (ou recarregue) o `https://web.whatsapp.com`. A extensão só entra nesse endereço.

Para **atualizar**, instale de novo pelo mesmo link: a versão nova entra no lugar da anterior e as
suas escolhas ficam. Para **remover**: Preferências ▸ Instaladas, ou `jangada --extensions` (mostra
o identificador) e `jangada --remove IDENTIFICADOR`.

## Usar

Ao abrir o WhatsApp Web, tudo já vem desfocado (menos o que você digita). No canto aparece um
**botão redondo com um olho**:

- **clique** abre o painel de escolhas;
- **arraste** muda o botão de lugar (o lugar fica guardado);
- verde e com o olho riscado: desfoque ligado; cinza: desligado.

### O painel

| Opção | O que desfoca |
|---|---|
| **Desfoque ligado** | A chave geral. Desligada, nada fica desfocado (as outras escolhas ficam guardadas). |
| **Nomes** | Os nomes na lista de conversas e no topo da conversa aberta (com o "online" e o "visto por último"). |
| **Fotos de perfil** | As fotos dos contatos e grupos, em qualquer tela (inclusive a sua). |
| **Prévias na lista** | A última mensagem de cada conversa, na lista. A hora e o número de não lidas continuam visíveis. |
| **Mensagens** | O texto das mensagens e das citações na conversa aberta. |
| **Fotos e vídeos** | Imagens, vídeos, figurinhas e miniaturas nas mensagens. |
| **O que você digita** | A caixa de mensagem e a busca de conversas. Vem desligada. |
| **Intensidade** | Quanto desfoca, de 2 a 24 pixels (o padrão é 8). |
| **Revelar ao passar o mouse** | Passar o mouse por cima mostra o que está desfocado. Numa mensagem, basta passar em qualquer ponto do balão. |
| **Mostrar este botão** | Esconde o botão flutuante. O painel continua abrindo pelo atalho Ctrl+Alt+J. |

As escolhas ficam guardadas e valem da próxima vez que você abrir o WhatsApp.

### Escolher na tela

Para ocultar algo que não está nas categorias, use **Escolher na tela** no painel:

1. o cursor vira uma mira e um quadro verde mostra o que está embaixo do mouse;
2. **clique** para desfocar aquele pedaço (clicar de novo nele volta a mostrar);
3. **seta para cima** pega o elemento de fora (maior), **seta para baixo** volta;
4. **Esc** ou **Concluir** termina.

Enquanto você escolhe, os cliques não chegam ao WhatsApp (nenhuma conversa abre sem querer). Essas
escolhas valem **até recarregar a página**: o WhatsApp recria a tela o tempo todo, e não há como
reconhecer o mesmo pedaço com segurança depois de recarregar. Para algo permanente, use as
categorias.

### Atalhos

| Atalho | O que faz |
|---|---|
| **Ctrl+Alt+B** | Liga e desliga o desfoque (rápido, para quando alguém chega). |
| **Ctrl+Alt+J** | Abre e fecha o painel. |
| **Esc** | Fecha o painel, ou termina a escolha na tela. |

Os atalhos usam a tecla física, então funcionam em qualquer layout de teclado.

## Privacidade

A extensão não envia nada para lugar nenhum: não faz pedidos de rede e não lê o conteúdo das
mensagens. Ela só põe atributos na página para o CSS desfocar. As suas escolhas ficam neste
computador, em `~/.local/share/jangada/extensions/IDENTIFICADOR/storage.json`, e são apagadas ao
remover a extensão.

O desfoque é para **olhares de passagem**: ele não protege contra quem tem acesso ao computador,
às Ferramentas do Desenvolvedor ou a uma gravação em alta resolução de um texto pouco desfocado.
Para gravar a tela, prefira uma intensidade alta.

## Limitações

- **O WhatsApp Web muda o HTML de tempos em tempos.** Se uma categoria parar de desfocar depois
  de uma atualização do WhatsApp, os seletores precisam de ajuste (veja abaixo). Abra uma issue
  dizendo qual categoria parou.
- As escolhas feitas numa aba aparecem nas outras abas do WhatsApp ao recarregá-las.
- Os nomes que aparecem fora da lista de conversas e do topo da conversa (os dados do contato, os
  nomes dos autores nas mensagens de grupo) não estão na categoria Nomes; para esses, use
  **Mensagens** ou **Escolher na tela**.

## Como funciona (para quem quer mexer)

É uma extensão no formato da Jangada (veja o
[guia de extensões](https://github.com/fabioaacarneiro/jangada/blob/master/docs/EXTENSOES.md)):

```
manifest.json   o nome, a versão e onde a extensão entra (https://web.whatsapp.com/*)
blur.css        as regras do desfoque, uma por categoria
blur.js         o núcleo: guarda as escolhas, marca nomes e prévias na lista, atalhos, escolha na tela
painel.js       o botão flutuante e o painel (num Shadow DOM, fora do alcance do CSS do WhatsApp)
```

- O `blur.js` liga e desliga as categorias com atributos no `<html>` (`data-jbc-on`,
  `data-jbc-nomes`, `data-jbc-fotos`...), e o `blur.css` só desfoca quando o atributo da categoria
  está lá. A intensidade é a variável CSS `--jbc-blur`.
- O WhatsApp não dá nomes estáveis ao nome e à prévia de cada conversa na lista. O `blur.js`
  observa a lista (`MutationObserver`) e marca, em cada linha, o primeiro texto com título como
  nome (`data-jbc-nome`) e os outros como prévia (`data-jbc-previa`). A marcação acontece antes de
  a tela ser desenhada: uma conversa nova não aparece nítida nem por um instante.
- As fotos de perfil são reconhecidas pelo endereço (`pps.whatsapp.net`); as mensagens, pelas
  classes `.message-in`, `.message-out` e `.copyable-text`, que o WhatsApp usa há anos.
- O `painel.js` usa o núcleo pelo `window.jangadaBlur` (cada arquivo de extensão da Jangada roda
  numa função à parte, e esse `window` é o do mundo isolado: a página não o enxerga).

### Ajustar os seletores

Se o WhatsApp mudar o HTML:

1. abra o WhatsApp Web na Jangada e as Ferramentas do Desenvolvedor (**Ctrl+Shift+I**);
2. inspecione o pedaço que deixou de desfocar e ache algo estável nele (um `id`, um `role`, um
   atributo `data-*`, uma classe com nome legível);
3. troque o seletor da categoria no `blur.css` (e na regra de revelar, mais abaixo no mesmo
   arquivo); para nomes e prévias da lista, a lógica está em `marcarLinha`, no `blur.js`;
4. instale de novo a partir da pasta (`jangada --install ./pasta-da-extensao`) e recarregue a aba.

Os erros da extensão aparecem no Console das Ferramentas do Desenvolvedor, com o nome dela na
frente.
