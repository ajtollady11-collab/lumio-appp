#!/usr/bin/env node
// Development mail catcher (like Supabase CLI's Mailpit/Inbucket):
// - SMTP server that accepts every message and stores it in memory
// - HTTP API: GET /messages?to=<address> returns the latest messages for a recipient,
//             DELETE /messages clears the store.
// Sandbox and tests only. Never point a real mail flow at this.
import http from "node:http";
import net from "node:net";

const SMTP_PORT = Number(process.env.SMTP_PORT ?? 54325);
const API_PORT = Number(process.env.MAIL_API_PORT ?? 54324);
const messages = [];

function decodeQuotedPrintable(text) {
  return text
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function parseMessage(raw) {
  const [head, ...rest] = raw.split(/\r?\n\r?\n/);
  let body = rest.join("\n\n");
  const subject = /^Subject: (.*)$/im.exec(head)?.[1] ?? "";
  if (/quoted-printable/i.test(raw)) body = decodeQuotedPrintable(body);
  return { subject, body };
}

net
  .createServer((socket) => {
    let mode = "command";
    let buffer = "";
    let current = { from: "", to: [], data: "" };
    const send = (line) => socket.write(`${line}\r\n`);
    send("220 lumio-sandbox-mail ESMTP");
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      let index;
      while ((index = buffer.indexOf("\r\n")) !== -1) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        if (mode === "data") {
          if (line === ".") {
            mode = "command";
            const parsed = parseMessage(current.data);
            messages.push({ ...current, ...parsed, receivedAt: new Date().toISOString() });
            current = { from: "", to: [], data: "" };
            send("250 OK");
          } else {
            current.data += `${line.startsWith("..") ? line.slice(1) : line}\r\n`;
          }
          continue;
        }
        const upper = line.toUpperCase();
        if (upper.startsWith("EHLO")) {
          socket.write("250-lumio-sandbox-mail\r\n250 AUTH PLAIN LOGIN\r\n");
        } else if (upper.startsWith("HELO")) send("250 lumio-sandbox-mail");
        else if (upper.startsWith("AUTH")) send("235 Authentication successful");
        else if (upper.startsWith("MAIL FROM:")) {
          current.from = line.slice(10).trim();
          send("250 OK");
        } else if (upper.startsWith("RCPT TO:")) {
          current.to.push(line.slice(8).trim().replace(/[<>]/g, "").toLowerCase());
          send("250 OK");
        } else if (upper === "DATA") {
          mode = "data";
          send("354 End data with <CR><LF>.<CR><LF>");
        } else if (upper === "QUIT") {
          send("221 Bye");
          socket.end();
        } else if (upper === "RSET") {
          current = { from: "", to: [], data: "" };
          send("250 OK");
        } else send("250 OK");
      }
    });
    socket.on("error", () => {});
  })
  .listen(SMTP_PORT, "127.0.0.1", () => console.log(`smtp listening on ${SMTP_PORT}`));

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname !== "/messages") {
      res.writeHead(404).end();
      return;
    }
    if (req.method === "DELETE") {
      messages.length = 0;
      res.writeHead(204).end();
      return;
    }
    const to = url.searchParams.get("to")?.toLowerCase();
    const result = to ? messages.filter((m) => m.to.includes(to)) : messages;
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(result.slice(-20).reverse()));
  })
  .listen(API_PORT, "127.0.0.1", () => console.log(`mail api listening on ${API_PORT}`));
