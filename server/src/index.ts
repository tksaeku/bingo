import 'dotenv/config';
import { createApp } from './app';
import { parsePort } from './config';
import { createLogger } from './logger';

const logger = createLogger('server');
const port = parsePort(process.env.PORT);

if (!process.env.ADMIN_KEY) {
  logger.warn({}, 'ADMIN_KEY is not set; admin endpoints will return 503');
}

createApp().listen(port, () => {
  logger.info({ port }, 'Server listening');
});
