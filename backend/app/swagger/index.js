const fs = require('fs');
const path = require('path');

/**
 * Carga y combina todos los archivos JSON de Swagger en una única especificación OpenAPI
 */
function loadSwaggerSpec() {
  // Carga el archivo base de configuración de Swagger
  const swaggerBase = require('./swagger.json');
  
  // Inicializa la especificación con la configuración base
  const swaggerSpec = {
    ...swaggerBase,
    paths: {},
    components: {
      ...swaggerBase.components,
      schemas: {},
      parameters: {}
    }
  };

  // Función para cargar archivos JSON desde un directorio recursivamente
  const loadJsonFromDir = (dirPath) => {
    const files = fs.readdirSync(dirPath);
    const result = {};
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Si es un directorio, cargamos recursivamente los archivos
        const subDirResults = loadJsonFromDir(filePath);
        
        // Incorporamos los resultados del subdirectorio
        Object.entries(subDirResults).forEach(([key, value]) => {
          result[key] = value;
        });
      } else if (file.endsWith('.json')) {
        // Si es un archivo JSON, lo cargamos
        try {
          const fileContent = require(filePath);
          const fileName = path.basename(file, '.json');
          result[fileName] = fileContent;
        } catch (error) {
          console.error(`Error al cargar el archivo ${filePath}:`, error);
        }
      }
    });
    
    return result;
  };

  // Cargar todas las definiciones de rutas (paths)
  const pathsDir = path.join(__dirname, 'paths');
  if (fs.existsSync(pathsDir)) {
    const pathFiles = loadJsonFromDir(pathsDir);
    
    // Combinar todas las definiciones de rutas
    Object.values(pathFiles).forEach(pathDef => {
      Object.assign(swaggerSpec.paths, pathDef);
    });
  }

  // Cargar todos los esquemas (schemas)
  const schemasDir = path.join(__dirname, 'schemas');
  if (fs.existsSync(schemasDir)) {
    const schemaFiles = loadJsonFromDir(schemasDir);
    
    // Combinar todos los esquemas
    Object.entries(schemaFiles).forEach(([key, value]) => {
      if (key === 'parameters') {
        // Manejar parámetros especiales
        Object.assign(swaggerSpec.components.parameters, value);
      } else {
        // Manejar esquemas regulares
        Object.assign(swaggerSpec.components.schemas, value);
      }
    });
  }

  return swaggerSpec;
}

// Cargar la especificación completa de Swagger
const swaggerSpec = loadSwaggerSpec();

module.exports = swaggerSpec;

