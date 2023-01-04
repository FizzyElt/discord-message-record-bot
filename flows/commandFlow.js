const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { pipe, constant, flow } = require('fp-ts/function');
const O = require('fp-ts/Option');
const R = require('ramda');
require('dotenv').config();
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID;

const isAdmin = (member) => member.permissions.has(PermissionFlagsBits.Administrator);

const addChannels = (params) => (str) => {
  const { client, exclusiveChannelSet } = params;
  const channelIdOrName = pipe(str, R.replace('::addChannels', ''), R.trim);

  const channel = client.channels.cache.find(
    (value) => R.equals(value.id, channelIdOrName) || R.equals(value.name, channelIdOrName)
  );

  if (!channel) return '找不到頻道';

  if (R.equals(channel.type, ChannelType.GuildCategory)) {
    const subChannels = channel.children.cache
      .filter((value) => !R.equals(value.type, ChannelType.GuildVoice))
      .map((value) => ({
        id: value.id,
        name: value.name,
      }));

    exclusiveChannelSet.addChannels(subChannels);

    return `已排除 **${channel.name}** 下的所有文字頻道`;
  }

  if (R.equals(channel.type, ChannelType.GuildText)) {
    exclusiveChannelSet.addChannel(channel.id, channel.name);
    return `已排除 **${channel.name}**`;
  }

  return '不支援的頻道類型';
};

const removeChannels = (params) => (str) => {
  const { client, exclusiveChannelSet } = params;
  const channelIdOrName = pipe(str, R.replace('::removeChannels', ''), R.trim);

  const channel = client.channels.cache.find(
    (value) => R.equals(value.id, channelIdOrName) || R.equals(value.name, channelIdOrName)
  );

  if (!channel) {
    return '找不到頻道';
  }

  if (R.equals(channel.type, ChannelType.GuildCategory)) {
    const subChannels = channel.children.cache
      .filter((value) => R.equals(value.type, ChannelType.GuildVoice))
      .map((value) => ({
        id: value.id,
        name: value.name,
      }));

    exclusiveChannelSet.removeChannels(subChannels.map(R.prop('id')));

    return `已監聽 **${channel.name}** 下的所有文字頻道`;
  }

  if (R.equals(channel.type, ChannelType.GuildText)) {
    exclusiveChannelSet.removeChannel(channel.id);
    return `已監聽 **${channel.name}**`;
  }

  return '不支援的頻道類型';
};

const listChannels = (exclusiveChannelSet) => (str) => {
  const channels = exclusiveChannelSet.getChannelMap();
  const channelNames = [...channels.entries()].map(([id, name]) => `(${id}) **${name}**`);

  return `目前排除的頻道有：\n${channelNames.join('\n')}`;
};

const banUser = (params) => (str) => {
  const { message, client, bannedList } = params;
  const userId = pipe(str, R.replace('::banUser', ''), R.trim);

  if (!isAdmin(message.member)) {
    return '不是管理員還敢 ban 人阿';
  }

  const user = client.users.cache.get(userId);

  if (!user) {
    return '找不到使用者';
  }

  bannedList.banUser(user.id, 1);

  return `${user.username} 禁言 ${1} 天`;
};

const removeBannedUser = (params) => (str) => {
  const { message, client, bannedList } = params;
  const userId = pipe(str, R.replace('::removeUser', ''), R.trim);

  if (!isAdmin(message.member)) {
    return '你不是管理員，你沒有權限解 ban';
  }

  const user = client.users.cache.get(userId);

  return bannedList.deleteUser(user?.id || '')
    ? `${user?.username} 重穫自由`
    : '此人不存在或沒有被禁言';
};

const commandRegex = /^(\:\:([a-z|A-Z|0-9]*)){1}/g;

const matchCommandString = (str) => str.match(commandRegex);

const matchCommand = (command) => flow(R.head, O.fromNullable, O.getOrElse(''), R.equals(command));

const commandMapping = ({ client, exclusiveChannelSet, blackList, message, bannedList }) => {
  return pipe(
    message,
    R.prop('content'),
    matchCommandString,
    O.fromNullable,
    O.map(
      R.cond([
        [
          matchCommand('::addChannels'),
          () => addChannels({ client, exclusiveChannelSet })(message.content),
        ],
        [
          matchCommand('::removeChannels'),
          () => removeChannels({ client, exclusiveChannelSet })(message.content),
        ],
        [matchCommand('::listChannels'), () => listChannels(exclusiveChannelSet)(message.content)],
        [
          matchCommand('::banUser'),
          () => banUser({ client, message, bannedList })(message.content),
        ],
        [
          matchCommand('::removeUser'),
          () => removeBannedUser({ client, message, bannedList })(message.content),
        ],
        [(R.T, R.always('不支援的指令'))],
      ])
    )
  );
};

module.exports = commandMapping;
