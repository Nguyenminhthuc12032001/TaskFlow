import app from './app.js';
import { loadEnv } from './config/env.js';
import { log } from './common/logger/logger.js';

try {
  const env = loadEnv();
  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
} catch (err) {
  log.error(
    { error: err instanceof Error ? err.message : String(err) },
    'Failed to start server due to invalid environment variables',
  );
  process.exit(1);
}
