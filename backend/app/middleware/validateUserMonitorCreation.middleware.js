const ApiResponse = require('../utils/apiResponse');
const { ROLES } = require('../enums/roles.enum');
const { Module, Farm, FarmUser } = require('../../models');

class ValidateUserMonitorCreationMiddleware {
    constructor() {}

    async validate(req, res, next) {
        try {
            const { id_module } = req.body;
            const user = req.user;

            // Verificar que el usuario logueado es un Owner (rol 2)
            if (user.id_rol !== ROLES.OWNER) {
                return res.status(403).json(
                    ApiResponse.createApiResponse('Autorización fallida', [], [{
                        'error': 'Solo los propietarios pueden crear usuarios monitores'
                    }])
                );
            }

            // Verificar que el rol que se asigna es Monitor (rol 3)
            if (req.body.id_rol && Number(req.body.id_rol) !== ROLES.MONITOR) {
                return res.status(400).json(
                    ApiResponse.createApiResponse('Validación fallida', [], [{
                        'error': 'El rol asignado debe ser Monitor (3)'
                    }])
                );
            }

            // Si no se especifica un rol, asignar automáticamente el rol Monitor
            if (!req.body.id_rol) {
                req.body.id_rol = ROLES.MONITOR;
            }

            // Verificar que el id_module es válido
            if (!id_module) {
                return res.status(400).json(
                    ApiResponse.createApiResponse('Validación fallida', [], [{
                        'error': 'Se requiere un ID de módulo válido'
                    }])
                );
            }

            // Buscar el módulo
            const module = await Module.findByPk(id_module, {
                include: [{
                    model: Farm,
                    as: 'farm'
                }]
            });

            if (!module) {
                return res.status(404).json(
                    ApiResponse.createApiResponse('Validación fallida', [], [{
                        'error': 'El módulo especificado no existe'
                    }])
                );
            }

            // Obtener el ID de la granja asociada al módulo
            const farmId = module.farm.id;

            // Verificar si el usuario (owner) tiene acceso a la granja
            const farmUserRelation = await FarmUser.findOne({
                where: {
                    id_user: user.id,
                    id_farm: farmId
                }
            });

            if (!farmUserRelation) {
                return res.status(403).json(
                    ApiResponse.createApiResponse('Autorización fallida', [], [{
                        'error': 'No tienes permiso para crear monitores en este módulo'
                    }])
                );
            }

            // Si todas las validaciones pasan, permitir continuar
            next();
        } catch (error) {
            console.log('Error en validación de creación de monitor:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            return res.status(500).json(
                ApiResponse.createApiResponse('Error de servidor', [], [{
                    'error': 'Error al validar la creación del monitor'
                }])
            );
        }
    }
}

module.exports = ValidateUserMonitorCreationMiddleware;

