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

**With [BRAT](https://obsidian.md/plugins?id=obsidian42-brat):** *Add beta plugin* → `brian978/obsidian-minimize`. BRAT also installs updates.

**Manually:**

1. Download `minimize-to-menu-bar-<version>.zip` from the [latest release](https://github.com/brian978/obsidian-minimize/releases/latest).
2. Unzip it into `<your vault>/.obsidian/plugins/`. It creates the `minimize-to-menu-bar` folder.
3. Enable **Minimize to Menu Bar** in *Settings → Community plugins*.

## Release

Bump `version` in `manifest.json`, merge, then push a tag with the same version:

```bash
git tag 1.0.2 && git push origin 1.0.2
```

The [release workflow](.github/workflows/release.yml) builds the plugin and publishes a GitHub release with the zip, plus `main.js` and `manifest.json` for BRAT.

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
