import { App, Platform, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from "obsidian";
import { MenuBarMinimizer } from "./menubar";
import { remote } from "./remote";

interface Settings {
	mac: boolean;
	linux: boolean;
	win: boolean;
	/** macOS: hide to a menu bar item (and out of the Dock) instead of minimizing to the Dock */
	menuBar: boolean;
}

const DEFAULT_SETTINGS: Settings = {
	mac: true,
	linux: false,
	win: false,
	menuBar: true,
};

export default class MinimizeToMenuBar extends Plugin {
	settings: Settings = { ...DEFAULT_SETTINGS };
	private menuBar = new MenuBarMinimizer();
	private unpatchDetach: (() => void) | null = null;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new MinimizeSettingTab(this.app, this));

		this.addCommand({
			id: "minimize-window",
			name: "Minimize window",
			callback: () => this.minimizeMainWindow(),
		});

		this.app.workspace.onLayoutReady(() => {
			this.patchLeafDetach();
			this.applySettings();
		});
	}

	onunload() {
		this.unpatchDetach?.();
		this.menuBar.dispose();
	}

	async onExternalSettingsChange() {
		await this.loadSettings();
		this.applySettings();
	}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<Settings> | null;
		this.settings = {
			mac: data?.mac ?? DEFAULT_SETTINGS.mac,
			linux: data?.linux ?? DEFAULT_SETTINGS.linux,
			win: data?.win ?? DEFAULT_SETTINGS.win,
			menuBar: data?.menuBar ?? DEFAULT_SETTINGS.menuBar,
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.applySettings();
	}

	private get enabledOnThisPlatform(): boolean {
		return (Platform.isMacOS && this.settings.mac)
			|| (Platform.isLinux && this.settings.linux)
			|| (Platform.isWin && this.settings.win);
	}

	private get useMenuBar(): boolean {
		return Platform.isMacOS && this.settings.mac && this.settings.menuBar;
	}

	/** On macOS in menu bar mode, the window's close button hides to the menu bar too. */
	private applySettings() {
		if(this.useMenuBar) {
			this.menuBar.interceptWindowClose();
		} else {
			this.menuBar.stopInterceptingWindowClose();
		}
	}

	minimizeMainWindow() {
		if(this.useMenuBar) {
			void this.menuBar.minimize();
		} else {
			remote.getCurrentWindow().minimize();
		}
	}

	/** Minimize when the last tab of the main window's editor area is being closed. */
	private onLeafClosing(leaf: WorkspaceLeaf) {
		if(!this.enabledOnThisPlatform) return;
		const workspace = this.app.workspace;
		// Ignore sidebars and pop-out windows
		if(leaf.getRoot() !== workspace.rootSplit) return;
		let tabs = 0;
		workspace.iterateRootLeaves(() => { tabs++; });
		if(tabs <= 1) this.minimizeMainWindow();
	}

	private patchLeafDetach() {
		if(this.unpatchDetach) return;
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const plugin = this;
		const original = WorkspaceLeaf.prototype.detach;
		let active = true;
		const patched = function(this: WorkspaceLeaf) {
			if(active) plugin.onLeafClosing(this);
			return original.call(this);
		};
		WorkspaceLeaf.prototype.detach = patched;
		this.unpatchDetach = () => {
			active = false;
			// Only restore if nobody wrapped the method after us; otherwise our wrapper just stays inert
			if(WorkspaceLeaf.prototype.detach === patched) WorkspaceLeaf.prototype.detach = original;
			this.unpatchDetach = null;
		};
	}
}

class MinimizeSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: MinimizeToMenuBar) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const toggle = (name: string, desc: string, key: keyof Settings) => {
			new Setting(containerEl).setName(name).setDesc(desc).addToggle((t) => t
				.setValue(this.plugin.settings[key])
				.onChange(async (value) => {
					this.plugin.settings[key] = value;
					await this.plugin.saveSettings();
				}));
		};

		new Setting(containerEl).setName("Minimize when the last tab is closed").setHeading();
		toggle("macOS", "Minimize the window when the last tab is closed on macOS.", "mac");
		toggle("Linux", "Minimize the window when the last tab is closed on Linux.", "linux");
		toggle("Windows", "Minimize the window when the last tab is closed on Windows.", "win");

		new Setting(containerEl).setName("macOS").setHeading();
		toggle(
			"Minimize to menu bar",
			"Hide the window into a menu bar item and remove Obsidian from the Dock (it stays if pinned to the Dock). "
				+ "The window's close button does the same. Click the menu bar item to bring the window back.",
			"menuBar",
		);
	}
}
