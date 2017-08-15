/*eslint-env node*/ /*globals*/
"use strict";

const commonjs = require("rollup-plugin-commonjs");
const nodeResolve = require("rollup-plugin-node-resolve");
const replace = require("rollup-plugin-replace");
const buble = require("rollup-plugin-buble");
const includePaths = require("rollup-plugin-includepaths");
const uglify = require("rollup-plugin-uglify");
const alias = require("rollup-plugin-alias");
const fs = require("fs");

module.exports = function init({ watcher = null } = {}) {

  function livereload({ livereload = false } = { livereload: false }) {
    if (!livereload) { return { name: "livereload" }; }
    return {
      name: "livereload",
      intro() {
        if (!livereload) { return ""; }
        return fs.readFileSync(`${__dirname}/../res/livereload.js`);
      }
    };
  }

  function config(options) {
    if (!options.entry) {
      throw new Error("Argument 'options.entry' is required.");
    }
    if (!options.dest) {
      throw new Error("Argument 'options.dest' is required.");
    }
    if (!options.name) {
      throw new Error("Argument 'options.name' is required.");
    }
    const config = {
      format: "umd",
      sourceMap: options.sourceMap ? "inline" : undefined,
      globals: options.globals,
      external: options.external,
      plugins: [
        livereload(options),
        options.watch && watcher.plugin(options),
        alias(options.alias),
        alias({ vey: __dirname + "/../res/vey.js" }),
        buble(),
        commonjs({ exclude: ["node_modules/**"] }),
        replace({
          "process.env.NODE_ENV": "\"" + process.env.NODE_ENV + "\"" || "dev"
        }),
        nodeResolve({
          main: true,
          browser: true
        }),
        (options.minify || process.env.NODE_ENV === "production") && uglify()
      ],
      treeshake: "true",
    };

    config.entry = options.entry;
    config.dest = options.dest;
    config.moduleName = options.name;

    return config;
  };

  return config;
};
