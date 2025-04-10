const {User} = require("../../../models");
const ApiResponse = require("../../utils/apiResponse");
class AuthController {

    /**
     *
     * @param {AuthService} authService
     */
    constructor(authService) {
        this.authService = authService;
    }

    async login(req, res) {
        try {
            const {email, password, device_id} = req.body;

            const loginResponse = await this.authService.login(password, email);
            
            if (device_id) {
                await User.update({ device_id }, { where: { email } });
            }
            
            const result = ApiResponse.createApiResponse('Successful login',
                [loginResponse],
                {}
            );
            res.json(result);

        } catch (error) {
            console.error("Error en autenticación:", error);
            const response = ApiResponse.createApiResponse(
                "Error de autenticación",
                [],
                [{ msg: error.message }]
            );

            if (error.message.includes("Las credenciales no coinciden")) {
                return res.status(400).json(response);
            }
            return res.status(500).json(response);
        }
    }

    async logout(req, res, next) {

        try {
            const authorizationHeader = req.headers.authorization;
            if (!authorizationHeader) {
                const response = ApiResponse.createApiResponse("No token provided");
                return res.status(401).json(response);
            }

            const token = req.headers['authorization'];
            await this.authService.logout(token);
            const response = ApiResponse.createApiResponse('Session closed')
            return res.status(200).json(response);
        } catch (error) {
            res.status(400).json(ApiResponse.createApiResponse('Logout failed', [], [{
                'error' :error.message
            }]));
        }
    }
    async changeTemporaryPassword(req, res) {
        try {
            const { email, oldPassword, newPassword } = req.body;

            const updatedUser = await this.authService.changeTemporaryPassword(email, oldPassword, newPassword);
            
            const result = ApiResponse.createApiResponse('Password updated successfully', [
                { user: updatedUser }
            ]);
            res.json(result);

        } catch (error) {
            console.error("Error changing password:", error);
            const response = ApiResponse.createApiResponse(
                "Error changing password",
                [],
                [{ msg: error.message }]
            );

            if (error.message.includes("User not found") ||
                error.message.includes("The current password is incorrect")) {
                return res.status(400).json(response);
            }
            return res.status(500).json(response);
        }
    }
}

module.exports = AuthController;