/*eslint-env*//*globals*/
"use strict";

import React from "React";
import { store } from "./Store";
window.store = store;

class Component extends React.Component {
  constructor(...args) {
    super(...args);
    this.subs = this.subs || [];
    this.state = {};
  }
  stateChanged(state) {
    return Object.keys(this.state || {}).some((key) => {
      if (this.state[key] !== state[key]) {
        this.updateState();
        return true;
      }
      return false;
    });
  }

  componentWillMount() {
    // console.log("Mounting", this.name);
    this.handler = this.stateChanged.bind(this);
    this._subscriptionId = store.subscribe("*", this.handler);
    this.updateState();
  }

  componentWillUnmount() {
    // console.log("componentWillUnmount", this.name);
    store.unsubscribe(this._subscriptionId);
  }

  dispatch(name, ...args1) {
    return (...args2) => dispatch.apply(this, [name].concat(args1).concat(args2));
  }

  updateState() {
    const _state = {};

    if (this && this.subs) {
      this.subs.forEach((key) => {
        // if (!store.db[key]) {
        //   throw new Error(`There is no registered db entry for '${key}'`);
        // }
        _state[key] = store.db[key];
      });
    }

    this.setState(_state);
  }
}

function component({ name, subs }, children) {
  if (!name || typeof arguments[0] === "string") {
    name = arguments[0];
  }
  if (!name) {
    throw new Error("Please name your component for better error messages");
  }
  if (!subs && arguments.length > 2 && arguments[1] instanceof Array) {
    subs = arguments[1];
    children = undefined;
  }
  if (!children && typeof arguments[arguments.length - 1] === "function") {
    children = arguments[arguments.length - 1];
  }
  if (!children || typeof children !== "function") {
    throw new Error("Children are missing or not of type function");
  }
  return class AnonymousComponent extends Component {

    constructor(...args) {
      super(...args);
      this.subs = subs || [];
      this.name = name;
      this.children = children;
    }

    render() {
      return children.call(this, this.state, this.dispatch);
    }
  };
}

export { component as default, component, Component };
