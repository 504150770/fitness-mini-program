import express from 'express';
import { config } from './config';
import { healthRouter } from './routes/health.routes';
import { authRouter, devAuthRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { bodyRouter } from './routes/body.routes';
import { exerciseRouter } from './routes/exercise.routes';
import { planRouter } from './routes/plan.routes';
import { errorHandler, notFound } from './middlewares/error.middleware';

const app = express();
app.use(express.json());

if (config.isDev) {
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
  });
  app.options(/.*/, (_req, res) => res.sendStatus(204));
}

app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/body', bodyRouter);
app.use('/api/v1/exercises', exerciseRouter);
app.use('/api/v1/plans', planRouter);
if (config.isDev) {
  app.use('/api/v1/auth', devAuthRouter);
}

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[server] http://localhost:${config.port} (${config.nodeEnv})`);
});

export default app;