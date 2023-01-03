const { format } = require('date-fns');
const R = require('ramda');
const O = require('fp-ts/Option');
const { pipe, flow } = require('fp-ts/function');
const commandMapping = require('../flows/commandFlow');

const commandRegex = /^(\:\:([a-z|A-Z|0-9]*)){1}/g;
const discordInviteRegex = /discord\.gg\/(\w|\d)+/;

function messageCreateListener({ client, exclusiveChannelSet, blackList, bannedList }) {
  return async function (message) {
    // command checking
    const commandOperationRes = pipe(
      O.fromNullable(message.content.match(commandRegex)),
      O.map(flow(R.head, O.fromNullable, O.getOrElse(''))),
      O.chain((str) => {
        const getCommandOperation = commandMapping({
          client,
          message,
          exclusiveChannelSet,
          blackList,
        });

        const commandOperation = getCommandOperation(str);

        const resolveString = commandOperation(message.content);

        message.channel.send(resolveString);
        return O.some(str);
      })
    );

    if (O.isSome(commandOperationRes)) return;

    const discordInviteClean = pipe(discordInviteRegex.test(message.content), (res) => {
      if (res) {
        message.delete();
        return O.some('delete');
      }
      return O.none;
    });

    if (O.isSome(discordInviteClean)) return;

    // record message flow
    pipe(
      O.some({ message, client, exclusiveChannelSet }),
      O.chain((params) => (params.message.author.bot ? O.none : O.some(params))),
      O.chain((params) =>
        R.equals(params.message.author.id, params.client.user.id) ? O.none : O.some(params)
      ),
      O.chain((params) =>
        params.exclusiveChannelSet.hasChannel(params.message.channelId) ? O.none : O.some(params)
      ),
      O.match(R.identity, (params) => {
        const { client, message } = params;

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
      })
    );
  };
}

module.exports = messageCreateListener;
