const { ChannelType } = require('discord.js');
const R = require('ramda');
require('dotenv').config();
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID;

const commandMapping = (client, { operator, guildId }, exclusiveChannelSet, blackList) =>
  R.cond([
    [
      R.equals('::addChannels'),
      R.always((str) => {
        const channelIdOrName = str.replace('::addChannels', '').trim();

        const channel = client.channels.cache.find(
          (value) => R.equals(value.id, channelIdOrName) || R.equals(value.name, channelIdOrName)
        );

        if (!channel) {
          return '找不到頻道';
        }

        console.log(channel.type);

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
      }),
    ],
    [
      R.equals('::removeChannels'),
      R.always((str) => {
        const channelIdOrName = str.replace('::removeChannels', '').trim();

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
          return `已排除 **${channel.name}**`;
        }

        return '不支援的頻道類型';
      }),
    ],
    [
      R.equals('::listChannels'),
      R.always((str) => {
        const channels = exclusiveChannelSet.getChannelMap();
        const channelNames = [...channels.entries()].map(([id, name]) => `(${id}) **${name}**`);

        return `目前排除的頻道有：\n${channelNames.join('\n')}`;
      }),
    ],
    [
      R.equals('::addPerson'),
      R.always(async (str) => {
        const personIdOrName = str.replace('::addPerson', '').trim();

        if (!operator?._roles.includes(ADMIN_ROLE_ID)) {
          return '你沒有權限執行此操作';
        }

        const guild = client.guilds.cache.find((guild) => R.equals(guild.id, guildId));

        if (!guild) {
          return '找不到伺服器';
        }

        try {
          const member = await guild.members.fetch(personIdOrName);
          blackList.addPerson(member.user.id);
          return `${member.nickname || member.displayName || member.user.id} 以列入觀察名單`;
        } catch (err) {
          return '找不到成員';
        }
      }),
    ],
    [
      R.equals('::removePerson'),
      R.always((str) => {
        const personIdOrName = str.replace('::removePerson', '').trim();

        if (!operator?._roles.includes(ADMIN_ROLE_ID)) {
          return '你沒有權限執行此操作';
        }

        blackList.removePerson(personIdOrName);

        return `${personIdOrName} 移除觀察名單`;
      }),
    ],
    [
      R.equals('::clearPersons'),
      R.always((str) => {
        if (!operator?._roles.includes(ADMIN_ROLE_ID)) {
          return '你沒有權限執行此操作';
        }

        blackList.clearPerson();

        return `觀察名單已清空`;
      }),
    ],
    [
      R.equals('::listPersons'),
      R.always((str) => {
        const list = blackList.getList();

        return `觀察名單\n${list.join('\n')}`;
      }),
    ],
    [(R.T, R.always(() => '不支援的指令'))],
  ]);

module.exports = commandMapping;
