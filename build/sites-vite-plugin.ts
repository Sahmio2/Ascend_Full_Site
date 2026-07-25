import type { Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";

export function sites(): Plugin {
  return {
    name: "sites-vite-plugin",
    transformIndexHtml(html) {
      if (!html.includes('name="codex-preview"')) {
        return html.replace(
          /<head>/i,
          '<head>\n    <meta name="codex-preview" content="development">'
        );
      }
      return html;
    },
    closeBundle() {
      const src = path.resolve(process.cwd(), ".openai/hosting.json");
      const destDir = path.resolve(process.cwd(), "dist/.openai");
      const dest = path.resolve(destDir, "hosting.json");
      if (fs.existsSync(src)) {
        fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(src, dest);
      }
    },
  };
}

