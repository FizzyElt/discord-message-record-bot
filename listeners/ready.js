const R = require('ramda');
const { ActivityType } = require('discord.js');

function readyListener(client, exclusiveChannelSet) {
  return function (info) {
    client.user?.setActivity('你的py', { type: ActivityType.Watching });

    console.log('ws ready');
  };
}

module.exports = readyListener;
