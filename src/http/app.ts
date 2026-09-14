import express, { type Express } from 'express';
import type { Pool } from 'pg';
import type { Config } from '../config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/authRoutes.js';
import { studentRoutes } from './routes/studentRoutes.js';
import { notFound } from './errors.js';

export function createApp(config: Config, pool?: Pool): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/auth', authRoutes(config, pool));
  app.use('/students', studentRoutes(config, pool));

  app.use((_req, _res, next) => next(notFound('No such endpoint')));
  app.use(errorHandler());
  return app;
}
