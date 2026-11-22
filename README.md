# Minimize to Menu Bar

An [Obsidian](https://obsidian.md) plugin that minimizes the window when you close the last tab, instead of leaving an empty workspace.

On **macOS** it goes further: the window is hidden into a **menu bar item** (Obsidian's own icon) and Obsidian is removed from the Dock.

- Click the menu bar icon to bring the window back; right-click it for *Show Obsidian* / *Quit Obsidian*.
- If Obsidian is **pinned to the Dock**, its Dock icon stays.
- The window's **close button** also hides to the menu bar. Quitting (⌘Q) still quits.
- Turn off *Minimize to menu bar* in the settings to minimize to the Dock instead.

On **Windows** and **Linux** (off by default; enable in the settings) the window is minimized to the taskbar.

A *Minimize window* command is available for a hotkey.

## Install

1. Build it (see below), or take `main.js` and `manifest.json` from a release.
2. Copy both files into `<your vault>/.obsidian/plugins/minimize-to-menu-bar/`.
3. Enable **Minimize to Menu Bar** in *Settings → Community plugins*.

## Build

```bash
npm install
npm run build   # outputs dist/main.js and dist/manifest.json
```

`npm run dev` rebuilds on every change.

## Credits

Based on [Minimize on Close](https://github.com/alberti42/obsidian-minimize-on-close) by Andrea Alberti (MIT).

## License

[MIT](LICENSE)
