/**
 * Simple Mock Power Meter Server (no dependencies)
 */

import http from 'http';

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');

  // Simple meter - no authentication
  if (req.url === '/simple-meter') {
    const currentKwh = 12543.5;
    res.writeHead(200);
    res.end(`
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Power Meter</h1>
          <div class="consumption-value">${currentKwh}</div>
        </body>
      </html>
    `);
    return;
  }

  // Meter with formatted value
  if (req.url === '/formatted-meter') {
    res.writeHead(200);
    res.end(`
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Energy Monitor</h1>
          <div class="total-kwh">Total: 11,234.56 kWh</div>
        </body>
      </html>
    `);
    return;
  }

  // Not found
  res.writeHead(404);
  res.end('Not found');
});

const PORT = 3500;
server.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
  console.log('Endpoints: /simple-meter, /formatted-meter');
});
