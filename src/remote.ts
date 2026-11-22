// Minimal typings for the parts of Electron this plugin uses.
// Obsidian exposes the remote module as `require("electron").remote`; calls on it run in Electron's main process.

export interface NativeImage {
	isEmpty(): boolean;
}

export interface BrowserWindow {
	hide(): void;
	show(): void;
	focus(): void;
	minimize(): void;
	restore(): void;
	isMinimized(): boolean;
	isVisible(): boolean;
	isDestroyed(): boolean;
	on(event: "show", listener: () => void): void;
	removeListener(event: "show", listener: () => void): void;
}

export interface Menu {
	readonly _menu?: never;
}

export interface MenuItemOptions {
	label?: string;
	type?: "separator";
	click?: () => void;
}

export interface Tray {
	setToolTip(text: string): void;
	setTitle(text: string): void;
	popUpContextMenu(menu: Menu): void;
	on(event: "click" | "right-click", listener: () => void): void;
	isDestroyed(): boolean;
	destroy(): void;
}

export interface App {
	quit(): void;
	focus(options?: { steal: boolean }): void;
	dock?: {
		hide(): void;
		show(): Promise<void>;
	};
}

export interface Remote {
	app: App;
	getCurrentWindow(): BrowserWindow;
	Tray: new (image: NativeImage) => Tray;
	Menu: { buildFromTemplate(template: MenuItemOptions[]): Menu };
	nativeImage: {
		createFromPath(path: string): NativeImage;
		createEmpty(): NativeImage;
	};
	require(id: "vm"): { runInThisContext(code: string): unknown };
}

export const remote: Remote = (require("electron") as { remote: Remote }).remote;
