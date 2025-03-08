const fs = require('fs');
const path = require('path');


function loadSwaggerSpec() {
  const swaggerBase = require('./swagger.json');
  
  const swaggerSpec = {
    ...swaggerBase,
    paths: {},
    components: {
      ...swaggerBase.components,
      schemas: {},
      parameters: {}
    }
  };

  const loadJsonFromDir = (dirPath) => {
    const files = fs.readdirSync(dirPath);
    const result = {};
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        const subDirResults = loadJsonFromDir(filePath);
        
        Object.entries(subDirResults).forEach(([key, value]) => {
          result[key] = value;
        });
      } else if (file.endsWith('.json')) {
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

  const pathsDir = path.join(__dirname, 'paths');
  if (fs.existsSync(pathsDir)) {
    const pathFiles = loadJsonFromDir(pathsDir);
    
    Object.values(pathFiles).forEach(pathDef => {
      Object.entries(pathDef).forEach(([path, methods]) => {
        if (!swaggerSpec.paths[path]) {
          swaggerSpec.paths[path] = methods;
        } else {
          Object.entries(methods).forEach(([method, definition]) => {
            swaggerSpec.paths[path][method] = definition;
          });
        }
      });
    });
  }

  const schemasDir = path.join(__dirname, 'schemas');
  if (fs.existsSync(schemasDir)) {
    const schemaFiles = loadJsonFromDir(schemasDir);
    
    Object.entries(schemaFiles).forEach(([key, value]) => {
      if (key === 'parameters') {
        Object.assign(swaggerSpec.components.parameters, value);
      } else {
        Object.assign(swaggerSpec.components.schemas, value);
      }
    });
  }

  return swaggerSpec;
}

const swaggerSpec = loadSwaggerSpec();

module.exports = swaggerSpec;

