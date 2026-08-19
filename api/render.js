import serverModule from '../dist/server/server.js';

export default async function handler(req, res) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'localhost';
    const url = `${protocol}://${host}${req.url}`;

    const init = {
      method: req.method,
      headers: req.headers,
      // For GET/HEAD don't pass body
      body: ['GET', 'HEAD'].includes(req.method) ? null : req,
      // nodal environment will stream the Node req into the Request
    };

    const request = new Request(url, init);

    // The server bundle exports a default with a `fetch(request, env, ctx)` method
    const srv = serverModule.default ?? serverModule;
    const response = await srv.fetch(request, process.env, {});

    res.statusCode = response.status;
    response.headers.forEach((v, k) => {
      // skip transfer-encoding if present
      if (k.toLowerCase() === 'transfer-encoding') return;
      res.setHeader(k, v);
    });

    const arrayBuffer = await response.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('render handler error', err);
    res.statusCode = 500;
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end(`<h1>Server error</h1><pre>${String(err)}</pre>`);
  }
}
