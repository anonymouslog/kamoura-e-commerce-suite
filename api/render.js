// Vercel serverless wrapper: forwards Node requests to the compiled Vite server bundle
const { Readable } = require("stream");

function nodeHeadersToHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeHeaders || {})) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else if (value != null) {
      headers.set(key, String(value));
    }
  }
  return headers;
}

module.exports = async (req, res) => {
  try {
    const serverModule = require("../dist/server/server.js");
    const server = serverModule.default ?? serverModule;

    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const url = `${protocol}://${host}${req.url}`;

    const headers = nodeHeadersToHeaders(req.headers);

    // Node 18+ has global Request/Response
    const requestInit = {
      method: req.method,
      headers,
      // pass the raw incoming message as the body — fetch supports streams
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
    };

    const request = new Request(url, requestInit);
    const response = await server.fetch(request, {}, {});

    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.end(buffer);
  } catch (err) {
    console.error("render wrapper error", err);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Internal Server Error");
  }
};
import serverModule from "../dist/server/server.js";

export default async function handler(req, res) {
  try {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "localhost";
    const url = `${protocol}://${host}${req.url}`;

    const init = {
      method: req.method,
      headers: req.headers,
      // For GET/HEAD don't pass body
      body: ["GET", "HEAD"].includes(req.method) ? null : req,
      // nodal environment will stream the Node req into the Request
    };

    const request = new Request(url, init);

    // The server bundle exports a default with a `fetch(request, env, ctx)` method
    const srv = serverModule.default ?? serverModule;
    const response = await srv.fetch(request, process.env, {});

    res.statusCode = response.status;
    response.headers.forEach((v, k) => {
      // skip transfer-encoding if present
      if (k.toLowerCase() === "transfer-encoding") return;
      res.setHeader(k, v);
    });

    const arrayBuffer = await response.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("render handler error", err);
    res.statusCode = 500;
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end(`<h1>Server error</h1><pre>${String(err)}</pre>`);
  }
}
