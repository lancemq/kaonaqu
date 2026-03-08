const fs = require('fs');
const path = require('path');

function loadEnvFile(filename) {
  const fullPath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(fullPath)) {
    return;
  }

  const dotenv = require('dotenv');
  dotenv.config({
    path: fullPath,
    override: false
  });
}

loadEnvFile('.env.local');
loadEnvFile('.env');
