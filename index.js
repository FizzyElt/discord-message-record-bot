const { Client, IntentsBitField, BitField, GatewayIntentBits } = require('discord.js');
const { format } = require('date-fns');
const R = require('ramda');
const {
  readyListener,
  messageCreateListener,
  messageDeleteListener,
  messageUpdateListener,
} = require('./listeners/index.js');

const Channels = require('./utils/Channels');
const ObserveList = require('./utils/ObserveList');

require('dotenv').config();

const exclusiveChannelSet = new Channels([], {
  id: process.env.BOT_SENDING_CHANNEL_ID,
  name: process.env.BOT_SENDING_CHANNEL_NAME,
});

const blackList = new ObserveList();

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
