const { format } = require('date-fns');
const O = require('fp-ts/Option');
const R = require('ramda');
const { pipe } = require('fp-ts/function');

function messageDeleteListener({ client, exclusiveChannelSet }) {
  return function (message) {
    pipe(
      O.some({ message, client }),
      O.chain((params) => (params.author.bot ? O.none : O.some(params))),
      O.chain((params) =>
        params.exclusiveChannelSet.hasChannel(params.message.channelId) ? O.none : O.some(params)
      ),
      O.match(R.identity, () => {
        const { client, message } = params;

        const sendChannel = client.channels.cache.get(process.env.BOT_SENDING_CHANNEL_ID);

        const channelName = message.channel.name;
        const userName = message.author.username;
        const discriminator = message.author.discriminator;

        const sendString = `${channelName} **[Created：${format(
          message.createdAt,
          'yyyy/MM/dd HH:mm'
        )}]** ${userName}(#${discriminator}) **Delete**：\n${
          message.content
        }\n------------------------------------`;

        sendChannel.send({
          content: sendString,
          allowedMentions: { parse: [] },
        });
      })
    );
  };
}

module.exports = messageDeleteListener;
