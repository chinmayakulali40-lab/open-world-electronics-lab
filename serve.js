const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8085;
const BACKEND_PORT = 5000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

// In-memory OTP storage for mock/fallback handlers
const otpStore = new Map();

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
};

const handleMockOtp = (req, res, pathname, body) => {
  setCorsHeaders(res);

  if (pathname.includes('/phone/send-otp') || pathname.endsWith('/send-otp')) {
    const phone = body.phone || body.phoneNumber || body.mobile || '';
    if (!phone) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Phone number is required' }));
    }
    const cleanPhone = phone.toString().trim();
    const code = '123456';
    otpStore.set(cleanPhone, code);
    console.log(`[Frontend Dev Server] OTP for ${cleanPhone} is: ${code}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      message: 'OTP sent successfully',
      otp: code
    }));
  }

  if (pathname.includes('/phone/verify-otp') || pathname.endsWith('/verify-otp')) {
    const phone = body.phone || body.phoneNumber || body.mobile || '';
    const otp = (body.otp || body.code || '').toString().trim();

    if (!phone || !otp) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Phone and OTP are required' }));
    }

    const cleanPhone = phone.toString().trim();
    const storedOtp = otpStore.get(cleanPhone);
    const isValid = otp === '123456' || otp === storedOtp || /^\d{6}$/.test(otp);

    if (!isValid) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid verification code. Please enter 123456 or a valid 6-digit code.' }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      message: 'Mobile number verified successfully',
      user: {
        phone: cleanPhone,
        role: 'student'
      },
      token: 'mock-jwt-token'
    }));
  }

  return false;
};

const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  // Handle API requests
  if (pathname.startsWith('/api') || pathname.startsWith('/auth')) {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', () => {
      let parsedBody = {};
      try {
        if (bodyData) parsedBody = JSON.parse(bodyData);
      } catch (e) {}

      // Try proxying to backend server on port 5000
      const proxyReq = http.request({
        hostname: '127.0.0.1',
        port: BACKEND_PORT,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: `127.0.0.1:${BACKEND_PORT}`
        }
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('error', () => {
        // Backend not running on 5000: fallback to mock OTP handler
        const handled = handleMockOtp(req, res, pathname, parsedBody);
        if (!handled) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Backend service on port ${BACKEND_PORT} unavailable and no mock for ${pathname}` }));
        }
      });

      if (bodyData) {
        proxyReq.write(bodyData);
      }
      proxyReq.end();
    });
    return;
  }

  // Static file serving
  let reqPath = pathname;
  if (reqPath === '/' || !reqPath) reqPath = '/index.html';
  let filePath = path.join(__dirname, 'frontend', reqPath);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    filePath = path.join(__dirname, reqPath);
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // SPA fallback: return index.html for unknown client routes
    const indexPath = path.join(__dirname, 'frontend', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(indexPath).pipe(res);
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Frontend server running at http://localhost:${PORT}`);
  console.log(`- Proxies /api/* requests to backend on port ${BACKEND_PORT}`);
  console.log(`- Built-in fallback mock for Phone OTP routes`);
});
