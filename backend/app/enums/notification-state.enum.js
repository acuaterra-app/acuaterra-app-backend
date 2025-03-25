/**
 * Enum for notification states
 * @readonly
 * @enum {string}
 */
const NOTIFICATION_STATE = {
    READ: 'read',
    UNREAD: 'unread'
};

/**
 * @param {string} state - The notification state to validate
 * @returns {boolean} - Whether the state is valid
 */
const isValidState = (state) => {
    return Object.values(NOTIFICATION_STATE).includes(state);
};

/**
 * @returns {string} - The default notification state
 */
const getDefaultState = () => {
    return NOTIFICATION_STATE.UNREAD;
};

module.exports = {
    NOTIFICATION_STATE,
    isValidState,
    getDefaultState
};

