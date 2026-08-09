---
name: Vite 6 + Replit middleware mode fix
description: Three issues that cause blank React page when cloning a Vite 6 / Tailwind v4 app into Replit
---

## Rules

### 1. allowedHosts
Vite 6.2+ added a strict host check that blocks all module/asset requests whose `Host` header isn't `localhost`/`127.0.0.1`. In Replit, the preview proxy sends a `*.replit.dev` host, triggering 403s for every JS and CSS module. Fix: add `allowedHosts: true` to the `createViteServer` call (middleware mode).

```ts
const vite = await createViteServer({
  server: { middlewareMode: true, allowedHosts: true },
  appType: 'spa'
});
```

**Why:** Without it, the browser receives the HTML but all module fetches return 403 → React never loads → blank white page.

### 2. Port + Workflow type
Replit's built-in preview pane requires `outputType: "webview"` and `waitForPort: 5000`. If the Express server runs on 3000 (hardcoded), the webview sees nothing. Fix: use `Number(process.env.PORT) || 5000` in server.ts and configure the workflow as webview on port 5000.

**Why:** console-type workflows don't appear in the Replit preview pane.

### 3. Tailwind v4 @source in middleware mode
`@tailwindcss/vite` 4.x in Vite middleware mode does NOT auto-scan source files via the module graph — it generates zero utility classes until files are processed. Fix: add explicit `@source` directives to `src/index.css`.

```css
@import "tailwindcss";
@source "./**/*.{ts,tsx}";
@source "../index.html";
```

**Why:** Without @source, Tailwind generates only its theme/preflight layer (~280KB of CSS custom properties) but no utilities. The ThemeContext immediately adds `.dark` to `<html>`, making all text white (#f8fafc from html.dark), while the background stays browser-default white (no bg-slate-950 utility) → content rendered but invisible.

## Screenshot tool limitation
The `appPreview` screenshot tool captures at `DOMContentLoaded`, which fires BEFORE `type="module"` scripts execute (ES modules are always deferred). Blank screenshots from this tool do NOT prove the app is broken — verify via curl HTTP status codes and Vite connection logs instead.
