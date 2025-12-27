#!/usr/bin/env node

// Type checking script for the mineral system
const { execSync } = require('child_process');

console.log('🔍 Checking TypeScript types...\n');

try {
  // Run TypeScript compiler in check mode
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('\n✅ All TypeScript types are correct!');
  
  // Run ESLint to check for other issues
  console.log('\n🔍 Running ESLint...');
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('\n✅ ESLint checks passed!');
  
  console.log('\n🎉 Code quality checks completed successfully!');
  console.log('\n📖 Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Test the system at: http://localhost:3000');
  console.log('3. Check system status at: /system-status');
  
} catch (error) {
  console.log('\n❌ Type checking failed. Please fix the errors above.');
  process.exit(1);
}