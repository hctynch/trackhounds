import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the package.json file
const packageJsonPath = path.join(__dirname, 'package.json');
console.log(`Reading package.json from ${packageJsonPath}`);

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Check for circular dependencies
  if (packageJson.dependencies && packageJson.dependencies.frontend) {
    console.log('⚠️ Detected circular dependency: "frontend" in dependencies');
    delete packageJson.dependencies.frontend;
    console.log('✅ Removed circular dependency');
  }
  
  // Check for package name in dependencies
  if (packageJson.dependencies && packageJson.dependencies[packageJson.name]) {
    console.log(`⚠️ Detected self-reference: "${packageJson.name}" in dependencies`);
    delete packageJson.dependencies[packageJson.name];
    console.log('✅ Removed self-reference from dependencies');
  }
  
  // Write the updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json successfully');
} catch (error) {
  console.error('Error processing package.json:', error);
  process.exit(1);
}

console.log('✅ Package cleanup complete!');
