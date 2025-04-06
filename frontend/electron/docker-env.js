import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load environment variables from .env file for Docker
 * @param {boolean} isDev - Whether the app is running in development mode
 * @returns {Object} Environment variables as an object
 */
export function loadDockerEnv(isDev) {
  try {
    // Determine the path to the .env file
    const envFilePath = isDev
      ? path.join(process.cwd(), 'docker-resources', '.env')
      : path.join(process.resourcesPath, 'docker-resources', '.env');
    
    // Check if the file exists
    if (!fs.existsSync(envFilePath)) {
      console.log('Docker .env file not found, using default values');
      return {
        DB_ROOT_PASSWORD: 'password',
        DB_NAME: 'trackhounds',
        DB_USER: 'root'
      };
    }
    
    // Read and parse the .env file
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    const envVars = {};
    
    // Parse each line that's not a comment
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, value] = trimmedLine.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      }
    });
    
    console.log('Loaded Docker environment variables');
    return envVars;
  } catch (error) {
    console.error('Error loading Docker environment variables:', error);
    // Return default values as fallback
    return {
      DB_ROOT_PASSWORD: 'password',
      DB_NAME: 'trackhounds',
      DB_USER: 'root'
    };
  }
}
