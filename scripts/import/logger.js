/**
 * ISARI Init Import Winston Logger
 * =================================
 *
 * Logger able to dump to multiple outputs for convenience.
 */
const winston = require('winston'),
      chalk = require('chalk');

const CONFIG = {
  levels: {
    error: 0,
    info: 0,
    success: 0,
    warning: 0
  },
  colors: {
    error: 'red',
    info: 'blue',
    success: 'green',
    warning: 'yellow'
  }
};

/**
 * Custom console transport.
 */
class ConsoleTransport extends winston.Transport {
  constructor() {
    super();
    this.name = 'custom-console';
    this.level = 'success';
  }

  log(lvl, msg, meta, callback) {
    const color = CONFIG.colors[lvl];

    console.log(
      `${chalk[color]('[•]')} ${msg}`
    );

    return callback();
  }
}

module.exports = function createLogger() {

  const log = new winston.Logger({
    levels: CONFIG.levels,
    transports: [
      new ConsoleTransport()
    ]
  });

  return log;
};
