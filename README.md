# Backend de Gestión de Personas y Módulos - Documentación

## 1. Introducción
Este proyecto es un sistema backend diseñado para gestionar personas, módulos, bitacoras, umbrales y sensores en un entorno de acuicultura. Proporciona una API RESTful para realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre estos mismos, así como funcionalidades adicionales como autenticación y autorización.

---

### Instrucciones de Instalación
1. Clona el repositorio:
   ```bash
   git clone https://github.com/theAranda88/BackMejorado.git
   cd BackMejorado
   ```
   
## 2. Correr ambiente de desarrollo:

 ````bash
  cd scripts
  chmod 700 start-dev.sh
  ./start-dev.sh
 
 ````

El servidor estará disponible en `http://localhost:9000`.

---

## 3. Endpoints 

Revise el folder del repositorio ahi encontrara las colecciones de Postman para revisar los campos. 
test-resources
Revise el enlace (/api-docs/)[http://localhost:9000/api-docs]

---

## 4. Configuración

### Archivos de Configuración
- **`.env`**: Contiene las variables de entorno necesarias para la conexión a la base de datos y la configuración del servidor.

---

## 5. Pruebas

### Pruebas Unitarias
Para ejecutar las pruebas unitarias, utiliza el siguiente comando:
```bash
npm test
```

---

## 6. Despliegue

### Despliegue en Producción
1. Configura un servidor (por ejemplo, AWS, DigitalOcean, Heroku).
2. Clona el repositorio en el servidor.
3. Configura las variables de entorno en el servidor.
4. Inicia el servidor con `npm start` o utiliza un proceso manager como `PM2`.

---

## 7. Contribución

### Cómo Contribuir
1. Clona el repositorio.
2. Crea una nueva rama:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. Realiza tus cambios y haz commit:
   ```bash
   git commit -m "Añade nueva funcionalidad"
   ```
4. Envía un pull request.

##  Datos Sequelize

### 1. Tipos de Relaciones
belongsTo	Asociación 1:1 (Llave foránea en origen)	Un Autor pertenece a un Libro
hasOne	Asociación 1:1 (Llave foránea en destino)	Un Usuario tiene un Perfil
hasMany	Asociación 1:N (Uno a muchos)	Un Usuario tiene muchos Posts
belongsToMany	Asociación N:M (Muchos a muchos)	Productos pertenecen a muchas Órdenes (y viceversa)

---
## 8. Contacto

- **Autor**: Acuaterra Team
- **Correo Electrónico**: acuaterraappgmail.com

Este repo es un fork del desarrollador Daniel Aranda que tambien hace parte del equipo:

- **Autor**: Daniel Aranda
- **Correo Electrónico**: thearanda88@gmail.com
- **Repositorio**: [GitHub](https://github.com/theAranda88/BackMejorado.git)
---

