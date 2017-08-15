/*eslint-env node*/ /*globals*/
"use strict";

const watcher = require("./src/watcher");
const livereload = require("./src/livereload");

const vey = {
  config: require("./src/config")({ watcher }),
  bundle() { require("./src/bundle")({ watcher, livereload }).apply(this, arguments); return vey; },
  serve() { require("./src/serve").apply(this, arguments); return vey; },
  livereload() { livereload.serve.apply(livereload, arguments); return vey; }
};

module.exports = vey;
