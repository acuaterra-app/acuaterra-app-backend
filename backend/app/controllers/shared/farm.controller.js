const ApiResponse = require('../../utils/apiResponse');
const farmService = require('../../services/shared/farm.shared.services');

class FarmSharedController {

    async getFarmDetails(req, res) {
        try {
            const farmId = req.params.id;
            const userId = req.user.id;

            await farmService.checkUserHasAccessToFarm(userId, farmId);

            const farmDetails = await farmService.getFarmDetails(farmId);

            return res.status(200).json(
                ApiResponse.createApiResponse(
                    'Farm details obtained successfully',
                    [farmDetails],
                    []
                )
            );
        } catch (error) {
            if (error.message === 'You do not have permission to access this farm') {
                return res.status(403).json(
                    ApiResponse.createApiResponse(
                        error.message,
                        null,
                        403
                    )
                );
            }

            if (error.message === 'Farm not found') {
                return res.status(404).json(
                    ApiResponse.createApiResponse(
                        error.message,
                        null,
                        404
                    )
                );
            }

            console.error('Error en getFarmDetails:', error);
            return res.status(500).json(
                ApiResponse.createApiResponse(
                    'Error getting farm details',
                    error.message,
                    500
                )
            );
        }
    }
}

module.exports = new FarmSharedController();

