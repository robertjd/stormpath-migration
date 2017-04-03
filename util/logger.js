const winston = require('winston');
const chalk = require('chalk');
const prettyJson = require('prettyjson');
const columnify = require('columnify');

function prependSpaces(str) {
  return str.replace(/\n/g, '\n  ');
}

function pad(number) {
  return number < 10 ? `0${number}` : number;
}

function formatTime(time) {
  const date = new Date(time);
  return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    ' ' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds());
}

let indent = 0;

const levels = {
  error: {
    title: chalk.red.bold('ERROR    ')
  },
  warn: {
    title: chalk.bgBlack.yellow.bold('WARN     ')
  },
  exists: {
    title: chalk.bold('EXISTS   ')
  },
  updated: {
    title: chalk.green.bold('UPDATED  ')
  },
  created: {
    title: chalk.green.bold('CREATED  ')
  },
  from: {
    title: chalk.bold('FROM     '),
  },
  header: {
    title: chalk.bold('START    ')
  },
  info: {
    title: chalk.bold('INFO     ')
  },
  verbose: {
    title: chalk.cyan.bold('VERBOSE  ')
  },
  debug: {
    title: chalk.magenta.bold('DEBUG    ')
  },
  silly: {
    title: chalk.green.bold('SILLY    ')
  }
};

const levelMap = {};
Object.keys(levels).forEach((key, i) => levelMap[key] = i);

const logger = new (winston.Logger)({
  exitOnError: false,
  levels: levelMap,
  transports: [
    new (winston.transports.Console)({
      level: 'info',
      timestamp: () => Date.now(),
      formatter: (options) => {
        // Header is a special line that breaks up the log output
        const level = options.level;
        if (level === 'header') {
          return `\n${chalk.underline(options.message.toUpperCase())}:`;
        }

        const date = chalk.dim(`[${formatTime(options.timestamp())}]`);
        let title = levels[level].title;
        for (i = 0; i < indent; i++) {
          title += '  ';
        }
        if (indent > 0) {
          title += '└─ ';
        }
        let message = options.message || '';
        const metaKeys = options.meta ? Object.keys(options.meta) : [];

        // No meta to output, just return the message
        if (metaKeys.length === 0) {
          return `${date} ${title}${message}`;
        }

        let metaStr = '';
        // An "array" - winston converts this to an object. For arrays, output
        // in columns (i.e. custom schema properties)
        if (options.meta['0']) {
          const arr = metaKeys.map(key => options.meta[key]);
          metaStr = columnify(arr, {
            columnSplitter: '  '
          });
        }

        // API errors
        else if (options.meta.name === 'ApiError') {
          message = options.meta.message;
          return `${date} ${title}${message}`;
        }

        // Other objects that are logged
        else {
          metaStr = prettyJson.render(options.meta);
        }

        return `${date} ${title}${message}\n${prependSpaces(metaStr)}`;
      }
    })
  ]
});

logger.setLevel = (level) => {
  logger.transports.console.level = level;
};

logger.group = (title) => {
  logger.from(title);
  indent++;
  return {
    end: () => indent--
  };
}

module.exports = logger;
