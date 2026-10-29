import serverless from "serverless-http";
import { createApiApp } from "../../server/app";

const app = createApiApp();

export const handler = serverless(app, {
  requestId: "x-nf-request-id",
});
