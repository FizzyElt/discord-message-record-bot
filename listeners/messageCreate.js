const { format } = require('date-fns');
const R = require('ramda');
const commandMapping = require('../utils/commandRegex.js');

const commandRegex = /^(\:\:([a-z|A-Z|0-9]*)){1}/g;

function messageCreateListener(client, exclusiveChannelSet, blackList) {
  return async function (message) {
    // command checking
    const matchString = message.content.match(commandRegex);
    if (matchString) {
      const [str = ''] = matchString;

      const getCommandOperation = commandMapping(
        client,
        { guildId: message.guildId, operator: message.member },
        exclusiveChannelSet,
        blackList
      );

      const commandOperation = getCommandOperation(str);

      const resolveString = await commandOperation(message.content);

      message.channel.send(resolveString);

      return;
    }

    const discordInviteLinkContain = /discord\.gg\/\w*\d*/;
    if (discordInviteLinkContain.test(message.content)) {
      message.delete();
      return;
    }

    // record message flow
    if (R.equals(message.author.id, client.user.id)) return;

    if (exclusiveChannelSet.hasChannel(message.channelId)) return;

    const sendChannel = client.channels.cache.get(process.env.BOT_SENDING_CHANNEL_ID);

    const channelName = message.channel.name;
    const userName = message.author.username;
    const discriminator = message.author.discriminator;

    const sendString = `${channelName} **[Created：${format(
      message.createdAt,
      'yyyy/MM/dd HH:mm'
    )}]** ${userName}(#${discriminator})：\n${
      message.content
    }\n------------------------------------`;

    sendChannel
      .send({
        content: sendString,
        allowedMentions: { parse: [] },
      })
      .then((sentMessage) => {
        message.reference = sentMessage.id;
      })
      .catch((err) => {
        console.log('error');
      });
  };
}

module.exports = messageCreateListener;
