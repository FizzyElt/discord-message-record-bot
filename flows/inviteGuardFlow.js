const { ChannelType } = require('discord.js');
const { pipe, constant, flow } = require('fp-ts/function');
const O = require('fp-ts/Option');
const R = require('ramda');

const discordInviteRegex = /discord\.gg\/(\w|\d)+/;

const isDiscordInviteString = (str) => discordInviteRegex.test(str);

const inviteGuard = flow(
  R.prop('content'),
  isDiscordInviteString,
  R.ifElse(R.identity, O.some, R.always(O.none))
);

module.exports = inviteGuard;
