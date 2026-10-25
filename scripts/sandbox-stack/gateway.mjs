#!/usr/bin/env node
// Minimal stand-in for Supabase's API gateway: one base URL that routes
//   /auth/v1/*  -> GoTrue (Supabase Auth)
//   /rest/v1/*  -> PostgREST
// so @supabase/supabase-js works unchanged against the sandbox stack.
import http from "node:http";

const PORT = Number(process.env.GATEWAY_PORT ?? 54321);
const routes = [
  { prefix: "/auth/v1", port: Number(process.env.GOTRUE_PORT ?? 54329) },
  { prefix: "/rest/v1", port: Number(process.env.POSTGREST_PORT ?? 54330) },
];

const server = http.createServer((req, res) => {
  const route = routes.find(
    (r) =>
      req.url === r.prefix ||
      req.url.startsWith(`${r.prefix}/`) ||
      req.url.startsWith(`${r.prefix}?`),
  );
  if (!route) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ message: "no route" }));
    return;
  }
  const path = req.url.slice(route.prefix.length) || "/";
  const upstream = http.request(
    {
      host: "127.0.0.1",
      port: route.port,
      path,
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${route.port}` },
    },
    (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    },
  );
  upstream.on("error", (error) => {
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ message: "upstream unavailable", detail: error.message }));
  });
  req.pipe(upstream);
});

server.listen(PORT, "127.0.0.1", () => console.log(`gateway listening on ${PORT}`));
