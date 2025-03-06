const {User} = require("../../../models");
const ApiResponse = require("../../utils/apiResponse");
const {getRoleNameById} = require("../../enums/roles.enum");

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
            const {email, password} = req.body;

            const token = await this.authService.login(password, email);
            const user = await User.findOne({where: {email}});
            const result = ApiResponse.createApiResponse('Successful login', [{
                token,
                user: {id: user.id, dni: user.dni, name: user.name, email: user.email, id_rol: user.id_rol, rol: getRoleNameById(user.id_rol)}
            }]);

            res.json(result);

        } catch (error) {
            console.error("Error updating farm:", error);
            const response = ApiResponse.createApiResponse(
                "Error authentication",
                [],
                [{ msg: error.message }]
            );

            if (error.message.includes("Credentials does not match")) {
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
}

module.exports = AuthController;