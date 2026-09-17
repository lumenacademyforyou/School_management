import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

// Three separately built and deployed apps. Pick one with --mode:
//   admin (default) -> index.html          -> dist/admin
//   parent          -> apps/parent/        -> dist/parent
//   teacher         -> apps/teacher/       -> dist/teacher
//   apps (dev only) -> both phone apps on one origin (/parent/, /teacher/) so they share the demo store
const APPS = {
  admin: '.',
  parent: 'apps/parent',
  teacher: 'apps/teacher',
  apps: 'apps',
} as const;
type AppName = keyof typeof APPS;

/** The admin dev server must not serve the parent or teacher apps. */
const hideOtherApps = (): Plugin => ({
  name: 'lumen-hide-other-apps',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.startsWith('/apps/')) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      next();
    });
  },
});

export default defineConfig(({mode}) => {
  const app: AppName = mode in APPS ? (mode as AppName) : 'admin';
  const root = path.resolve(__dirname, APPS[app]);
  return {
    root,
    base: './',
    envDir: __dirname,
    // Each app keeps its own pre-bundle cache so running all three together doesn't thrash it.
    cacheDir: path.resolve(__dirname, 'node_modules/.vite', app),
    publicDir: path.resolve(__dirname, 'public'),
    plugins: [react(), tailwindcss(), ...(app === 'admin' ? [hideOtherApps()] : [])],
    build: {
      outDir: path.resolve(__dirname, 'dist', app),
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      fs: {allow: [__dirname]},
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      port: {admin: 4000, parent: 4001, teacher: 4002, apps: 4003}[app],
    },
  };
});
