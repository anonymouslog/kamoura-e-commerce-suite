// ESM-compatible Vercel serverless wrapper

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

export default async function handler(req, res) {
  try {
    const serverModule = await import("../dist/server/server.js");
    const server = serverModule.default ?? serverModule;

    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "localhost";
    const url = `${protocol}://${host}${req.url}`;

    const headers = nodeHeadersToHeaders(req.headers);

    const init = {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req,
    };

    const request = new Request(url, init);
    const response = await server.fetch(request, process.env, {});

    res.statusCode = response.status;
    response.headers.forEach((v, k) => {
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
