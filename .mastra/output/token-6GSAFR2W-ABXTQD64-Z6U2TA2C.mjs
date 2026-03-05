import { r as require_token_util } from './chunk-OS7SAIRA.mjs';
import { _ as __commonJS, r as require_token_error } from './index.mjs';
import '@mastra/core/evals/scoreTraces';
import '@mastra/core/mastra';
import '@mastra/core/server';
import '@mastra/loggers';
import '@mastra/pg';
import '@mastra/observability';
import '@mastra/arize';
import '@mastra/core/agent';
import '@mastra/memory';
import 'zod';
import './tools/67f1dae1-d1c5-4ec7-ae80-d24c9307cdf5.mjs';
import '@mastra/core/tools';
import 'postgres';
import './tools/5206b3cc-df14-4c68-8b22-a47d0e267759.mjs';
import './tools/09da1bf1-8de8-4d11-adc0-972b9ff7b3f9.mjs';
import './tools/764f6249-5fff-455b-a69e-792238c88c18.mjs';
import './tools/f04419e1-9d74-49e9-9ab0-f45c89fd7374.mjs';
import './tools/4f143213-07c6-428e-b3fe-7b068f89ceda.mjs';
import './tools/70b1558e-827c-41dd-9fe0-c23a616b9b79.mjs';
import './tools/9827c337-6bf0-4cf0-b4bf-c1e91c356715.mjs';
import './tools/21147cd9-d137-4cbc-9fe3-e6ac591a6cf8.mjs';
import 'fs/promises';
import 'https';
import 'path';
import 'url';
import 'http';
import 'http2';
import 'stream';
import 'crypto';
import 'fs';
import 'process';
import '@mastra/core/utils/zod-to-json';
import '@mastra/core/workspace';
import '@mastra/core/processors';
import '@mastra/core/error';
import '@mastra/core/features';
import '@mastra/core/llm';
import '@mastra/core/request-context';
import '@mastra/core/utils';
import '@mastra/core/evals';
import '@mastra/core/storage';
import '@mastra/core/a2a';
import 'stream/web';
import 'zod/v3';
import 'zod/v4';
import '@mastra/core/memory';
import 'child_process';
import 'module';
import 'util';
import 'os';
import '@mastra/core/workflows';
import 'buffer';
import './tools.mjs';

// ../memory/dist/token-6GSAFR2W-ABXTQD64.js
var require_token = __commonJS({
  "../../../node_modules/.pnpm/@vercel+oidc@3.0.5/node_modules/@vercel/oidc/dist/token.js"(exports$1, module) {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var token_exports = {};
    __export(token_exports, {
      refreshToken: () => refreshToken
    });
    module.exports = __toCommonJS(token_exports);
    var import_token_error = require_token_error();
    var import_token_util = require_token_util();
    async function refreshToken() {
      const { projectId, teamId } = (0, import_token_util.findProjectInfo)();
      let maybeToken = (0, import_token_util.loadToken)(projectId);
      if (!maybeToken || (0, import_token_util.isExpired)((0, import_token_util.getTokenPayload)(maybeToken.token))) {
        const authToken = (0, import_token_util.getVercelCliToken)();
        if (!authToken) {
          throw new import_token_error.VercelOidcTokenError(
            "Failed to refresh OIDC token: login to vercel cli"
          );
        }
        if (!projectId) {
          throw new import_token_error.VercelOidcTokenError(
            "Failed to refresh OIDC token: project id not found"
          );
        }
        maybeToken = await (0, import_token_util.getVercelOidcToken)(authToken, projectId, teamId);
        if (!maybeToken) {
          throw new import_token_error.VercelOidcTokenError("Failed to refresh OIDC token");
        }
        (0, import_token_util.saveToken)(maybeToken, projectId);
      }
      process.env.VERCEL_OIDC_TOKEN = maybeToken.token;
      return;
    }
  }
});
var token6GSAFR2W = require_token();

export { token6GSAFR2W as default };
