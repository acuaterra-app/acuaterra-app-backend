const bcrypt = require("bcrypt");
const {User} = require("../../../models");
const {getRoleNameById} = require("../../enums/roles.enum");
const jwt = require('jsonwebtoken');
const Mailer = require('../../utils/Mailer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

class AuthService {

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

    async requestPasswordReset(email) {
        const user = await User.findOne({where: {email}});
        if (!user) {
            throw new Error('User not found');
        }

        if (!user.isActive) {
            throw new Error('User is inactive');
        }

        const secret = process.env.JWT_SECRET;
        const payload = {
            email: user.email,
            id: user.id,
            purpose: 'password_reset'
        };
        const options = { expiresIn: '15m' };
        const token = jwt.sign(payload, secret, options);

        const baseUrl = process.env.FRONTEND_URL ;
        const resetPasswordUrl = `${baseUrl}/reset-password?token=${token}`;

        const templatePath = path.join(__dirname, '../../../app/views/emails/password_reset.ejs');
        const template = fs.readFileSync(templatePath, 'utf8');
        const emailContent = ejs.render(template, {
            name: user.name,
            email: user.email,
            resetPasswordUrl
        });

        const mailer = new Mailer(process.env.RESEND_API_KEY);
        const from = process.env.RESEND_FROM_EMAIL;
        const result = await mailer.sendEmail(
            user.email,
            'Recuperación de contraseña - Acuaterra',
            emailContent,
            from
        );

        if (!result.success) {
            throw new Error('Failed to send reset password email');
        }

        return {
            success: true,
            message: 'Reset password email sent successfully'
        };
    }

    async resetPassword(token, newPassword) {
        try {
            const secret = process.env.JWT_SECRET;
            const decoded = jwt.verify(token, secret);
            
            if (decoded.purpose !== 'password_reset') {
                throw new Error('Invalid token purpose');
            }

            const user = await User.findOne({ where: { email: decoded.email, id: decoded.id } });
            if (!user) {
                throw new Error('User not found');
            }

            if (!user.isActive) {
                throw new Error('User is inactive');
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            user.password = hashedPassword;
            user.mustChangePassword = false;
            await user.save();

            return this._formatUserResponse(user);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Password reset link has expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid password reset link');
            }
            throw error;
        }
    }
}

module.exports = AuthService;