// macOS only: hide the main window into a menu bar item instead of minimizing it to the Dock.

import { execFile } from "child_process";
import { existsSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { Notice } from "obsidian";
import { BrowserWindow, remote, Tray } from "./remote";

// Runs in Electron's MAIN process: a window close can only be cancelled synchronously there
// (a preventDefault() sent over the remote bridge arrives too late).
// Quitting (Cmd+Q, logout, ...) fires "before-quit" first and is still allowed to close the window.
// The release function is stored on the window so a reloaded renderer replaces a stale guard instead of stacking a second one.
const MAIN_PROCESS_CLOSE_GUARD = `(function(win, app, onCloseRequested) {
	const KEY = "__minimizeToMenuBarReleaseCloseGuard";
	if(typeof win[KEY] === "function") win[KEY]();
	let quitting = false;
	const onQuit = () => { quitting = true; };
	const onClose = (event) => {
		if(quitting || win.isDestroyed()) return;
		event.preventDefault();
		try { onCloseRequested(); } catch(error) { release(); win.close(); }
	};
	function release() {
		win.removeListener("close", onClose);
		app.removeListener("before-quit", onQuit);
		if(win[KEY] === release) delete win[KEY];
	}
	app.on("before-quit", onQuit);
	win.on("close", onClose);
	win[KEY] = release;
	return release;
})`;

// Only the pinned Dock tiles. The full Dock plist contains <data>/<date> values, so it is matched as XML text rather than parsed.
const DOCK_PINNED_APPS_QUERY = "/usr/bin/defaults export com.apple.dock - | /usr/bin/plutil -extract persistent-apps xml1 -o - -";

export class MenuBarMinimizer {
	private tray: Tray | null = null;
	private win: BrowserWindow | null = null;
	private busy = false;
	private releaseCloseGuard: (() => void) | null = null;

	private readonly onWindowShown = () => { void this.restore(); };
	// If the page reloads or crashes, leave the window closable and the app reachable
	private readonly onBeforeUnload = () => { this.dispose(); };

	private get active(): boolean { return this.tray !== null; }

	/** Make the window's close button hide the window to the menu bar instead of closing it. */
	interceptWindowClose(): void {
		if(this.releaseCloseGuard) return;
		try {
			const install = remote.require("vm").runInThisContext(MAIN_PROCESS_CLOSE_GUARD) as
				(win: BrowserWindow, app: typeof remote.app, onCloseRequested: () => void) => () => void;
			this.releaseCloseGuard = install(remote.getCurrentWindow(), remote.app, () => { void this.minimize(); });
			window.addEventListener("beforeunload", this.onBeforeUnload);
		} catch(error) {
			console.error("Minimize to Menu Bar: could not intercept the window close button", error);
			new Notice("Minimize to Menu Bar: could not intercept the close button.");
		}
	}

	stopInterceptingWindowClose(): void {
		if(!this.releaseCloseGuard) return;
		try { this.releaseCloseGuard(); } catch { /* window already gone */ }
		this.releaseCloseGuard = null;
	}

	async minimize(): Promise<void> {
		if(this.active || this.busy) return;
		this.busy = true;
		try {
			const [pinned, iconPath] = await Promise.all([isPinnedToDock(), prepareAppIcon()]);
			const win = remote.getCurrentWindow();
			this.win = win;
			this.tray = this.createTray(iconPath);
			win.on("show", this.onWindowShown);
			window.addEventListener("beforeunload", this.onBeforeUnload);

			win.hide();
			// A pinned app keeps its Dock tile; otherwise remove it from the Dock
			if(!pinned) remote.app.dock?.hide();
		} catch(error) {
			console.error("Minimize to Menu Bar: falling back to a normal minimize", error);
			new Notice("Minimize to Menu Bar failed, minimizing to the Dock instead.");
			this.removeTray();
			remote.app.dock?.show();
			remote.getCurrentWindow().minimize();
		} finally {
			this.busy = false;
		}
	}

	async restore(): Promise<void> {
		if(!this.active) return;
		const win = this.win;
		this.removeTray();
		try {
			await remote.app.dock?.show();
		} catch { /* already visible */ }
		if(win && !win.isDestroyed()) {
			if(win.isMinimized()) win.restore();
			win.show();
			win.focus();
		}
		remote.app.focus({ steal: true });
	}

	/** Release everything and leave the window and the Dock in a usable state. */
	dispose(): void {
		this.stopInterceptingWindowClose();
		window.removeEventListener("beforeunload", this.onBeforeUnload);
		if(!this.active) return;
		const win = this.win;
		this.removeTray();
		remote.app.dock?.show();
		if(win && !win.isDestroyed() && !win.isVisible()) win.show();
	}

	private removeTray(): void {
		if(this.win && !this.win.isDestroyed()) this.win.removeListener("show", this.onWindowShown);
		if(this.tray && !this.tray.isDestroyed()) this.tray.destroy();
		this.tray = null;
	}

	private createTray(iconPath: string | null): Tray {
		// Loaded from disk by Electron itself (image buffers get corrupted crossing the remote bridge).
		// The sibling "@2x" file is picked up automatically on Retina screens.
		const image = iconPath ? remote.nativeImage.createFromPath(iconPath) : remote.nativeImage.createEmpty();
		const tray = new remote.Tray(image);
		tray.setToolTip("Obsidian");
		// Never leave an invisible menu bar item
		if(image.isEmpty()) tray.setTitle("Obsidian");

		const menu = remote.Menu.buildFromTemplate([
			{ label: "Show Obsidian", click: () => { void this.restore(); } },
			{ type: "separator" },
			{ label: "Quit Obsidian", click: () => { remote.app.quit(); } },
		]);

		// Left click brings the window back; right click opens the menu
		tray.on("click", () => { void this.restore(); });
		tray.on("right-click", () => { tray.popUpContextMenu(menu); });
		return tray;
	}
}

function appBundlePath(): string {
	return process.execPath.split(".app/")[0] + ".app";
}

function run(file: string, args: string[]): Promise<string> {
	return new Promise((resolve, reject) => {
		execFile(file, args, { timeout: 5000 }, (error, stdout) => error ? reject(error) : resolve(stdout));
	});
}

let appIconPromise: Promise<string | null> | null = null;

/**
 * Obsidian's own colour icon for the menu bar. Electron cannot decode the app's .icns, so it is converted
 * once per session with macOS' sips: crop the transparent padding around the tile (1024 -> 840 px),
 * then scale to 20 pt at 1x (20 px) and @2x (40 px).
 */
function prepareAppIcon(): Promise<string | null> {
	// macOS purges the temp folder now and then, so regenerate the icon if the converted files have gone
	const icon1x = join(tmpdir(), "minimize-to-menu-bar-icon.png");
	const icon2x = join(tmpdir(), "minimize-to-menu-bar-icon@2x.png");
	if(appIconPromise && !(existsSync(icon1x) && existsSync(icon2x))) appIconPromise = null;
	if(!appIconPromise) {
		appIconPromise = (async () => {
			const icns = appBundlePath() + "/Contents/Resources/icon.icns";
			if(!existsSync(icns)) return null;
			const cropped = join(tmpdir(), "minimize-to-menu-bar-icon-crop.png");
			try {
				await run("/usr/bin/sips", ["-s", "format", "png", "--cropToHeightWidth", "840", "840", icns, "--out", cropped]);
				await run("/usr/bin/sips", ["-Z", "20", cropped, "--out", icon1x]);
				await run("/usr/bin/sips", ["-Z", "40", cropped, "--out", icon2x]);
				return icon1x;
			} catch {
				appIconPromise = null; // try again next time
				return null;
			} finally {
				try { unlinkSync(cropped); } catch { /* ignore */ }
			}
		})();
	}
	return appIconPromise;
}

/** True if Obsidian has a pinned tile in the Dock. */
async function isPinnedToDock(): Promise<boolean> {
	let xml: string;
	try {
		xml = await run("/bin/sh", ["-c", DOCK_PINNED_APPS_QUERY]);
	} catch {
		return false;
	}
	const bundlePath = appBundlePath();
	// Every pinned tile carries its bundle identifier and file URL as plain <string> values
	return Array.from(xml.matchAll(/<string>([^<]*)<\/string>/g), (match) => match[1]).some((value) => {
		if(value === "md.obsidian") return true;
		if(!value.startsWith("file://")) return false;
		try {
			return decodeURIComponent(value.slice("file://".length)).replace(/\/$/, "") === bundlePath;
		} catch {
			return false;
		}
	});
}
