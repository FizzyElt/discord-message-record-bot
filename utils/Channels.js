const R = require('ramda');

class Channels {
  constructor(initArr = [], sendChannel = { id: '', name: '' }) {
    this.map = new Map([
      ...initArr.map(({ name, id }) => [id, name]),
      [sendChannel.id, sendChannel.name],
    ]);
    this.sendChannel = sendChannel;
  }

  hasChannel(id) {
    return this.map.has(id);
  }

  getChannelMap() {
    return this.map;
  }

  addChannel(id, name = '') {
    this.map.set(id, name);
  }

  addChannels(list = []) {
    list.forEach(({ id, name }) => {
      this.map.set(id, name);
    });
  }

  removeChannel(id) {
    this.map.delete(id);
  }

  removeChannels(ids) {
    ids.filter(R.equals(this.sendChannel.id)).forEach((id) => this.map.delete(id));
  }
}

module.exports = Channels;
