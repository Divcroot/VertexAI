import proxy from "express-http-proxy";
import type { Request } from "express";

import { env } from "../config/env.js";

const proxyWithUserId = (serviceUrl: string) =>
  proxy(serviceUrl, {
    proxyReqOptDecorator: (proxyReqOpts, req: Request) => {
      const userId = req.user?.userId;

      if (userId) {
        proxyReqOpts.headers = {
          ...proxyReqOpts.headers,
          "x-user-id": userId,
        };
      }

      return proxyReqOpts;
    },
  });

export const authServiceProxy = proxy(env.AUTH_SERVICE_URL);

export const projectServiceProxy = proxyWithUserId(env.PROJECT_SERVICE_URL);

export const fileServiceProxy = proxyWithUserId(env.FILE_SERVICE_URL);

export const aiServiceProxy = proxyWithUserId(env.AI_SERVICE_URL);

export const terminalServiceProxy = proxyWithUserId(env.TERMINAL_SERVICE_URL);

export const paymentServiceProxy = proxyWithUserId(env.PAYMENT_SERVICE_URL);