import "@/config/load-env";

import { createServer, type IncomingMessage } from "node:http";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { env } from "@/config/env";
import { registerTools } from "./tools";

/**
 * Servidor MCP standalone (transporte HTTP, §5/§9). Comparte el mismo Drizzle
 * y la misma capa de servicios que la app Next → un solo codebase (RNF5).
 *
 * Run: `npm run mcp`
 * Hermes lo consume en http://localhost:${MCP_PORT}/mcp (modo stateless).
 */
function buildServer(): McpServer {
  const server = new McpServer({
    name: "energy-optimizer",
    version: "0.1.0",
  });
  registerTools(server);
  return server;
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

const httpServer = createServer(async (req, res) => {
  if (req.url !== "/mcp" || req.method !== "POST") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found. Use POST /mcp." }));
    return;
  }

  // Stateless: una instancia de server + transport por request.
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  const server = buildServer();

  res.on("close", () => {
    transport.close();
    server.close();
  });

  try {
    const body = await readBody(req);
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  } catch (error) {
    console.error("MCP request error:", error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
});

httpServer.listen(env.MCP_PORT, () => {
  console.log(`⚡ MCP server escuchando en http://localhost:${env.MCP_PORT}/mcp`);
});
