const bcrypt = require("bcrypt");
const {User} = require("../../../models");
const {getRoleNameById} = require("../../enums/roles.enum");

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

        const token = await this.tokenGenerator.generateToken(user);

        const formattedUser = this._formatUserResponse(user);

        const response = {
            token: token,
            user: formattedUser
        };

        if (user.mustChangePassword) {
            response.mustChangePassword = true;
        }

        return response;
    }

    async logout(token) {
        try {
            await this.blackListService.addToken(token);
        } catch (error) {
            throw error;
        }
    }

    async changeTemporaryPassword(email, oldPassword, newPassword) {
        const user = await User.findOne({where: {email}});

        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            throw new Error('The current password is incorrect');
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        user.password = hashedPassword;
        user.mustChangePassword = false;
        await user.save();

        return this._formatUserResponse(user);
    }

    _formatUserResponse(user) {
        return {
            id: user.id,
            dni: user.dni,
            name: user.name,
            email: user.email,
            id_rol: user.id_rol,
            rol: getRoleNameById(user.id_rol),
            contact: user.contact,
            mustChangePassword: user.mustChangePassword
        };
    }
}

module.exports = AuthService;