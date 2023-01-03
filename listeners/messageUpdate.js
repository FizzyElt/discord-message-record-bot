const { format } = require('date-fns');
const { pipe } = require('fp-ts/function');
const O = require('fp-ts/Option');
const R = require('ramda');

function messageUpdateListener({ client, exclusiveChannelSet }) {
  return function (oldMsg, newMsg) {
    pipe(
      O.some({ oldMsg, newMsg, client, exclusiveChannelSet }),
      O.chain((params) => (params.newMsg.author.bot ? O.none : O.some(params))),
      O.chain((params) =>
        params.exclusiveChannelSet.hasChannel(params.newMsg.channelId) ? O.none : O.some(params)
      ),
      O.match(R.identity, (params) => {
        const { oldMsg, newMsg, client } = params;

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
      })
    );
  };
}

module.exports = messageUpdateListener;
