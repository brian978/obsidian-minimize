# Minimize to Menu Bar

Minimizes the Obsidian window when you close the last tab, instead of leaving an empty workspace. On macOS, the window hides into a menu bar item and Obsidian leaves the Dock.

Desktop only (macOS, Windows, Linux).

## Features

**macOS** (on by default)

- Closing the last tab hides the window into a **menu bar item** showing Obsidian's own icon.
- Obsidian is removed from the Dock while hidden. If Obsidian is **pinned to the Dock**, its Dock icon stays.
- The window's **close button** hides to the menu bar too. Quitting (⌘Q) still quits.
- Click the menu bar icon to bring the window back. Right-click it for *Show Obsidian* and *Quit Obsidian*.
- Turn off *Minimize to menu bar* to minimize to the Dock instead.

**Windows and Linux** (off by default)

- Closing the last tab minimizes the window to the taskbar.

## Usage

1. Enable the plugin.
2. Close the last tab in the main window. Tabs in the sidebars and in pop-out windows don't count.
3. To bring the window back on macOS, click the Obsidian icon in the menu bar.

### Settings

| Setting | Default | What it does |
|---|---|---|
| macOS | On | Minimize when the last tab is closed on macOS. |
| Linux | Off | Minimize when the last tab is closed on Linux. |
| Windows | Off | Minimize when the last tab is closed on Windows. |
| Minimize to menu bar | On | macOS: hide into the menu bar and the close button hides too. Off: minimize to the Dock. |

### Command

*Minimize to Menu Bar: Minimize window* minimizes the window right away. It has no default hotkey; you can assign one in *Settings → Hotkeys*.

## Disclosures

- **No network access.** The plugin makes no network requests, collects no data, has no telemetry and shows no ads.
- **No account or payment** is needed.
- **Files outside the vault (macOS only, menu bar mode):**
  - Reads Obsidian's app icon from `Obsidian.app` and saves a converted copy in the system temporary folder (`minimize-to-menu-bar-icon.png` and `minimize-to-menu-bar-icon@2x.png`).
  - Reads the Dock's list of pinned apps (`com.apple.dock` preferences, read-only) to keep the Dock icon when Obsidian is pinned.
- **System commands (macOS only, menu bar mode):** runs the built-in macOS tools `defaults` and `plutil` (read the pinned Dock apps) and `sips` (convert the icon).
- **Electron APIs (macOS only, menu bar mode):** uses Electron's `remote` module to create the menu bar item and show or hide the Dock icon. A close handler is added to the main window so the close button hides the window. Everything is removed when the plugin is disabled.
- **Obsidian internals:** wraps `WorkspaceLeaf.detach` to notice when the last tab closes. The original method is restored when the plugin is disabled.

## Installation

**From Obsidian:** *Settings → Community plugins → Browse*, search for **Minimize to Menu Bar**, then *Install* and *Enable*.

**Manually:**

1. Download `minimize-to-menu-bar-<version>.zip` from the [latest release](https://github.com/brian978/obsidian-minimize/releases/latest).
2. Unzip it into `<your vault>/.obsidian/plugins/`. It creates the `minimize-to-menu-bar` folder.
3. Enable **Minimize to Menu Bar** in *Settings → Community plugins*.

## Known limitations

- Switching layouts with Obsidian's *Workspaces* core plugin closes all tabs, which can trigger a minimize.
- Relies on Electron's `remote` module, which Obsidian currently provides.

## Development

```bash
npm install
npm run build   # outputs dist/main.js and dist/manifest.json
npm run dev     # rebuilds on every change
```

To release, bump `version` in `manifest.json`, merge, then push a tag with the same version:

```bash
git tag 1.0.2 && git push origin 1.0.2
```

The [release workflow](.github/workflows/release.yml) builds the plugin and publishes a GitHub release with `main.js` and `manifest.json` (used by Obsidian to install the plugin) and a ready-to-unzip `minimize-to-menu-bar-<version>.zip`.

## Credits

Based on [Minimize on Close](https://github.com/alberti42/obsidian-minimize-on-close) by Andrea Alberti (MIT).

## License

[MIT](LICENSE)
