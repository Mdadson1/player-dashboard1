require('dotenv').config();
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Proxy /api/* and /health to the FastAPI backend
const API_URL = process.env.API_URL ?? 'http://localhost:8000';
app.use(
  ['/api', '/health'],
  createProxyMiddleware({ target: API_URL, changeOrigin: true })
);

app.use(express.static(path.join(__dirname, '../build')));

// SPA catch-all — must come after the proxy
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const port = process.env.PORT ?? 3000;
app.listen(port, function() {
    console.info(`Server listening on http://localhost:${port}`);
    console.info(`Proxying /api/* → ${API_URL}`);
});
