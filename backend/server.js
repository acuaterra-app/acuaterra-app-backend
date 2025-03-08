const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const BlackListService = require('./app/services/shared/blacklist.service');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerConfig = require('./app/swagger/index.js');
// Import the new ray module

// Initialize express app
const app = express();

// Serve static files from the public directory
app.use(express.static('public'));

// Set up swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerConfig));

app.get('/', (req, res) => {
    res.redirect('/api-docs');
});
/**
 * Load Routes groups
 */
const userSharedRoutes = require('./app/routes/shared/user.route');
const userAdminRoutes = require('./app/routes/admin/user.admin.route');
const authRoutes = require('./app/routes/auth.route');
const farmRoutes = require('./app/routes/admin/farm.admin.route');
const sharedModuleRoutes = require('./app/routes/shared/module.route');
const ownerFarmRoutes = require('./app/routes/owner/farm.owner.route');

app.use(morgan('tiny')); 
app.use(express.json()); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

dotenv.config();

app.use(cors({
    origin: ['http://localhost:3001', 'https://backmejorado.onrender.com', 'https://acuaterra-app.netlify.app'], 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization'], 
    credentials: true,
  }));

 
app.options('*', cors());

app.use('/api/v2/auth', authRoutes);

/*
 * Shared Routes
 */
app.use('/api/v2/shared/modules', sharedModuleRoutes);
app.use('/api/v2/shared/users', userSharedRoutes);


/*
 * Owner Routes
 */
app.use('/api/v2/owner/farms', ownerFarmRoutes);

/*
 * Admin Routes
 */
app.use('/api/v2/admin/farms', farmRoutes);
app.use('/api/v2/admin/users', userAdminRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

setInterval(() => {
    (new BlackListService).cleanBlackList()
    .catch(error => console.error('Error al vaciar la lista negra:', error));
}, 3600 * 1000); 
