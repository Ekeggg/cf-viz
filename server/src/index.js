import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from './db.js';
import routes from './routes.js';

const app = express();
app.use(cors());
app.use('/api', routes);

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const port = process.env.PORT || 4000;
migrate()
  .then(() => app.listen(port, () => console.log(`api on :${port}`)))
  .catch((e) => {
    console.error('Database setup failed. Is Postgres running and DATABASE_URL correct?\n', e.message);
    process.exit(1);
  });
