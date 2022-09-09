class ObserveList {
  constructor(set = new Set()) {
    this.set = set;
  }

  hasPerson(id) {
    return this.set.has(id);
  }

  addPerson(id) {
    this.set.add(id);
  }

  removePerson(id) {
    this.set.delete(id);
  }

  clearPerson() {
    this.set.clear();
  }

  getList() {
    return [...this.set];
  }
}

module.exports = ObserveList;
