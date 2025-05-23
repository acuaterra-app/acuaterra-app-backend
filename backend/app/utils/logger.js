/**
 * Simple logger utility
 * This can be replaced with a more robust logging solution like winston or pino
 */

const LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

const LOG_LEVEL = (process.env.LOG_LEVEL || 'INFO').toUpperCase();

const shouldLog = (level) => {
  const levels = Object.values(LEVELS);
  const currentIndex = levels.indexOf(LOG_LEVEL);
  const levelIndex = levels.indexOf(level);
  
  return levelIndex <= currentIndex;
};

const formatMessage = (level, message, data) => {
  const timestamp = new Date().toISOString();
  let output = `${timestamp} [${level}] ${message}`;
  
  if (data) {
    if (typeof data === 'object') {
      try {
        output += ` ${JSON.stringify(data)}`;
      } catch (e) {
        output += ` [Object cannot be stringified]`;
      }
    } else {
      output += ` ${data}`;
    }
  }
  
  return output;
};

const logger = {
  error: (message, data) => {
    if (shouldLog(LEVELS.ERROR)) {
      console.error(formatMessage(LEVELS.ERROR, message, data));
    }
  },
  
  warn: (message, data) => {
    if (shouldLog(LEVELS.WARN)) {
      console.warn(formatMessage(LEVELS.WARN, message, data));
    }
  },
  
  info: (message, data) => {
    if (shouldLog(LEVELS.INFO)) {
      console.info(formatMessage(LEVELS.INFO, message, data));
    }
  },
  
  debug: (message, data) => {
    if (shouldLog(LEVELS.DEBUG)) {
      console.debug(formatMessage(LEVELS.DEBUG, message, data));
    }
  }
};

module.exports = logger;

