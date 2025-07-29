#!/usr/bin/env node

/**
 * Script para configurar automáticamente las variables de entorno en Netlify
 * Uso: node setup-netlify-env.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkNetlifyCLI() {
  try {
    execSync('netlify --version', { stdio: 'pipe' });
    log('✓ Netlify CLI está instalado', 'green');
    return true;
  } catch (error) {
    log('✗ Netlify CLI no está instalado', 'red');
    log('Instálalo con: npm install -g netlify-cli', 'yellow');
    return false;
  }
}

function checkNetlifyAuth() {
  try {
    const result = execSync('netlify status', { stdio: 'pipe', encoding: 'utf8' });
    if (result.includes('Not logged in')) {
      log('✗ No estás autenticado en Netlify', 'red');
      log('Ejecuta: netlify login', 'yellow');
      return false;
    }
    log('✓ Autenticado en Netlify', 'green');
    return true;
  } catch (error) {
    log('✗ Error verificando autenticación de Netlify', 'red');
    log('Ejecuta: netlify login', 'yellow');
    return false;
  }
}

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    log('✗ Archivo .env no encontrado', 'red');
    return null;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      envVars[key.trim()] = value.trim();
    }
  });

  log(`✓ Cargadas ${Object.keys(envVars).length} variables del archivo .env`, 'green');
  return envVars;
}

function setNetlifyEnvVar(key, value) {
  try {
    // Escapar caracteres especiales en el valor
    const escapedValue = value.replace(/"/g, '\\"');
    execSync(`netlify env:set "${key}" "${escapedValue}"`, { stdio: 'pipe' });
    log(`✓ ${key} configurada`, 'green');
    return true;
  } catch (error) {
    log(`✗ Error configurando ${key}: ${error.message}`, 'red');
    return false;
  }
}

// Función updateRedirectUri eliminada - ya no se usa Microsoft Azure

function main() {
  log('🚀 Configurador de Variables de Entorno para Netlify', 'bright');
  log('=' .repeat(50), 'cyan');

  // Verificar prerrequisitos
  if (!checkNetlifyCLI()) {
    process.exit(1);
  }

  if (!checkNetlifyAuth()) {
    process.exit(1);
  }

  // Cargar variables del archivo .env
  const envVars = loadEnvFile();
  if (!envVars) {
    process.exit(1);
  }

  // Actualizar REDIRECT_URI si es necesario
  updateRedirectUri(envVars);

  log('\n📤 Configurando variables en Netlify...', 'blue');
  log('-' .repeat(40), 'cyan');

  let successCount = 0;
  let totalCount = 0;

  // Configurar cada variable
  for (const [key, value] of Object.entries(envVars)) {
    if (value && value !== 'your_client_id_here' && value !== 'your_client_secret_here') {
      totalCount++;
      if (setNetlifyEnvVar(key, value)) {
        successCount++;
      }
    } else {
      log(`⚠️  Saltando ${key} (valor placeholder o vacío)`, 'yellow');
    }
  }

  log('\n' + '=' .repeat(50), 'cyan');
  log(`✅ Proceso completado: ${successCount}/${totalCount} variables configuradas`, 'green');
  
  if (successCount < totalCount) {
    log(`⚠️  ${totalCount - successCount} variables fallaron`, 'yellow');
  }

  log('\n📋 Próximos pasos:', 'blue');
  log('1. Verifica las variables en tu dashboard de Netlify', 'cyan');
  log('2. Redeploy tu sitio para que las variables tomen efecto', 'cyan');
  log('3. Prueba la funcionalidad que depende de estas variables', 'cyan');

  log('\n🔗 Dashboard de Netlify: https://app.netlify.com/', 'magenta');
}

if (require.main === module) {
  main();
}

module.exports = { main, loadEnvFile, setNetlifyEnvVar };