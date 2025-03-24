/**
 * Enum for user role types
 * @readonly
 * @enum {number}
 */
const ROLES = {
    ADMIN: 1,
    OWNER: 2,
    MONITOR: 3,
    MODULE: 4
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

/**
 * @returns {number[]} - Array of role IDs allowed for admins
 */
const getAdminAllowedRoles = () => {
    return [ROLES.ADMIN, ROLES.OWNER, ROLES.MONITOR, ROLES.MODULE];
};

/**
 * @returns {number[]} - Array of role IDs allowed for owners
 */
const getOwnerAllowedRoles = () => {
    return [ROLES.OWNER, ROLES.MONITOR, ROLES.MODULE];
};

module.exports = {
    ROLES,
    getRoleNameById,
    getAdminAllowedRoles,
    getOwnerAllowedRoles
};


