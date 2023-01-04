const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { pipe, constant, flow } = require('fp-ts/function');
const O = require('fp-ts/Option');
const R = require('ramda');
const { parseISO, isAfter, format } = require('date-fns');

const checkBannedUser = ({ bannedList, message }) => {
  const userId = message.author.id || '';

  return pipe(
    bannedList.getUser(userId),
    O.map(parseISO),
    O.chain((expiredDate) => {
      if (isAfter(Date.now(), expiredDate)) {
        bannedList.deleteUser(userId);
        return O.none;
      }

      const formatString = format(expiredDate, 'yyyy-MM-dd HH:mm:ss');
      return O.some(`你已被禁言，下次可發言時間為 ${formatString}`);
    })
  );
};

module.exports = checkBannedUser;
