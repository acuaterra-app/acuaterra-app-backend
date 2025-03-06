// middlewares/validarToken.js
const jwt = require('jsonwebtoken');
const BlackListService = require('../services/shared/blacklist.service');
const ApiResponse = require("../utils/apiResponse");

class ValidateTokenMiddleware {

   constructor(blackListService) {
     this.blackListService = blackListService;
   }
   async validate(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(400).json(ApiResponse.createApiResponse('Logout failed', [], [{
        'error' : 'No token provided'
      }]));
    }

    try {
      const isTokenInBlackList = await this.blackListService.isTokenInBlackList(token);
      if (isTokenInBlackList) {
        return res.status(400).json(ApiResponse.createApiResponse('Logout failed', [], [{
          'error' : 'Invalid Token'
        }]));
      }

      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(400).json(ApiResponse.createApiResponse('Logout failed', [], [{
            'error' : 'Token Malformed'
          }]));
        }

        req.user = decoded;
        next();
      });
    } catch (error) {
      return res.status(500).json(ApiResponse.createApiResponse('Logout failed', [], [{
        'error' : 'Server error'
      }]));
    }
  }
}

module.exports = ValidateTokenMiddleware;