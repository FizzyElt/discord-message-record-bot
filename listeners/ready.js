const R = require('ramda');

function readyListener(client, exclusiveChannelSet) {
  return function (info) {
    client.user?.setActivity('你的py', { type: 'WATCHING' });

    const members = client.guilds.cache.find(
      (guild) => guild.id === '730024186852147240'
    ).members.guild;

    console.log(members);

    console.log('ws ready');
  };
}

module.exports = readyListener;
