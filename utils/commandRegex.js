const R = require('ramda');

const commandMapping = (client, exclusiveChannelSet) =>
  R.cond([
    [
      R.equals('::addChannels'),
      R.always((str) => {
        const channelIdOrName = str.replace('::addChannels', '').trim();

        const channel = client.channels.cache.find(
          (value) =>
            R.equals(value.id, channelIdOrName) ||
            R.equals(value.name, channelIdOrName)
        );

        if (!channel) {
          return '找不到頻道';
        }

        if (R.equals(channel.type, 'GUILD_CATEGORY')) {
          const subChannels = channel.children
            .filter((value) => !R.equals(value.type, 'GUILD_VOICE'))
            .map((value) => ({
              id: value.id,
              name: value.name,
            }));

          exclusiveChannelSet.addChannels(subChannels);

          return `已排除 **${channel.name}** 下的所有文字頻道`;
        }

        if (R.equals(channel.type, 'GUILD_TEXT')) {
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
          (value) =>
            R.equals(value.id, channelIdOrName) ||
            R.equals(value.name, channelIdOrName)
        );

        if (!channel) {
          return '找不到頻道';
        }

        if (R.equals(channel.type, 'GUILD_CATEGORY')) {
          const subChannels = channel.children
            .filter((value) => R.equals(value.type, 'GUILD_VOICE'))
            .map((value) => ({
              id: value.id,
              name: value.name,
            }));

          exclusiveChannelSet.removeChannels(subChannels.map(R.prop('id')));

          return `已監聽 **${channel.name}** 下的所有文字頻道`;
        }

        if (R.equals(channel.type, 'GUILD_TEXT')) {
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
        const channelNames = [...channels.entries()].map(
          ([id, name]) => `(${id}) **${name}**`
        );

        return `目前排除的頻道有：\n${channelNames.join('\n')}`;
      }),
    ],
    [(R.T, R.always(() => '不支援的指令'))],
  ]);

module.exports = commandMapping;
