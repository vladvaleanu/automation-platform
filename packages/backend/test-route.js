const { ModuleRegistryService } = require('./dist/services/module-registry.service.js');

async function test() {
  console.log('Testing ModuleRegistryService.list with status filter:\n');
  
  const result = await ModuleRegistryService.list({ status: 'ENABLED' });
  
  console.log('Result:', JSON.stringify(result, null, 2));
  console.log('\nNumber of modules:', result.length);
}

test().catch(console.error);
