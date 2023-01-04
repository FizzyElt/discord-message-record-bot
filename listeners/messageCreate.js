const { format } = require('date-fns');
const R = require('ramda');
const O = require('fp-ts/Option');
const { pipe, flow } = require('fp-ts/function');
const commandMapping = require('../flows/commandFlow');
const inviteGuard = require('../flows/inviteGuardFlow');

const checkBannedUser = require('../flows/bannedUserFlow');

const discordInviteRegex = /discord\.gg\/(\w|\d)+/;

function messageCreateListener({ client, exclusiveChannelSet, blackList, bannedList }) {
  return async function (message) {
    pipe(
      O.some({ client, message, exclusiveChannelSet, blackList, exclusiveChannelSet, bannedList }),
      // command message flow
      O.filter((params) =>
        pipe(
          commandMapping({
            client: params.client,
            exclusiveChannelSet: params.exclusiveChannelSet,
            message: params.message,
            blackList: params.blackList,
            bannedList: params.bannedList,
          }),

          O.map(R.tap((res) => params.message.channel.send(res))),
          O.isSome,
          R.not
        )
      ),
      O.filter((params) =>
        pipe(
          checkBannedUser({ message: params.message, bannedList: params.bannedList }),
          O.map(R.tap((res) => (params.message.delete(), params.message.channel.send(res)))),
          O.isSome,
          R.not
        )
      ),
      // discord invite validation flow
      O.filter((params) =>
        pipe(
          inviteGuard(params.message),
          O.map(R.tap(() => params.message.delete())),
          O.isSome,
          R.not
        )
      ),
      O.filter((params) => !params.message.author.bot),
      O.filter((params) => !R.equals(params.message.author.id, params.client.user.id)),
      O.filter((params) => !params.exclusiveChannelSet.hasChannel(params.message.channelId)),
      O.map((params) => {
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
