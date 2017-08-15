/*eslint-env*/ /*globals */
"use strict";

/**
 * This type represents an Event Emitter.
 * An event emitter is a base object that provides eventing functionality
 * @constructor
 */
const EventEmitter = function EventEmitter() {};

/**
 * Subscribe to an event
 * @param {String} name The name of the event to subscribe to
 * @param {Function} handler The handler to call when the event occurs
 * @return {EventEmitter} Return EventEmitter instance
 */
EventEmitter.prototype.on = function (name, handler) {
  if (!name) {
    throw new Error("Argument 'name' is required");
  }
  if (!handler) {
    throw new Error("Argument 'handler' is required");
  }
  /* Ensure the internal collection of events exists on this object */
  this._events = this._events || {};
  /* Store the event handler under the chosen event name */
  this._events[name] = [].concat(this._events[name] || []).concat(handler);
  return this;
};

/**
 * Subscribe to an event only once
 * @param {String} name The name of the event to subscribe to
 * @param {Function} handler The handler to call when the event occurs
 * @return {EventEmitter} Return EventEmitter instance
 */
EventEmitter.prototype.once = function (name, handler) {
  if (!name) {
    throw new Error("Argument 'name' is required");
  }
  if (!handler) {
    throw new Error("Argument 'handler' is required");
  }
  const onceHandler = function () {
    this._events[name].splice(this._events[name].indexOf(onceHandler), 1);
    handler.apply(this, arguments);
  };

  /* Ensure the internal collection of events exists on this object */
  this._events = this._events || {};
  /* Store the event handler under the chosen event name */
  this._events[name] = [].concat(this._events[name] || []).concat(onceHandler);
  return this;
};

/**
 * Emit an event
 * @param {String} name The name of the event to emit
 * @return {EventEmitter} Return EventEmitter instance
 */
EventEmitter.prototype.emit = function emit(name) {
  const self = this;
  /* if there are no registered handlers cancel emitting*/
  if (!this._events) { return this; }
  /* Get all the arguments and convert them into an array */
  const args = Array.prototype.slice.call(arguments);
  /* Remove the first argument which is the name of the event */
  args.splice(0, 1);
  /* Loop over the handlers and invoke them one by one */
  [].concat(this._events[name]).forEach(function (handler) {
    if (!handler) { return; }
    /* Call the handler and pass on the optional arguments */
    handler.apply(self, args);
  });
  return this;
};

/**
 * Remove all event listeners
 * @param {String} [name] Optional. The name of event to remove the listeners from
 * @return {EventEmitter} Return EventEmitter instance
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(name) {
  /* if there are no registered handlers cancel emitting*/
  if (!this._events) { return this; }
  if (!name) {
    this._events = {};
  } else {
    this._events[name] = [];
  }
  return this;
};

export { EventEmitter as default };
