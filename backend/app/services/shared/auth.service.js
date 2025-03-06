const bcrypt = require("bcrypt");
const {User} = require("../../../models");

class AuthService {

    /**
     * @param {BlackListService} blackListService
     * @param {TokenGeneratorService} tokenGenerator
     */
    constructor(blackListService, tokenGenerator) {
        this.blackListService = blackListService;
        this.tokenGenerator = tokenGenerator;
    }

    async login(password, email) {

        const user = await User.findOne({where: {email}});
        if (!user) {
            throw Error('Credentials does not match');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw Error('Credentials does not match');
        }

        return await this.tokenGenerator.generateToken(user);

    }

    async logout(token) {
        try {
            await this.blackListService.addToken(token);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = AuthService;