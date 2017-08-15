/*eslint-env*/ /*globals */
"use strict";

import EventEmitter from "./EventEmitter";
import { Store } from "./Store";

const _events = { global: new EventEmitter() };

class Events {

  constructor({ store = new Store(), scope = "global" } = { }) {
    this._store = store;
    this._scope = scope;
    _events[scope] = _events[scope] || new EventEmitter();
    this._events = _events[scope];
  }

  subscribe(name, fn) {
    const self = this;
    this._events.on(name, (args) => {
      args = args || {};
      args.store = args.store || self._store;
      fn.apply(self, [args]);
    });
    return self;
  }

  unsubscribe(name, fn) {
    if (!this._events._events) {
      throw new Error("Unable to unsubscribe event, because there are no subscriptions");
    }
    if (!this._events._events[name] || !this._events._events[name].length) {
      throw new Error(`Unable to unsubscribe event '${name}', because there are no subscriptions`);
    }
    if (fn && typeof fn === "function") {
      if (this._events._events[name].indexOf(fn) === -1) {
        throw new Error(`Unable to unsubscribe event '${name}', because there are no subscriptions`);
      }
      return !!this._events._events[name].splice(this._events._events[name].indexOf(fn));
    }
    delete this._events._events[name];
    return true;
  }

  dispatch(name, ...args) {
    if (arguments.length === 1 && name instanceof Array) {
      args = name;
      name = args.shift();
    }
    if (!this._events._events || !this._events._events[name] || this._events._events[name].length === 0) {
      throw new Error(`Unable to dispatch event '${name}', because there are no subscribers`);
    }
    this._events.emit.apply(this._events, [name].concat(args));
  }
}

export { Events as default, Events };
