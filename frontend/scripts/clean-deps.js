/**
 * This script cleans up circular dependencies in package.json
 */

const fs = require('fs');
const path = require('path');

// Path to package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');

console.log(`Reading package.json from ${packageJsonPath}`);

try {
  // Read the package.json file
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
  
  // Parse the JSON
  const packageJson = JSON.parse(packageJsonContent);
  
  const packageName = packageJson.name;
  let modified = false;
  
  // Check for self-references in dependencies
  if (packageJson.dependencies && packageJson.dependencies[packageName]) {
    console.log(`⚠️ Found self-reference in dependencies: "${packageName}"`);
    delete packageJson.dependencies[packageName];
    modified = true;
  }
  
  // Check specifically for "frontend" reference
  if (packageJson.dependencies && packageJson.dependencies.frontend) {
    console.log('⚠️ Found "frontend" reference in dependencies');
    delete packageJson.dependencies.frontend;
    modified = true;
  }
  
  // Write the updated package.json back to disk if changes were made
  if (modified) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Successfully removed circular dependencies from package.json');
  } else {
    console.log('✅ No circular dependencies found in package.json');
  }
  
} catch (error) {
  console.error('Error:', error.message);
  // Don't exit with error code, just log the error
  console.log('Continuing without dependency check...');
}
