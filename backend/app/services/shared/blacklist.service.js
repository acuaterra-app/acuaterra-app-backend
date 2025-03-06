const { Blacklist } = require("../../../models");

class BlackListService {
    async addToken(token) {
        try {
           await Blacklist.create({token});
        } catch (error) {
            throw error;
        }
    }

    async cleanBlackList() {
        try {
        await Blacklist.destroy({ where: {} });
        } catch (error) {
            console.error('Error al vaciar la tabla listaNegra:', error.message);
            throw error;
        }
    }

    async isTokenInBlackList(token) {
        try {
            return await Blacklist.findOne({where: {token}});
        } catch (error) {
            throw error;
        }
    }
}

module.exports = BlackListService;