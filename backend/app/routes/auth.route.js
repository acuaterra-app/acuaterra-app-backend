const express = require("express");
const router = express.Router();

const { validateUserLogin } = require("../validators/shared/auth.validator");
const {validate} = require("../middleware/validate.middleware");
const AuthController = require("../controllers/shared/auth.controller");
const ValidateTokenMiddleware = require("../middleware/validateToken.middleware");
const TokenGeneratorService = require("../services/shared/tokenGenerator.service");
const BlackListService = require("../services/shared/blacklist.service");
const AuthService = require("../services/shared/auth.service");


const authService = new AuthService(new BlackListService(), new TokenGeneratorService());
const authController = new AuthController(authService);

const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());

router.post(
    '/login',
    validate(validateUserLogin),
    (req, res) => authController.login(req, res)
);
router.post(
    '/logout',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    (req, res) => authController.logout(req, res)
);

module.exports = router;