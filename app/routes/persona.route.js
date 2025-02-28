const express = require('express');
const router = express.Router();
const PersonaController = require('../../app/controllers/persona.controller');
const VerificadorToken = require('../../middleware/VerificadorToken.Orm')

// Rutas para Usuario
router.post('/', PersonaController.registerC); //probado
router.post('/login', PersonaController.loginC); //probado
router.get('/',VerificadorToken.validador, PersonaController.findAllPersonsC); //probado
router.get('/:id', VerificadorToken.validador,PersonaController.findPersonByIdC); //probado
router.put('/:id',VerificadorToken.validador, PersonaController.updatePersonaC); //probado
router.delete('/:id', VerificadorToken.validador,PersonaController.deletePersonaC); //probado
router.post('/logout', VerificadorToken.validador, PersonaController.logoutC); //probado

module.exports = router;