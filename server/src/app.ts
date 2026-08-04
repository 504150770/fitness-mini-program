import express from 'express';
import { config } from './config';
import { ensureDatabase } from './config/db-init';
import { healthRouter } from './routes/health.routes';
import { authRouter, devAuthRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { bodyRouter } from './routes/body.routes';
import { exerciseRouter } from './routes/exercise.routes';
import { planRouter } from './routes/plan.routes';
import { sessionRouter } from './routes/session.routes';
import { dietRouter } from './routes/diet.routes';
import { checkinRouter } from './routes/checkin.routes';
import { homeRouter } from './routes/home.routes';
import { statsRouter } from './routes/stats.routes';
import { exportRouter } from './routes/export.routes';
import { errorHandler, notFound } from './middlewares/error.middleware';

const app = express();
app.use(express.json());

if (config.isDev || process.env.ENABLE_DEV_LOGIN === 'true') {
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
  });
  app.options(/.*/, (_req, res) => res.sendStatus(204));
}

app.use(async (_req, _res, next) => {
  await ensureDatabase();
  next();
});

app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/body', bodyRouter);
app.use('/api/v1/exercises', exerciseRouter);
app.use('/api/v1/plans', planRouter);
app.use('/api/v1/sessions', sessionRouter);
app.use('/api/v1/diet', dietRouter);
app.use('/api/v1/checkins', checkinRouter);
app.use('/api/v1/home', homeRouter);
app.use('/api/v1/stats', statsRouter);
app.use('/api/v1/export', exportRouter);
if (config.isDev || process.env.ENABLE_DEV_LOGIN === 'true') {
  app.use('/api/v1/auth', devAuthRouter);
}

app.use(notFound);
app.use(errorHandler);

if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`[server] http://localhost:${config.port} (${config.nodeEnv})`);
  });
}

export default app;