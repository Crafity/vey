/*eslint-env node*/ /*globals*/
"use strict";

const http = require("http");
const fs = require("fs");
const mime = require("mime");
const stylus = require("stylus");
const path = require("path");
const Readable = require("stream").Readable;

module.exports = function serve({ root = "public", css = "src", port = 2020 } = { "root": "public", "css": "src", "port": 2020 }) {
  /* * * * * * * * * * * * * * * * * * * * * *
   * CREATE HTTP SERVER
   */

  http.createServer((req, res) => {
    if (req.url === "/") {
      const file = path.join(root, "/index.htm");
      return fs.stat(file, (err) => {
        if (err) { return fileNotFound(file); }
        res.writeHead(200, { "Content-Type": "text/html" });
        return fs.createReadStream(file).pipe(res);
      });
    }
    const filename = req.url.split("?")[0];
    const qs = req.url.split("?")[1];

    function fileNotFound(filename) {
      console.error(`[404] File not found [${filename}]`);
      res.writeHead(404, { "Content-Type": "text/html" });
      return res.end(`<h1>[404] File not found '${filename}'</h1>`);
    }

    if (filename.match(/\.css$/gi) && (qs || "").indexOf("type=stylus") > -1) {
      const cssFilename = filename.replace(/\.css$/gi, ".styl");
      const file = path.join(css, cssFilename);
      return fs.stat(file, (err) => {
        if (err) { return fileNotFound(file); }
        return fs.readFile(file, (err, data) => {
          try {
            if (err) { throw err; }
            const stylusOutput = stylus.render(data.toString(), {
              compress: true,
              paths: [css, path.dirname(file)]
            });
            res.writeHead(200, { "Content-Type": "text/css" });
            return (new StringStream(stylusOutput)).pipe(res);
          } catch (renderErr) {
            console.error(renderErr);
            res.writeHead(200, { "Content-Type": "text/css" });
            return res.end("body { padding: 10px; margin: 0; border: 10px dashed red;}");
          }
        });
      });
    }

    return fs.stat(root + filename, (err) => {
      if (err) { return fileNotFound(root + filename); }
      res.writeHead(200, { "Content-Type": mime.lookup(filename) });
      return fs.createReadStream(root + filename).pipe(res);
    });

  }).listen(port, () => console.log(`Web Server listening on ${port}`));

};

class StringStream extends Readable {
  constructor(text) {
    super();
    // Readable.call(this);
    this._text = text;
  }

  _read() {
    if (this._text) {
      this.push(this._text);
      return (this._text = null);
    }
    return this.push(null);
  }
}
