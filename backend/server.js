const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const BlackListService = require('./app/services/blacklist.service');
const cors = require('cors');
const morgan = require('morgan');
// Import the new ray module

// Initialize express app
const app = express();

// Set up Ray with express

app.get('/', (req, res) => {
    res.send('Acuaterra Backend service running OK!');
});
/**
 * Load Routes groups
 */
const userRoues = require('./app/routes/admin/user.route');
const authRoutes = require('./app/routes/auth.route');
const farmRoutes = require('./app/routes/admin/farm.route');
const moduleRoutes = require('./app/routes/admin/module.route');

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
 * Owner Routes
 */
app.use('/api/v2/modules', moduleRoutes);

/*
 * Admin Routes
 */
app.use('/api/v2/admin/users', userRoues);
app.use('/api/v2/admin/farms', farmRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

setInterval(() => {
    (new BlackListService).cleanBlackList()
    .catch(error => console.error('Error al vaciar la lista negra:', error));
}, 3600 * 1000); 
