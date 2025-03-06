const jwt = require('jsonwebtoken');

class TokenGeneratorService {
    async generateToken(user) {
        const { id, dni } = user;
        const payload = { id, dni };
        const secret = process.env.JWT_SECRET;
        const options = { expiresIn: '5h' };
        return jwt.sign(payload, secret, options);
    }
}
module.exports = TokenGeneratorService;