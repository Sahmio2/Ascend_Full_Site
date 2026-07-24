import type { Plugin } from "vite";

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
  };
}
