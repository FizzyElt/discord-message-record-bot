const { Client, IntentsBitField, BitField, GatewayIntentBits } = require('discord.js');
const { format } = require('date-fns');
const R = require('ramda');
const {
  readyListener,
  messageCreateListener,
  messageDeleteListener,
  messageUpdateListener,
} = require('./listeners/index.js');

require('dotenv').config();

function createExclusiveChannels(defaultArr = [], sendChannel = { id: '', name: '' }) {
  let channelMap = new Map([
    ...defaultArr.map(({ name, id }) => [id, name]),
    [sendChannel.id, sendChannel.name],
  ]);

  function hasChannel(id) {
    return channelMap.has(id);
  }

  function getChannelMap() {
    return channelMap;
  }

  function addChannel(id, name = '') {
    channelMap.set(id, name);
  }

  function addChannels(list = []) {
    channelMap = new Map([...channelMap, ...list.map((value) => [value.id, value.name])]);
  }

  function removeChannel(id) {
    if (R.equals(id, sendChannel.id)) {
      return;
    }
    channelMap.delete(id);
  }

  function removeChannels(ids) {
    ids
      .filter((id) => !R.equals(id, sendChannel.id))
      .forEach((id) => {
        channelMap.delete(id);
      });
  }

  return {
    hasChannel,
    getChannelMap,
    addChannel,
    addChannels,
    removeChannel,
    removeChannels,
  };
}

function createObserveList() {
  let personSet = new Set();

  function hasPerson(id) {
    return personSet.has(id);
  }

  function addPerson(id) {
    personSet.add(id);
  }

  function removePerson(id) {
    personSet.delete(id);
  }

  function clearPerson() {
    personSet.clear();
  }

  function getList() {
    return [...personSet];
  }

  return {
    hasPerson,
    addPerson,
    removePerson,
    clearPerson,
    getList,
  };
}

const exclusiveChannelSet = createExclusiveChannels([], {
  id: process.env.BOT_SENDING_CHANNEL_ID,
  name: process.env.BOT_SENDING_CHANNEL_NAME,
});

const blackList = createObserveList();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.on('ready', readyListener(client, exclusiveChannelSet));

client.on('messageCreate', messageCreateListener(client, exclusiveChannelSet, blackList));

client.on('messageUpdate', messageUpdateListener(client, exclusiveChannelSet, blackList));

client.on('messageDelete', messageDeleteListener(client, exclusiveChannelSet, blackList));

client.login(process.env.TOKEN);
