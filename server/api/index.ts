import app from '../src/app';
import { ensureDatabase } from '../src/config/db-init';

ensureDatabase().catch(console.error);

export default app;