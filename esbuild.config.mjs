import esbuild from "esbuild";
import { copyFileSync, mkdirSync } from "fs";
import { builtinModules } from "module";

const prod = process.argv[2] === "production";
const outdir = "dist";

mkdirSync(outdir, { recursive: true });
copyFileSync("manifest.json", `${outdir}/manifest.json`);

const context = await esbuild.context({
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: ["obsidian", "electron", ...builtinModules],
	format: "cjs",
	target: "es2022",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	minify: prod,
	treeShaking: true,
	outfile: `${outdir}/main.js`,
});

if(prod) {
	await context.rebuild();
	await context.dispose();
} else {
	await context.watch();
}
