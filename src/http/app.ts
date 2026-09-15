import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';
import type { Pool } from 'pg';
import type { Config } from '../config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { academicYearRoutes } from './routes/academicYearRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { classRoutes } from './routes/classRoutes.js';
import { sectionRoutes } from './routes/sectionRoutes.js';
import { setupRoutes } from './routes/setupRoutes.js';
import { staffRoutes } from './routes/staffRoutes.js';
import { studentRoutes } from './routes/studentRoutes.js';
import { notFound } from './errors.js';

export function createApp(config: Config, pool?: Pool): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // A page at /demo that exercises the API in a browser: useful for showing
  // the tenant boundary and the role rules working without reading JSON by
  // hand. It is a development aid, not product UI — the real screens arrive
  // with the SIS story — so it is not served in production.
  if (process.env.NODE_ENV !== 'production') {
    const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');
    app.use('/demo', express.static(publicDir, { index: 'demo.html' }));
  }
  app.use('/auth', authRoutes(config, pool));
  app.use('/setup', setupRoutes(config, pool));
  app.use('/academic-years', academicYearRoutes(config, pool));
  app.use('/classes', classRoutes(config, pool));
  app.use('/sections', sectionRoutes(config, pool));
  app.use('/staff', staffRoutes(config, pool));
  app.use('/students', studentRoutes(config, pool));

  app.use((_req, _res, next) => next(notFound('No such endpoint')));
  app.use(errorHandler());
  return app;
}
