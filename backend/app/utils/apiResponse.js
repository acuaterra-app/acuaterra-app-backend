class ApiResponse {
    static createApiResponse(message, data = [], errors = [], meta = {}) {
        return {
            message: message,
            data: data,
            errors: errors,
            meta: meta
        };
    }
}
  
  module.exports = ApiResponse;