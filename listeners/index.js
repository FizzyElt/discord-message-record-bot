const readyListener = require('./ready.js');
const messageCreateListener = require('./messageCreate.js');
const messageDeleteListener = require('./messageDelete.js');
const messageUpdateListener = require('./messageUpdate.js');

module.exports = {
  readyListener,
  messageCreateListener,
  messageDeleteListener,
  messageUpdateListener,
};
