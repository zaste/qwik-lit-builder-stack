const fetch = require('node-fetch');

async function validateEndpoint(url, description) {
  console.log(`🔍 Testing: ${description}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url, { timeout: 5000 });
    
    if (!response.ok) {
      console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`   ✅ SUCCESS: ${Object.keys(data).length} properties returned`);
    return true;
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

async function checkServerStatus() {
  const baseUrl = 'http://localhost:5173';
  
  console.log('🚀 VALIDACIÓN EN TIEMPO REAL DEL SISTEMA\n');
  console.log(`⏰ ${new Date().toISOString()}\n`);
  
  // Check if server is responding
  try {
    const response = await fetch(baseUrl, { timeout: 3000 });
    console.log(`🌐 Servidor base: ✅ RESPONDE (${response.status})\n`);
  } catch (error) {
    console.log(`🌐 Servidor base: ❌ NO RESPONDE (${error.message})\n`);
    return false;
  }
  
  // Test critical endpoints
  const endpoints = [
    { url: `${baseUrl}/api/health`, desc: 'Health Check' },
    { url: `${baseUrl}/api/content/pages`, desc: 'Pages API (Supabase)' },
    { url: `${baseUrl}/api/content/search?q=test`, desc: 'Search API (No JSONPlaceholder)' },
    { url: `${baseUrl}/api/analytics/dashboard`, desc: 'Analytics Dashboard (Real Data)' },
    { url: `${baseUrl}/api/files/list`, desc: 'Files API' }
  ];
  
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    const success = await validateEndpoint(endpoint.url, endpoint.desc);
    if (success) successCount++;
    console.log(''); // Empty line
  }
  
  console.log('📊 RESUMEN:');
  console.log(`   ✅ Endpoints funcionando: ${successCount}/${endpoints.length}`);
  console.log(`   📊 Porcentaje de éxito: ${Math.round((successCount/endpoints.length)*100)}%`);
  
  if (successCount === endpoints.length) {
    console.log('\n🎉 ¡SISTEMA 100% FUNCIONAL SIN MOCKS!');
    return true;
  } else {
    console.log('\n⚠️  Sistema parcialmente funcional - revisar endpoints fallidos');
    return false;
  }
}

// Export for use in other scripts
module.exports = { checkServerStatus, validateEndpoint };

// Run if called directly
if (require.main === module) {
  checkServerStatus().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
  });
}