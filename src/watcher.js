/*eslint-env node*/ /*globals*/
"use strict";
const chokidar = require("chokidar");
const EventEmitter = require("events").EventEmitter;
const path = require("path");

class Watcher extends EventEmitter {
  constructor() {
    super();
    this.watching = {};
    this._watcher = null;
  }

  unwatch(module, file) {
    // console.log("unwatching", module, file);
    this._watcher.unwatch(file);
    this.watching[file][module] = false;

    if (!Object.keys(this.watching[file]).some(module => module)) {
      delete this.watching[file];
    }
  }

  watch(module, file) {
    if (this.watching[file] && this.watching[file][module]) { return; }

    this.watching[file] = this.watching[file] || [];
    this.watching[file][module] = true;
    // console.log("watching", module, file);

    if (this._watcher) {
      return this._watcher.add(path.dirname(file));
    }
    this._watcher = chokidar.watch(path.dirname(file), { persistent: true, usePolling: false });
    // this._watcher.on("all", function () { console.log("arguments", arguments) });
    this._watcher.on("change", (file, stats) => {
      // if (stats) console.log(`File ${file} changed size to ${stats.size}`);
      if (!this.watching[file]) { return; }
      Object.keys(this.watching[file]).forEach(module => {
        if (this.watching[file][module]) {
          // console.log("change", module, file);
          this.emit("change", module, file);
        }
      });
    });
  }

  update(module, files) {
    files.forEach(file => {
      if (!this.watching[file] || !this.watching[file][module]) {
        this.watch(module, file);
      }
    });

    Object.keys(this.watching).forEach(f => {
      if (this.watching[f][module] && files.indexOf(f) === -1) {
        this.unwatch(module, f);
      }
    });
  }

  plugin({ watch = false, name } = { watch: false }) {
    if (!watch) {
      return { name: "watch" };
    }
    if (!name) {
      throw new Error("Argument 'name' is required.");
    }
    const self = this;
    const files = [];
    return {
      name: "watch",
      options(options) {
        files.splice(0);
      },
      load(id) {
        files.push(id);
      },
      ongenerate() {
        self.update(name, files);
        files.splice(0);
      }
    };
  }
}

module.exports = new Watcher();
module.exports.Watcher = Watcher;
