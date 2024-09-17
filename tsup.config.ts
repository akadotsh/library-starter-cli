import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  entry: ["bin/index.ts"],
  format: ["esm"],
  target: "esnext",
  outDir: "dist/bin",
});
