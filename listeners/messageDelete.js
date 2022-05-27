const { format } = require('date-fns');

function messageDeleteListener(client, exclusiveChannelSet, blackList) {
  return function (msg) {
    if (blackList.hasPerson(msg.author.id)) {
      console.log(msg)
      msg.channel.send({
        content: `${msg?.member?.nickname || msg?.member?.displayName || msg.author.id || ''}: ${
          msg.content
        }`,
      });
    }

    if (exclusiveChannelSet.hasChannel(msg.channelId)) {
      return;
    }

    const sendChannel = client.channels.cache.get(process.env.BOT_SENDING_CHANNEL_ID);

    const channelName = msg.channel.name;
    const userName = msg.author.username;
    const discriminator = msg.author.discriminator;

    const sendString = `${channelName} **[Created：${format(
      msg.createdAt,
      'yyyy/MM/dd HH:mm'
    )}]** ${userName}(#${discriminator}) **Delete**：\n${
      msg.content
    }\n------------------------------------`;

    sendChannel.send({
      content: sendString,
      allowedMentions: { parse: [] },
    });
  };
}

module.exports = messageDeleteListener;
