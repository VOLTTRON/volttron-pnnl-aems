const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CERT_DIR = '/etc/certs';
const LOCAL_DIR = __dirname;

// Read .env file manually without external dependencies
function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return {};
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    return env;
  } catch (error) {
    return {};
  }
}

// Get expected container name from environment
function getExpectedContainerName() {
  // First check process.env (passed from parent)
  let projectName = process.env.COMPOSE_PROJECT_NAME;
  
  // If not found, try to read from .env file
  if (!projectName) {
    const rootEnv = loadEnvFile(path.join(__dirname, '..', '.env'));
    projectName = rootEnv.COMPOSE_PROJECT_NAME || 'skeleton';
  }
  
  return `${projectName}-proxy`;
}

// Dynamically find the proxy container
function findProxyContainer() {
  try {
    const output = execSync('docker ps --format "{{.Names}}" --filter "name=-proxy"', { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const containers = output.trim().split('\n').filter(name => name.endsWith('-proxy'));
    
    if (containers.length === 0) {
      return null;
    }
    
    // Return the first matching proxy container
    return containers[0];
  } catch (error) {
    return null;
  }
}

const certificates = [
  { remote: `${CERT_DIR}/mkcert-hostname.crt`, local: path.join(LOCAL_DIR, 'mkcert-hostname.crt') },
  { remote: `${CERT_DIR}/mkcert-hostname.key`, local: path.join(LOCAL_DIR, 'mkcert-hostname.key') },
  { remote: `${CERT_DIR}/mkcert-ca.crt`, local: path.join(LOCAL_DIR, 'mkcert-ca.crt') },
];

console.log('📜 Checking certificates...');

let needsCopy = false;

// Check if any certificates are missing
for (const cert of certificates) {
  if (!fs.existsSync(cert.local)) {
    console.log(`   Missing: ${path.basename(cert.local)}`);
    needsCopy = true;
  }
}

if (!needsCopy) {
  console.log('✅ All certificates present\n');
  process.exit(0);
}

console.log('📥 Copying certificates from Docker...');

// Find the proxy container
const CONTAINER_NAME = findProxyContainer();

if (!CONTAINER_NAME) {
  console.error('❌ Error: No proxy container found (expected pattern: *-proxy).');
  console.error('   Please start your Docker services first with: docker compose up -d');
  process.exit(1);
}

// Check if found container matches expected container
const expectedContainer = getExpectedContainerName();
if (CONTAINER_NAME !== expectedContainer) {
  console.log(`⚠️  Warning: Container name mismatch`);
  console.log(`   Expected: ${expectedContainer}`);
  console.log(`   Found:    ${CONTAINER_NAME}`);
  console.log(`   Continuing with found container...\n`);
} else {
  console.log(`   Using container: ${CONTAINER_NAME}`);
}

// Copy each certificate
for (const cert of certificates) {
  if (!fs.existsSync(cert.local)) {
    try {
      const command = `docker cp ${CONTAINER_NAME}:${cert.remote} ${cert.local}`;
      execSync(command, { stdio: 'ignore' });
      console.log(`   ✓ Copied ${path.basename(cert.local)}`);
    } catch (error) {
      console.error(`   ✗ Failed to copy ${path.basename(cert.local)}`);
      console.error(`     Command: docker cp ${CONTAINER_NAME}:${cert.remote} ${cert.local}`);
    }
  }
}

console.log('✅ Certificates copied successfully\n');
