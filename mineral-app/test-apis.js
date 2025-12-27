// API endpoint tester for the mineral system
const baseUrl = 'http://localhost:3000';

const endpoints = [
  { method: 'GET', path: '/api/batches', description: 'Fetch all batches' },
  { method: 'GET', path: '/api/stones', description: 'Fetch all stones' },
  { method: 'GET', path: '/api/sales-history', description: 'Fetch sales statistics' },
  { method: 'GET', path: '/api/market-trends', description: 'Fetch market trends' },
];

async function testEndpoint(endpoint) {
  try {
    console.log(`Testing ${endpoint.method} ${endpoint.path}...`);
    
    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${endpoint.description}: OK (${response.status})`);
      console.log(`   Data type: ${Array.isArray(data) ? 'Array' : typeof data}`);
      if (Array.isArray(data)) {
        console.log(`   Items: ${data.length}`);
      }
    } else {
      console.log(`❌ ${endpoint.description}: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ ${endpoint.description}: ${error.message}`);
  }
  console.log('');
}

async function testAllEndpoints() {
  console.log('🧪 Testing Mineral System API Endpoints...\n');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('🎯 Test Summary:');
  console.log('If all endpoints show ✅ OK, your system is ready!');
  console.log('If any show ❌, check the server logs for errors.');
  console.log('\n📖 Next steps:');
  console.log('1. Go to http://localhost:3000/batches/new');
  console.log('2. Add a mineral batch with images');
  console.log('3. Check /stones to see individual stones');
  console.log('4. Add market trends at /market-trends');
  console.log('5. Test AI pricing suggestions');
}

// Run tests if called directly
if (require.main === module) {
  testAllEndpoints().catch(console.error);
}

module.exports = { testAllEndpoints };