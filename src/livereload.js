/*eslint-env node*/ /*globals*/
"use strict";

const tinylr = require("tiny-lr");
const http = require("http");
const path = require("path");
const chokidar = require("chokidar");

class LiveReload {
  constructor({ port = 35729, root, stylus } = { port: 35729 }) {
    this.listening = false;
    this.port = port;
    this.root = root || "";
    this.stylus = stylus || "";
  }

  notify(filename) {
    http.request({
      port: this.port,
      path: "/changed?files=" + path.join("/", path.relative(this.root, filename))
    }).end();
  }

  serve({ port, root = "", stylus } = {}) {
    const self = this;

    this.port = port || this.port;
    this.root = root || this.root;
    this.stylus = stylus || this.stylus;

    if (this.stylus) {
      const watcher = chokidar.watch(this.stylus);
      watcher.on("change", name => {
        if (!name.match(/styl$/)) { return; }
        console.log("Reloading stylesheet", name);
        self.notify(name.replace(path.join(stylus, "/"), path.join(this.root, "/")).replace(/styl$/, "css"));
      });
    }

    tinylr().listen(this.port, () => {
      self.Listening = true;
      console.log(`Live Reload listening on ${self.port}`);
    });
  }
}

module.exports = new LiveReload();
module.exports.LiveReload = LiveReload;
