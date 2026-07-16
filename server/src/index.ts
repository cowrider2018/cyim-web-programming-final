import { createApp } from './app.js';
import { sqlite } from './db/client.js';
import { env } from './env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
});

function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down.`);
  server.close(() => {
    sqlite.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// A promise nobody awaited means state is unknown, so log loudly and let the
// process die rather than serving from a half-broken server.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  process.exit(1);
});
