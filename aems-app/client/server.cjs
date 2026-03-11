const https = require('https');
const { readFileSync, existsSync } = require('fs');
const { parse } = require('url');
const next = require('next');
const { execSync } = require('child_process');
const path = require('path');

// Set environment variables for certificate handling
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.NODE_EXTRA_CA_CERTS = path.join(__dirname, 'mkcert-ca.crt');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Certificate paths
const certFiles = {
  key: path.join(__dirname, 'mkcert-hostname.key'),
  cert: path.join(__dirname, 'mkcert-hostname.crt'),
  ca: path.join(__dirname, 'mkcert-ca.crt'),
};

// Copy certificates if they don't exist
const missingCerts = Object.entries(certFiles).filter(([, file]) => !existsSync(file));

if (missingCerts.length > 0) {
  console.log('📜 Certificates missing, copying from Docker...\n');
  try {
    execSync('node copy-certs.cjs', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to copy certificates.');
    console.error('   Make sure Docker containers are running.');
    process.exit(1);
  }
}

// Verify certificates exist after copy attempt
if (!existsSync(certFiles.cert) || !existsSync(certFiles.key)) {
  console.error('❌ Error: Certificate files not found.');
  console.error('   Expected files:');
  console.error(`   - ${certFiles.cert}`);
  console.error(`   - ${certFiles.key}`);
  console.error('\n   Run "node copy-certs.cjs" manually to debug.');
  process.exit(1);
}

// Configure HTTPS options
const httpsOptions = {
  key: readFileSync(certFiles.key),
  cert: readFileSync(certFiles.cert),
};

// Patch https module to ignore certificate validation for outgoing requests
https.globalAgent.options.rejectUnauthorized = false;
const originalRequest = https.request;
https.request = function (...args) {
  if (typeof args[0] === 'object' && args[0] !== null) {
    args[0].rejectUnauthorized = false;
  }
  return originalRequest.apply(this, args);
};

console.log('🚀 Starting Next.js HTTPS development server...\n');

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  https.createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`✅ Server ready!`);
    console.log(`   - Local:    https://localhost:${port}`);
    console.log(`   - Network:  https://${hostname}:${port}`);
    console.log(`   - Access:   https://172.31.32.1:${port}`);
    console.log(`\n🔐 Using Docker certificates for HTTPS`);
    console.log(`🍪 Session sharing with Docker client enabled\n`);
  });
}).catch((err) => {
  console.error('❌ Error starting server:', err);
  process.exit(1);
});
