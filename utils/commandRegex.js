const { ChannelType } = require('discord.js');
const R = require('ramda');
require('dotenv').config();
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID;

const isGuildCategory = R.equals(ChannelType.GuildCategory);
const isGuildVoice = R.equals(ChannelType.GuildVoice);
const isGuildText = R.equals(ChannelType.GuildText);

const addChannelsHandler = (client, channelIdOrName = '', exclusiveChannelSet) => {
  const channel = client.channels.cache.find(
    (channel) => R.equals(channel.id, channelIdOrName) || R.equals(channel.name, channelIdOrName)
  );

  if (R.isNil(channel)) return '找不到頻道';

  if (isGuildCategory(channel.type)) {
    const subChannels = channel.children.cache
      .filter((channel) => !isGuildVoice(channel.type))
      .map(R.pick(['id', 'name']));

    exclusiveChannelSet.addChannels(subChannels);
    return `已排除 **${channel.name}** 下的所有文字頻道`;
  }

  if (isGuildText(channel.type)) {
    exclusiveChannelSet.addChannel(subChannels);
    return `已排除 **${channel.name}**`;
  }

  return '不支援的頻道類型';
};

const removeChannelsHandler = (client, channelIdOrName) => {
  const channel = client.channels.cache.find(
    (value) => R.equals(value.id, channelIdOrName) || R.equals(value.name, channelIdOrName)
  );

  if (!channel) {
    return '找不到頻道';
  }

  if (isGuildCategory(channel.type)) {
    const subChannels = channel.children.cache
      .filter((value) => R.equals(value.type, ChannelType.GuildVoice))
      .map(R.pick(['id', 'name']));

    exclusiveChannelSet.removeChannels(subChannels.map(R.prop('id')));

    return `已監聽 **${channel.name}** 下的所有文字頻道`;
  }

  if (isGuildText(channel.type)) {
    exclusiveChannelSet.removeChannel(channel.id);
    return `已排除 **${channel.name}**`;
  }

  return '不支援的頻道類型';
};

const listChannelsHandler = (exclusiveChannelSet) => {
  const channels = exclusiveChannelSet.getChannelMap();
  const channelNames = [...channels.entries()].map(([id, name]) => `(${id}) **${name}**`);

  return `目前排除的頻道有：\n${channelNames.join('\n')}`;
};

const addPersonHandler = async (client, guildId, operator, personIdOrName, blackList) => {
  if (!operator?._roles.includes(ADMIN_ROLE_ID)) return '你沒有權限執行此操作';

  const guild = client.guilds.cache.find(R.propEq('id', guildId));

  if (R.isNil(guild)) return '找不到伺服器';

  try {
    const member = await guild.members.fetch(personIdOrName);
    blackList.addPerson(member.user.id);
    return `${member.nickname || member.displayName || member.user.id} 以列入觀察名單`;
  } catch (err) {
    return '找不到成員';
  }
};

const removePersonHandler = (operator, blackList) => {
  if (!operator?._roles.includes(ADMIN_ROLE_ID)) {
    return '你沒有權限執行此操作';
  }

  blackList.removePerson(personIdOrName);

  return `${personIdOrName} 移除觀察名單`;
};

const clearPersonsHandler = (operator, blackList) => {
  if (!operator?._roles.includes(ADMIN_ROLE_ID)) return '你沒有權限執行此操作';

  blackList.clearPerson();

  return `觀察名單已清空`;
};

const listPersonsHandler = (blackList) => {
  const list = blackList.getList();

  return `觀察名單\n${list.join('\n')}`;
};

const commandMapping = (client, { operator, guildId }, exclusiveChannelSet, blackList) =>
  R.cond([
    [
      R.equals('::addChannels'),
      R.always((str) => {
        const channelIdOrName = str.replace('::addChannels', '').trim();

        return addChannelsHandler(client, channelIdOrName, exclusiveChannelSet);
      }),
    ],
    [
      R.equals('::removeChannels'),
      R.always((str) => {
        const channelIdOrName = str.replace('::removeChannels', '').trim();

        return removeChannelsHandler(client, channelIdOrName);
      }),
    ],
    [
      R.equals('::listChannels'),
      R.always((str) => {
        return listChannelsHandler(exclusiveChannelSet);
      }),
    ],
    [
      R.equals('::addPerson'),
      R.always(async (str) => {
        const personIdOrName = str.replace('::addPerson', '').trim();

        return await addPersonHandler(client, guildId, operator, personIdOrName, blackList);
      }),
    ],
    [
      R.equals('::removePerson'),
      R.always((str) => {
        const personIdOrName = str.replace('::removePerson', '').trim();

        return removePersonHandler(operator, blackList);
      }),
    ],
    [
      R.equals('::clearPersons'),
      R.always((str) => {
        return clearPersonsHandler(operator, blackList);
      }),
    ],
    [
      R.equals('::listPersons'),
      R.always((str) => {
        return listPersonsHandler(blackList);
      }),
    ],
    [(R.T, R.always(() => '不支援的指令'))],
  ]);

module.exports = commandMapping;
