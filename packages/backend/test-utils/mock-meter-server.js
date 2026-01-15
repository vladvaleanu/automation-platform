/**
 * Mock Power Meter HTTP Server
 * Simulates different power meter web interfaces for testing
 */

import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Simple meter - no authentication, value on main page
app.get('/simple-meter', (req, res) => {
  const currentKwh = 12543.5;
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Simple Power Meter</title></head>
      <body>
        <h1>Power Meter Dashboard</h1>
        <div class="consumption-value">${currentKwh} kWh</div>
        <p>Total consumption: ${currentKwh} kWh</p>
      </body>
    </html>
  `);
});

// HTTP Basic Auth meter
const basicAuthMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Power Meter"');
    return res.status(401).send('Authentication required');
  }

  const [type, credentials] = auth.split(' ');
  if (type !== 'Basic') {
    return res.status(401).send('Invalid auth type');
  }

  const [username, password] = Buffer.from(credentials, 'base64').toString().split(':');
  if (username === 'admin' && password === 'secret123') {
    next();
  } else {
    res.status(401).send('Invalid credentials');
  }
};

app.get('/basic-auth-meter', basicAuthMiddleware, (req, res) => {
  const currentKwh = 8234.2;
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Secure Power Meter</title></head>
      <body>
        <h1>Authenticated Meter</h1>
        <div id="total-kwh">${currentKwh}</div>
      </body>
    </html>
  `);
});

// Form login meter with session
const sessions = new Map();

app.get('/form-login-meter', (req, res) => {
  const sessionId = req.headers.cookie?.match(/sessionId=([^;]+)/)?.[1];

  if (sessionId && sessions.has(sessionId)) {
    // Logged in - show dashboard
    const currentKwh = 15678.9;
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Power Meter Dashboard</title></head>
        <body>
          <h1>Welcome, ${sessions.get(sessionId)}</h1>
          <div class="metrics">
            <span id="total-consumption">${currentKwh} kWh</span>
            <span id="voltage">230 V</span>
            <span id="current">15.5 A</span>
            <span id="power">3565 W</span>
          </div>
        </body>
      </html>
    `);
  } else {
    // Not logged in - show login form
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Login</title></head>
        <body>
          <h1>Power Meter Login</h1>
          <form method="POST" action="/form-login-meter/login">
            <input type="text" name="username" id="username" placeholder="Username" />
            <input type="password" name="password" id="password" placeholder="Password" />
            <button type="submit" id="login-btn">Login</button>
          </form>
        </body>
      </html>
    `);
  }
});

app.post('/form-login-meter/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'meter-admin' && password === 'meter-pass') {
    const sessionId = Math.random().toString(36).substring(7);
    sessions.set(sessionId, username);

    res.setHeader('Set-Cookie', `sessionId=${sessionId}; Path=/`);
    res.redirect('/form-login-meter');
  } else {
    res.status(401).send('Invalid credentials');
  }
});

// Multi-step navigation meter (tabs)
app.get('/tabbed-meter', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Advanced Meter</title>
        <script>
          function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
            document.getElementById(tabName).style.display = 'block';
          }
        </script>
      </head>
      <body>
        <h1>Power Meter Control Panel</h1>
        <div class="tabs">
          <button onclick="showTab('overview')">Overview</button>
          <button onclick="showTab('consumption')" id="consumption-tab">Consumption</button>
          <button onclick="showTab('settings')">Settings</button>
        </div>

        <div id="overview" class="tab-content" style="display:block">
          <p>System Status: Online</p>
        </div>

        <div id="consumption" class="tab-content" style="display:none">
          <h2>Energy Consumption</h2>
          <p>Total: <span id="total-kwh">9876.3 kWh</span></p>
          <p>Monthly: <span class="monthly-kwh">234.5 kWh</span></p>
        </div>

        <div id="settings" class="tab-content" style="display:none">
          <p>Settings panel</p>
        </div>
      </body>
    </html>
  `);
});

// Meter with complex value format
app.get('/formatted-meter', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Formatted Meter</title></head>
      <body>
        <h1>Energy Monitor</h1>
        <table>
          <tr>
            <td>Total Consumption:</td>
            <td class="consumption-cell">Total: 11,234.56 kWh (Updated: 2026-01-10)</td>
          </tr>
          <tr>
            <td>Voltage:</td>
            <td>230.5 V</td>
          </tr>
        </table>
      </body>
    </html>
  `);
});

// Failing meter (simulates error conditions)
let failureCount = 0;
app.get('/unreliable-meter', (req, res) => {
  failureCount++;

  if (failureCount % 3 === 0) {
    // Every 3rd request succeeds
    res.send(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="kwh">5432.1</div>
        </body>
      </html>
    `);
  } else {
    // Simulate various failures
    if (failureCount % 2 === 0) {
      res.status(500).send('Internal Server Error');
    } else {
      res.status(503).send('Service Unavailable');
    }
  }
});

// Start server
const PORT = 3500;
const server = app.listen(PORT, () => {
  console.log(`Mock Power Meter Server running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('  - /simple-meter           (no auth)');
  console.log('  - /basic-auth-meter       (HTTP Basic: admin/secret123)');
  console.log('  - /form-login-meter       (Form login: meter-admin/meter-pass)');
  console.log('  - /tabbed-meter           (requires clicking tabs)');
  console.log('  - /formatted-meter        (complex number format)');
  console.log('  - /unreliable-meter       (fails 2/3 of the time)');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down mock server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
