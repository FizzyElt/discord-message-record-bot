const R = require('ramda');

function readyListener(client, exclusiveChannelSet) {
  return function (info) {
    client.user?.setActivity('你的py', { type: 'WATCHING' });

    console.log('ws ready');
  };
}

module.exports = readyListener;
