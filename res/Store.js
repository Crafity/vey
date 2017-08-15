/*eslint-env*/ /*globals window*/
"use strict";

import EventEmitter from "./EventEmitter";

const _subscriptions = new EventEmitter();
// const _store = window.__store = window.__store || { state: [{}], index: 0 };

function getStore() {
  return window.__store = window.__store || {};
}

function shallowCopy(from, into) {
  const result = {};
  if (into) { Object.keys(into).forEach(key => (result[key] = into[key])); }
  if (from) { Object.keys(from).forEach(key => (result[key] = from[key])); }
  return Object.freeze(result);
}

function assoc(state, data, value) {
  if (arguments.length < 2) {
    throw new Error("Arguments 'state' and 'data' are required");
  }
  if (arguments.length === 2 && typeof data === "object") {
    return shallowCopy(data, state);
  }
  if (arguments.length > 3) {
    throw new Error("Not more than 3 arguments allowed");
  }
  return shallowCopy({
    [data]: value
  }, state);
}

class Store {
  constructor({ store = getStore(), subscriptions = _subscriptions, scope = "global", persistent = true } = {}) {
    if (!store) {
      throw new Error("Argument 'store' is required.");
    }
    if (!subscriptions) {
      throw new Error("Argument 'subscriptions' is required.");
    }
    if (!scope) {
      throw new Error("Argument 'scope' is required.");
    }
    const self = this;

    this._watchCounter = -1;
    this._watchers = {};
    this._scope = scope;
    this._store = persistent ? store : {};
    if (!this._store[this._scope]) {
      this._store[this._scope] = { state: [{}], index: 0 };
    }
    this._subscriptions = subscriptions;

    this._subscriptions.on("change", (oldDB, newDB) => {
      Object.keys(self._watchers).map(key => self._watchers[key]).forEach(watcher => {
        if (watcher.key === "*") {
          return watcher.fn(newDB, oldValue, watcher.key);
        }
        const keyParts = watcher.key.split(".");

        let oldValue = oldDB;
        let newValue = newDB;

        for (let i = 0; i < keyParts.length; i++) {
          oldValue = oldValue && oldValue[keyParts[i]];
          newValue = newValue && newValue[keyParts[i]];
        }

        if (oldValue !== newValue) {
          watcher.fn(newValue, oldValue, watcher.key);
        }

      });
    });
  }

  subscribe(key, fn) {
    this._watchCounter++;
    this._watchers[this._watchCounter] = { key, fn };
    return this._watchCounter;
  }

  unsubscribe(arg) {
    const self = this;
    if (typeof arg === "number") {
      delete this._watchers[arg];
    } else if (typeof arg === "string") {
      Object.keys(this._watchers).forEach(id => {
        if (self._watchers[id].key === arg) { delete self._watchers[id]; }
      });
    } else if (typeof arg === "function") {
      Object.keys(this._watchers).forEach(id => {
        if (self._watchers[id].fn === arg) { delete self._watchers[id]; }
      });
    } else {
      throw new Error("Unsupport argument for unsubscribe");
    }
  }

  get canUndo() {
    return this.index > 0;
  }

  undo() {
    if (!this.canUndo) { return; }
    const prevDB = this.db;
    this.store.index--;
    this._subscriptions.emit("change", prevDB, this.db);
  }

  get canRedo() {
    return this.store.state.length - 1 > this.index;
  }

  redo() {
    if (!this.canRedo) { return; }
    const prevDB = this.db;
    this.store.index++;
    this._subscriptions.emit("change", prevDB, this.db);
  }

  assoc(...args) {
    return (this.db = assoc.apply(this, [this.db].concat(args)));
  }

  get store() {
    return this._store[this._scope];
  }

  get index() {
    return this.store.index;
  }

  get db() {
    return Object.freeze(this.store.state[this.index]);
  }

  set db(db) {
    const prevDB = this.db;
    this.store.index++;
    this.store.state.splice(this.index);
    this.store.state[this.index] = shallowCopy(db);
    this._subscriptions.emit("change", prevDB, this.db);
  }
}

const store = new Store();
export { Store as default, Store, store, assoc };
