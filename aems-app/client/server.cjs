const https = require('https');
const { readFileSync, existsSync, unlinkSync } = require('fs');
const { parse } = require('url');
const { URL } = require('url');
const { execSync } = require('child_process');
const path = require('path');

// Set environment variables for certificate handling BEFORE importing next
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.NODE_EXTRA_CA_CERTS = path.join(__dirname, 'mkcert-ca.crt');

// Dynamically find Docker containers
function findProxyContainer() {
  try {
    const output = execSync('docker ps --format "{{.Names}}" --filter "name=-proxy"', { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const containers = output.trim().split('\n').filter(name => name.endsWith('-proxy'));
    return containers.length > 0 ? containers[0] : null;
  } catch (error) {
    return null;
  }
}

function findServerContainer() {
  try {
    const output = execSync('docker ps --format "{{.Names}}" --filter "name=-server"', { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const containers = output.trim().split('\n').filter(name => name.endsWith('-server'));
    return containers.length > 0 ? containers[0] : null;
  } catch (error) {
    return null;
  }
}

// Get Docker hostname from container environment
function getDockerHostname(containerName) {
  try {
    const cmd = `docker inspect ${containerName} --format "{{range .Config.Env}}{{println .}}{{end}}"`;
    const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    
    // Try to extract hostname from CORS_ORIGIN (e.g., "https://pol.local")
    const corsMatch = output.match(/CORS_ORIGIN=https?:\/\/([^:\s\/]+)/);
    if (corsMatch) {
      return corsMatch[1].trim();
    }
    
    // Fallback: try KEYCLOAK_ISSUER_URL
    const keycloakMatch = output.match(/KEYCLOAK_ISSUER_URL=https?:\/\/([^:\s\/]+)/);
    if (keycloakMatch) {
      return keycloakMatch[1].trim();
    }
    
    // Last resort: try plain HOSTNAME variable (unlikely to be useful)
    const hostnameMatch = output.match(/HOSTNAME=(.+)/);
    if (hostnameMatch) {
      const hostname = hostnameMatch[1].trim();
      // Reject docker internal hostnames like 0.0.0.0, 127.0.0.1, localhost
      if (hostname !== '0.0.0.0' && hostname !== '127.0.0.1' && hostname !== 'localhost') {
        return hostname;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Get hostname from Docker containers or environment
function getHostname() {
  // First, try to get hostname from server container (most reliable)
  const serverContainer = findServerContainer();
  if (serverContainer) {
    const hostname = getDockerHostname(serverContainer);
    if (hostname) {
      return { source: 'server', container: serverContainer, hostname };
    }
  }
  
  // Fallback to proxy container
  const proxyContainer = findProxyContainer();
  if (proxyContainer) {
    const hostname = getDockerHostname(proxyContainer);
    if (hostname) {
      return { source: 'proxy', container: proxyContainer, hostname };
    }
  }
  
  // Fallback to process.env.HOSTNAME (from client/.env)
  if (process.env.HOSTNAME && process.env.HOSTNAME !== 'localhost') {
    return { source: 'env', hostname: process.env.HOSTNAME };
  }
  
  return null;
}

// Extract hostname from certificate using openssl
function getCertificateHostname(certPath) {
  try {
    const cmd = `openssl x509 -in "${certPath}" -noout -text`;
    const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    
    // Look for DNS entries in Subject Alternative Name
    const sanMatch = output.match(/DNS:([^,\s]+)/);
    if (sanMatch) {
      return sanMatch[1];
    }
    
    // Fallback to CN in subject
    const cnMatch = output.match(/Subject:.*CN\s*=\s*([^,\n]+)/);
    if (cnMatch) {
      return cnMatch[1].trim();
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Replace hostname in URL while preserving protocol, port, path, etc.
function replaceHostname(url, newHostname) {
  try {
    const parsed = new URL(url);
    parsed.hostname = newHostname;
    return parsed.toString();
  } catch (error) {
    return url;
  }
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Certificate paths
const certFiles = {
  key: path.join(__dirname, 'mkcert-hostname.key'),
  cert: path.join(__dirname, 'mkcert-hostname.crt'),
  ca: path.join(__dirname, 'mkcert-ca.crt'),
};

// Check for Docker backend and get hostname
console.log('🔍 Checking Docker backend...');
const hostnameInfo = getHostname();
const proxyContainer = findProxyContainer();
let dockerHostname = null;

if (hostnameInfo) {
  dockerHostname = hostnameInfo.hostname;
  
  if (hostnameInfo.source === 'server') {
    console.log(`   Found: ${hostnameInfo.container} (${dockerHostname})`);
  } else if (hostnameInfo.source === 'proxy') {
    console.log(`   Found: ${hostnameInfo.container} (${dockerHostname})`);
  } else if (hostnameInfo.source === 'env') {
    console.log(`   Using hostname from environment: ${dockerHostname}`);
  }
  
  // Validate existing certificates against Docker hostname
  if (existsSync(certFiles.cert)) {
    const certHostname = getCertificateHostname(certFiles.cert);
    if (certHostname && certHostname !== dockerHostname) {
      console.log(`\n⚠️  Warning: Certificate hostname mismatch`);
      console.log(`   Certificate is for: ${certHostname}`);
      console.log(`   Configuration uses: ${dockerHostname}`);
      console.log(`   🔄 Deleting outdated certificates...\n`);
      
      // Delete all certificate files to force recopy
      Object.values(certFiles).forEach(file => {
        if (existsSync(file)) {
          unlinkSync(file);
        }
      });
    } else {
      console.log('');
    }
  } else {
    console.log('');
  }
} else if (proxyContainer) {
  console.log(`   Found: ${proxyContainer} (hostname not configured)`);
  console.log(`   Using local development mode\n`);
} else {
  console.log(`   No Docker containers found`);
  console.log(`   Using local development mode\n`);
}

// Copy certificates if they don't exist
const missingCerts = Object.entries(certFiles).filter(([, file]) => !existsSync(file));

if (missingCerts.length > 0) {
  console.log('📜 Certificates missing, copying from Docker...\n');
  try {
    execSync('node copy-certs.cjs', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
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

// Auto-configure API URLs if Docker hostname is available and not localhost
if (dockerHostname && dockerHostname !== 'localhost') {
  console.log(`🔗 Configuring API endpoints for Docker backend: ${dockerHostname}`);
  
  // Replace hostname in all REWRITE_* environment variables
  const rewriteVars = {
    'REWRITE_AUTHJS_URL': 'Auth',
    'REWRITE_GRAPHQL_URL': 'GraphQL',
    'REWRITE_API_URL': 'API',
    'REWRITE_EXT_URL': 'External'
  };
  
  Object.entries(rewriteVars).forEach(([envVar, label]) => {
    if (process.env[envVar]) {
      const originalUrl = process.env[envVar];
      const newUrl = replaceHostname(originalUrl, dockerHostname);
      process.env[envVar] = newUrl;
      console.log(`   ✓ ${label}: ${newUrl}`);
    }
  });
  
  console.log('');
}

// Import Next.js AFTER environment variables are configured
// This ensures Next.js sees the updated REWRITE_* values
const next = require('next');

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
    console.log(`\n🔐 Using Docker certificates for HTTPS`);
    console.log(`🍪 Session sharing with Docker client enabled\n`);
  });
}).catch((err) => {
  console.error('❌ Error starting server:', err);
  process.exit(1);
});
