const { ChannelType } = require('discord.js');
const { pipe } = require('fp-ts/function');
const R = require('ramda');
require('dotenv').config();
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID;

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

const commandMapping = ({ client, exclusiveChannelSet, blackList }) =>
  R.cond([
    [R.equals('::addChannels'), R.always(addChannels({ client, exclusiveChannelSet }))],
    [R.equals('::removeChannels'), R.always(removeChannels({ client, exclusiveChannelSet }))],
    [R.equals('::listChannels'), R.always(listChannels(exclusiveChannelSet))],
    [(R.T, R.always(() => '不支援的指令'))],
  ]);

module.exports = commandMapping;
