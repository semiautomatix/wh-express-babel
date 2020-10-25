import https from 'https';
import fs from 'fs';
import debug from 'debug';

import app from './app';

const log = debug('index:log');

const { PORT = 8080, HTTPS = 'false' }: { PORT?: number, HTTPS?: string } = process.env;

log(`HTTPS ${HTTPS}`);

HTTPS === 'true' && https.createServer({
  key: fs.readFileSync('../certs/privkey.pem'),
  // key: fs.readFileSync('../certs/privatekey.pem'),
  cert: fs.readFileSync('../certs/fullchain.pem')
  // cert: fs.readFileSync('../certs/certificate.pem')
}, app)
  .listen(PORT, function () {
    log(`Listening on port ${PORT}`);
  });

HTTPS === 'false' && app.listen(PORT, () => {
  log(`Listening on port ${PORT}`);
}); // eslint-disable-line no-console
