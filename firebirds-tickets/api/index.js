// Vercel serverless entry point. All /api/* requests are routed here (see vercel.json);
// static files in public/ are served by Vercel directly.
import { buildApp } from '../src/bootstrap.js';

const app = buildApp();
export default app;
