const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONTAINER_NAME = 'aems-proxy';
const CERT_DIR = '/etc/certs';
const LOCAL_DIR = __dirname;

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

// Check if Docker container is running
try {
  execSync(`docker inspect ${CONTAINER_NAME}`, { stdio: 'ignore' });
} catch (error) {
  console.error(`❌ Error: Docker container '${CONTAINER_NAME}' is not running.`);
  console.error('   Please start your Docker services first.');
  process.exit(1);
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
