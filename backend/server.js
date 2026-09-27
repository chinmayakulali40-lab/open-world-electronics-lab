const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount Auth routes (supports /api/auth/phone/send-otp, /api/phone/send-otp, /auth/phone/send-otp, etc.)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
app.use('/api/phone', authRoutes);
app.use('/api', authRoutes);
app.use('/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ONLINE', service: 'Open-World Electronics Lab Backend', time: new Date() });
});

// Serve frontend if available
const frontendPath = path.resolve(__dirname, '../frontend');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
    next();
  });
}

// Global 404 for unhandled API requests
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`- POST /api/auth/phone/send-otp`);
  console.log(`- POST /api/auth/phone/verify-otp`);
});

module.exports = app;
