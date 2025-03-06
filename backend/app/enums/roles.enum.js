/**
 * Enum for user role types
 * @readonly
 * @enum {number}
 */
const ROLES = {
    ADMIN: 1,
    OWNER: 2,
    USER: 3
};

/**
 * @param {number} id - The role ID to look up
 * @returns {string|null} - The role name or null if ID is invalid
 */
const getRoleNameById = (id) => {
    const roleIdToName = Object.fromEntries(
        Object.entries(ROLES).map(([name, roleId]) => [roleId, name])
    );
    
    return roleIdToName[id] || null;
};

module.exports = {
    ROLES,
    getRoleNameById
};


