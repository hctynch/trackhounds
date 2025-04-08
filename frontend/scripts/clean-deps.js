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
  
  // Now let's check if node_modules has circular symlinks
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  
  if (fs.existsSync(nodeModulesPath)) {
    console.log('Checking for circular symlinks in node_modules...');
    
    // Check for a "frontend" folder in node_modules
    const frontendPath = path.join(nodeModulesPath, 'frontend');
    if (fs.existsSync(frontendPath)) {
      console.log(`⚠️ Found potentially problematic folder: ${frontendPath}`);
      
      // Check if it's a symlink
      if (fs.lstatSync(frontendPath).isSymbolicLink()) {
        console.log('It\'s a symlink, removing...');
        fs.unlinkSync(frontendPath);
        console.log('✅ Removed circular symlink');
      } else {
        console.log('Not a symlink, but could still cause issues. Consider removing manually.');
      }
    } else {
      console.log('✅ No problematic symlinks found');
    }
  } else {
    console.log('node_modules directory not found, no cleanup needed');
  }
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
