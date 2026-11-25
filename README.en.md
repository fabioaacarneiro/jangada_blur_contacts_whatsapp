# Contact Blur for WhatsApp

An extension for the [Jangada](https://github.com/fabioaacarneiro/jangada) browser that blurs the
personal parts of **WhatsApp Web**: names, profile photos, chat previews, messages, photos and
videos, and even what you type. It's for using WhatsApp with someone next to you, while sharing
your screen, or while recording a video. You choose what to hide, and hovering reveals it.

*Português: [README.md](README.md).*

> The extension's internal name (shown in Jangada's installed list) is
> **"Blur de Contatos para WhatsApp"**. The panel follows your browser language: English or
> Portuguese.

## Install

From the Jangada window: **Preferences ▸ Installed**, paste the link below, click **Check**,
review what the extension asks for and confirm.

```
https://github.com/fabioaacarneiro/jangada_blur_contacts_whatsapp
```

From the command line:

```sh
jangada --install https://github.com/fabioaacarneiro/jangada_blur_contacts_whatsapp
```

Then open (or reload) `https://web.whatsapp.com`. The extension only runs on that address.

To **update**, install again from the same link: the new version replaces the old one and your
settings are kept. To **remove**: Preferences ▸ Installed, or `jangada --extensions` (shows the
ID) and `jangada --remove ID`.

## Use

When WhatsApp Web opens, everything is already blurred (except what you type). A **round button
with an eye** appears in the corner:

- **click** opens the settings panel;
- **drag** moves the button (its position is saved);
- green with a crossed-out eye: blur is on; gray: blur is off.

### The panel

| Option | What it blurs |
|---|---|
| **Blur on** | The master switch. When off, nothing is blurred (the other settings are kept). |
| **Names** | Names in the chat list and at the top of the open chat (with "online" and "last seen"). |
| **Profile photos** | Contact and group photos, on any screen (yours too). |
| **Chat list previews** | The last message of each chat in the list. The time and the unread count stay visible. |
| **Messages** | The text of the messages and quotes in the open chat. |
| **Photos and videos** | Images, videos, stickers and thumbnails in messages. |
| **What you type** | The message box and the chat search. Off by default. |
| **Strength** | How much to blur, from 2 to 24 pixels (default 8). |
| **Reveal on hover** | Hovering shows what is blurred. On a message, hovering anywhere on the bubble is enough. |
| **Show this button** | Hides the floating button. The panel still opens with Ctrl+Alt+J. |

Settings are saved and apply the next time you open WhatsApp.

### Pick on screen

To hide something that isn't in the categories, use **Pick on screen** in the panel:

1. the cursor becomes a crosshair and a green box shows what is under the mouse;
2. **click** to blur that element (click it again to show it);
3. **up arrow** picks the outer (bigger) element, **down arrow** goes back;
4. **Esc** or **Done** ends picking.

While picking, clicks don't reach WhatsApp (no chat opens by accident). These picks last **until
the page reloads**: WhatsApp rebuilds its screen all the time, and there is no reliable way to
recognize the same element after a reload. For something permanent, use the categories.

### Shortcuts

| Shortcut | What it does |
|---|---|
| **Ctrl+Alt+B** | Turns blur on and off (quick, for when someone walks in). |
| **Ctrl+Alt+J** | Opens and closes the panel. |
| **Esc** | Closes the panel, or ends picking on screen. |

Shortcuts use the physical key, so they work with any keyboard layout.

## Privacy

The extension sends nothing anywhere: it makes no network requests and doesn't read message
content. It only adds attributes to the page so the CSS can blur. Your settings stay on this
computer, in `~/.local/share/jangada/extensions/ID/storage.json`, and are deleted when you remove
the extension.

The blur is for **passing glances**: it doesn't protect against someone with access to the
computer, to the Developer Tools, or to a high-resolution recording of lightly blurred text. When
recording your screen, use a high strength.

## Limitations

- **WhatsApp Web changes its HTML from time to time.** If a category stops blurring after a
  WhatsApp update, the selectors need adjusting (see below). Open an issue saying which category
  stopped working.
- Settings changed in one tab show up in other WhatsApp tabs when they reload.
- Names outside the chat list and the chat header (contact info, author names in group messages)
  are not covered by the Names category; for those, use **Messages** or **Pick on screen**.

## How it works (for contributors)

It's an extension in Jangada's format (see the
[extension guide](https://github.com/fabioaacarneiro/jangada/blob/master/docs/EXTENSOES.md), in
Portuguese):

```
manifest.json   name, version and where the extension runs (https://web.whatsapp.com/*)
blur.css        the blur rules, one per category
blur.js         the core: saves settings, tags names and previews in the list, shortcuts, picking
painel.js       the floating button and the panel (in a Shadow DOM, out of WhatsApp's CSS reach)
```

The code and its comments are in Portuguese, following Jangada's own code.

- `blur.js` turns categories on and off with attributes on `<html>` (`data-jbc-on`,
  `data-jbc-nomes`, `data-jbc-fotos`...), and `blur.css` only blurs when the category's attribute
  is there. The strength is the CSS variable `--jbc-blur`.
- WhatsApp has no stable names for the name and the preview of each chat in the list. `blur.js`
  watches the list (`MutationObserver`) and, on each row, tags the first titled text as the name
  (`data-jbc-nome`) and the others as the preview (`data-jbc-previa`). Tagging happens before the
  screen is painted: a new chat never shows unblurred, not even for a moment.
- Profile photos are recognized by their address (`pps.whatsapp.net`); messages, by the
  `.message-in`, `.message-out` and `.copyable-text` classes, which WhatsApp has used for years.
- `painel.js` reaches the core through `window.jangadaBlur` (each Jangada extension file runs in
  its own function, and this `window` belongs to the isolated world: the page can't see it).

### Adjusting the selectors

If WhatsApp changes its HTML:

1. open WhatsApp Web in Jangada and the Developer Tools (**Ctrl+Shift+I**);
2. inspect the part that stopped blurring and find something stable on it (an `id`, a `role`, a
   `data-*` attribute, a readable class name);
3. replace the category's selector in `blur.css` (and in the reveal rule further down the same
   file); for list names and previews, the logic is in `marcarLinha`, in `blur.js`;
4. reinstall from the folder (`jangada --install ./extension-folder`) and reload the tab.

Extension errors show up in the Developer Tools Console, prefixed with the extension's name.
