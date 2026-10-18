/**
 * VERTEX ERP - Real TDS Protocol Connection Test Script
 * Target:
 *   Server: .\VERTEX
 *   Database: VERTEX_ERP_DB
 *   Authentication: SQL Server
 *   Username/Password: from current configuration
 * 
 * Result:
 *   On success: Displays "Connected"
 *   On failure: Displays the real error message
 */

const sqlLayer = require('./sqlConnectionLayer.cjs');

async function testRealTds() {
  console.log('====================================================');
  console.log('  VERTEX ERP Ultimate - Desktop SQL Server TDS Test');
  console.log('====================================================');
  
  const config = sqlLayer.getConfig(true);
  console.log(`[Config] Server:         ${config.server}`);
  console.log(`[Config] Database:       ${config.database}`);
  console.log(`[Config] Authentication: ${config.authentication === 'sql' ? 'SQL Server' : 'Windows'}`);
  console.log(`[Config] Username:       ${config.username || '(None)'}`);
  console.log('----------------------------------------------------');
  console.log('جاري تنفيذ اختبار الاتصال الفعلي بـ SQL Server عبر بروتوكول TDS...');

  const startTime = Date.now();
  const result = await sqlLayer.testConnection();
  const elapsed = Date.now() - startTime;

  console.log('----------------------------------------------------');
  if (result.success || result.status === 'Connected') {
    console.log('\x1b[32m%s\x1b[0m', 'Status: Connected');
    console.log(`تم الاتصال بنجاح بالخادم ${result.server} وقاعدة البيانات ${result.database} في ${elapsed}ms`);
    if (result.details) {
      console.log('SQL Version:', result.details.sql_version);
      console.log('Current DB: ', result.details.current_db);
    }
  } else {
    console.log('\x1b[31m%s\x1b[0m', 'Status: Failed');
    console.log('\x1b[31m%s\x1b[0m', `الخطأ الحقيقي: ${result.error}`);
    if (result.code) {
      console.log(`Error Code: ${result.code}`);
    }
  }
  console.log('====================================================\n');
  return result;
}

if (require.main === module) {
  testRealTds().then((res) => {
    process.exit(res.success ? 0 : 1);
  });
}

module.exports = { testRealTds };
