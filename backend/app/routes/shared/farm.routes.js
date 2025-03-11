const express = require('express');
const router = express.Router();
const farmController = require('../../controllers/shared/farm.controller');
const ValidateTokenMiddleware = require('../../middleware/validateToken.middleware');
const ValidateRoleMiddleware = require('../../middleware/validateRole.middleware');
const BlackListService = require('../../services/shared/blacklist.service');
const { ROLES } = require('../../enums/roles.enum');

const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const validateRoleMiddleware = new ValidateRoleMiddleware();


router.get(
    '/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([ROLES.USER, ROLES.OWNER]),
    farmController.getFarmDetails
    );

module.exports = router;

