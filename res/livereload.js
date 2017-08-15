const hello = {
  command: "hello",
  protocols: [
    "http://livereload.com/protocols/official-6",
    "http://livereload.com/protocols/official-7"
  ],
  ver: "2.2.2"
};

class LiveReload {
  constructor() {
    this.websocket = null;
  }

  open() {
    console.log("Live reload connected [35729]");
    this.websocket.send(JSON.stringify(hello));
  }

  close(event) {
    let reason;
    if (event.code === 1000) {
      reason = "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.";
    } else if (event.code === 1001) {
      reason = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
    } else if (event.code === 1002) {
      reason = "An endpoint is terminating the connection due to a protocol error";
    } else if (event.code === 1003) {
      reason = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
    } else if (event.code === 1004) {
      reason = "Reserved. The specific meaning might be defined in the future.";
    } else if (event.code === 1005) {
      reason = "No status code was actually present.";
    } else if (event.code === 1006) {
      reason = "The connection was closed abnormally, e.g., without sending or receiving a Close control frame";
    } else if (event.code === 1007) {
      reason = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).";
    } else if (event.code === 1008) {
      reason = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.";
    } else if (event.code === 1009) {
      reason = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
    } else if (event.code === 1010) {
      // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
      reason = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.reason;
    } else if (event.code === 1011) {
      reason = "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
    } else if (event.code === 1015) {
      reason = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
    } else {
      reason = "Unknown reason";
    }
    if (!event.wasClean) {
      console.error("Live Reload:", reason);
      setTimeout(() => {
        console.log("Reconnecting Live reload");
        this.connect();
      }, 2000);
    } else {
      console.log("Live reload stopped");
    }
  }

  message(msg) {
    const command = JSON.parse(msg.data);
    if (command.command !== "reload") { return null; }

    const paths = command.path.split("|");
    const handlers = this.handlers;

    function loadPath(paths) {
      const path = paths.shift();

      function done() {
        if (paths.length) {
          return setTimeout(() => loadPath(paths), 100);
        }

        return setTimeout(() => handlers().forEach(handler => handler()), 100);
      }

      if (path.match(/^\/$/)) {
        return location.reload(true);
      }
      if (path.match(/\.js$/)) {
        var currentScripts = document.querySelectorAll(`script[src^='${path}']`);

        if (!currentScripts.length) { return done(); }

        return currentScripts.forEach(script => {
          const src = script.getAttribute("src");
          const path = src.split("?")[0];
          script.remove();
          var newScript = document.createElement("script");
          newScript.setAttribute("src", `${path}?ts=${Date.now()}`);
          document.documentElement.appendChild(newScript);
          console.log(`Reloaded ${src}`);
          done();
        });

      } else if (path.match(/\.css$/)) {
        var currentStyles = document.querySelectorAll(`link[href^='${path}']`);

        if (!currentStyles.length) { return done(); }

        return currentStyles.forEach(style => {
          const href = style.getAttribute("href");
          const path = href.split("?")[0];
          const query = (href.split("?")[1] || "").split("&").filter(key => key.length > 0 && key.indexOf("ts=") !== 0);
          query.push("ts=" + Date.now());
          const querystring = query.length > 1 ? query.join("&") : query[0] || "";
          var newStyle = document.createElement("link");
          newStyle.setAttribute("rel", "stylesheet");
          newStyle.setAttribute("type", "text/css");
          newStyle.setAttribute("href", `${path}?${querystring}`);
          document.documentElement.appendChild(newStyle);
          setTimeout(() => style.remove(), 10);
          console.log(`Reloaded ${path}?${querystring}`);
          done();
        });

      } else {
        console.warn("Unknown file type changed", command.path);
        return done();
      }
    }

    loadPath(paths);
  }

  error() {
    // console.log("error", e);
  }

  connect() {
    try {
      const websocket = this.websocket = new WebSocket("ws://localhost:35729/livereload");

      websocket.addEventListener("open", this.onopen = this.open.bind(this));
      websocket.addEventListener("close", this.onclose = this.close.bind(this));
      websocket.addEventListener("message", this.onmessage = this.message.bind(this));
      websocket.addEventListener("error", this.onerror = this.error.bind(this));
    } catch (err) {
      console.error("Error connecting live reload [35729]");
    }
    return this;
  }

  disconnect() {
    const websocket = this.websocket;
    if (!WebSocket) { return undefined; }
    websocket.removeEventListener("open", this.onopen);
    websocket.removeEventListener("close", this.onclose);
    websocket.removeEventListener("message", this.onmessage);
    websocket.removeEventListener("error", this.onerror);
    return undefined;
  }

  onreload(handler) {
    this.handlers().push(handler);
  }

  handlers() {
    return (window.__livereload.handlers = window.__livereload.handlers || []);
  }
}

window.__livereload = window.__livereload || { instance: null, handlers: [] };

if (window.__livereload.instance) {
  window.__livereload.instance = window.__livereload.instance.disconnect();
}

window.__livereload.instance = new LiveReload().connect();
window.__livereload.onreload = window.__livereload.instance.onreload.bind(window.__livereload.instance);
