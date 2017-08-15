/*eslint-env node*/ /*globals*/
"use strict";

const rollup = require("rollup");

module.exports = function init({ watcher = null, livereload = null } = {}) {

  return function (config) {
    if (!config) {
      throw new Error("Argument 'config' is required.");
    }
    if (!config.dest) {
      throw new Error("Argument 'config.dest' is required.");
    }
    if (!config.entry) {
      throw new Error("Argument 'config.entry' is required.");
    }
    if (!config.moduleName) {
      throw new Error("Argument 'config.moduleName' is required.");
    }

    if (watcher) {
      watcher.on("change", (module, id) => {
        if (config.moduleName !== module) { return; }
        console.log("Module changed", module, id);
        bundle();
      });
    }

    function bundle() {
      return rollup.rollup(config).then((bundler) => {
        console.log(`Bundled module '${config.moduleName}'`);
        bundler.modules.forEach(module => console.log(` <- ${module.id}`));
        console.log(` -> ${config.dest}`);
        bundler.write(config);
        livereload && livereload.notify(config.dest);
      }).catch((err) => console.log("error", err));
    }

    bundle();
    return livereload && livereload.notify("/");
  };
};
