const UserService = require('../../services/shared/user.service');
const ApiResponse = require('../../utils/apiResponse')

class UserController {

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

    async index(req, res) {
        try {
            const page = req.query.page;
            const limit = req.query.limit;
            const sortField = req.query.sortField;
            const sortOrder = req.query.sortOrder;

            const result = await this.userService.getAllUsers(page, limit, sortField, sortOrder);

            const paginationMeta = {
                pagination:{
                    total: result.count,
                    totalPages: result.totalPages,
                    currentPage: result.currentPage,
                    perPage: result.perPage,
                    hasNext: result.currentPage < result.totalPages,
                    hasPrev: result.currentPage > 1
                }
            }

            const response = ApiResponse.createApiResponse(
                "All users retrieved successfully", 
                result.rows,
                [],
                paginationMeta
            );

            return res.json(response);
        } catch (error) {
            console.error("Error getting users index", error);
            const response = ApiResponse.createApiResponse(
                "Failed to retrieve users",
                [],
                [{ msg: error.message }]
            );
            return res.status(500).json(response);
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

    async update(req, res) {
        try {
            const { id } = req.params;
            const userData = req.body;

            const updatedUser = await this.userService.editUser(id, userData);

            const response = ApiResponse.createApiResponse(
                "User updated successfully",
                [ updatedUser ]
            );
            return res.json(response);
        } catch (error) {
            console.error("Error updating user:", error);
            const response = ApiResponse.createApiResponse(
                "Error updating user",
                [],
                [{ msg: error.message }]
            );

            if (error.message.includes("not found")) {
                return res.status(404).json(response);
            }

            return res.status(500).json(response);
        }
    }

    async delete(req, res) {
        try {
            const result = await this.userService.deleteUser(req.params.id, req.user);
            const response = ApiResponse.createApiResponse("User deleted successfully", result)
            return res.json(response);
        } catch (error) {
            console.error("Error deleting user:", error);

            const response = ApiResponse.createApiResponse(
                "Error deleting user",
                [],
                [{ msg: error.message }]
            );

            if (error.message.includes("not found")) {
                return res.status(404).json(response);
            } else if (error.message.includes("permission") || error.message.includes("Forbidden")) {
                return res.status(403).json(response);
            }

            return res.status(500).json(response);
        }
    }

}

module.exports = UserController;

