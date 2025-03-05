const UserService = require('../services/user.service');
const ApiResponse = require('../utils/apiResponse')
const { validationResult } = require('express-validator');

class UserController {

    /**
     * @param {UserService} userService
     */
    constructor(userService) {
        this.userService = userService;
    }

    async register(req, res) {
        try {
            const result = await this.userService.register(req.body);
            const response = ApiResponse.createApiResponse('User registered successfully', result);
            return res.json(response);
        } catch (error) {
            const response = ApiResponse.createApiResponse(
                "Failed to create user",
                [],
                [{ msg: error.message }]
            );
            return res.status(500).json(response);
        }
    }

    static async find(req, res) {
        try {
            const result = await UserService.findUserById(req.params.id);
            const response = ApiResponse.createApiResponse('User found successfully', result);
            return res.json(response);
        } catch (error) {
            res.status(404).json({ error: `User lookup failed: ${error.message}` });
        }
    }

    static async index(req, res) {
        try {
            const result = await UserService.getAllUsers();
            const response = ApiResponse.createApiResponse("All users retrieved successfully", result)
            return res.json(response);
        } catch (error) {
            res.status(500).json({ error: `Failed to retrieve users: ${error.message}` });
        }
    }

    static async findByRole(req, res) {
        try {
            const roleId = req.params.roleId;
            const result = await UserService.findUsersByRole(roleId);
            const response = ApiResponse.createApiResponse(`Users with role ID ${roleId} retrieved successfully`, result)
            return res.json(response);
        } catch (error) {
            res.status(500).json({ error: `Failed to retrieve users by role: ${error.message}` });
        }
    }

    static async upgrade(req, res) {
        try {
            const result = await UserService.editUser(req.params.id, req.body);
            const response = ApiResponse.createApiResponse("User updated successfully", result)
            return res.json(response);
        } catch (error) {
            res.status(500).json({ error: `User update failed: ${error.message}` });
        }
    }

    static async delete(req, res) {
        try {
            const result = await UserService.deleteUser(req.params.id);
            const response = ApiResponse.createApiResponse("User deleted successfully", result)
            return res.json(response);
        } catch (error) {
            res.status(500).json({ error: `User deletion failed: ${error.message}` });
        }
    }

}

module.exports = UserController;

