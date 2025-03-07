import express, { Express, Request, Response } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";

const app: Express = express();
let requestCount: number = 0;

app.use(
  "/gmail/v1/users/me/messages",
  createProxyMiddleware({
    target: "https://www.googleapis.com",
    changeOrigin: true,
    onProxyReq: (_proxyReq: any, _req: Request, res: Response) => {
      requestCount++;
      if (requestCount <= 2) {
        res.statusCode = 429;
        res.end("Too Many Requests");
      } else {
        res.statusCode = 200;
        res.end(JSON.stringify({ messages: [{ id: "1", threadId: "1" }] }));
      }
    },
  } as Options)
);

app.listen(3002, () => console.log("Proxy running on port 3002"));
