const { format } = require('date-fns');

function messageUpdateListener(client, exclusiveChannelSet, blackList) {
  return function (oldMsg, newMsg) {
    if (blackList.hasPerson(newMsg.author.id)) {
      newMsg.channel.send({
        content: `${
          newMsg?.member?.nickname || newMsg?.member?.displayName || newMsg?.author?.id || ''
        } **編輯了**: ${oldMsg.content}`,
      });
    }

    if (newMsg.author.bot) return;

    if (exclusiveChannelSet.hasChannel(newMsg.channelId)) return;

    const sendChannel = client.channels.cache.get(process.env.BOT_SENDING_CHANNEL_ID);

    const channelName = newMsg.channel.name;
    const userName = newMsg.author.username;
    const discriminator = newMsg.author.discriminator;

    const sendString = `${channelName} **[Created：${format(
      newMsg.createdAt,
      'yyyy/MM/dd HH:mm'
    )}]** ${userName}(#${discriminator}) **Edit**：\n${
      newMsg.content
    }\n------------------------------------`;

    sendChannel.send({
      content: sendString,
      allowedMentions: { parse: [] },
      reply: {
        messageReference: oldMsg.reference,
      },
    });
  };
}

module.exports = messageUpdateListener;
