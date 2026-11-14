/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as callNotices from "../callNotices.js";
import type * as crons from "../crons.js";
import type * as documents from "../documents.js";
import type * as extraction from "../extraction.js";
import type * as http from "../http.js";
import type * as ingestion from "../ingestion.js";
import type * as lib_appError from "../lib/appError.js";
import type * as lib_builders from "../lib/builders.js";
import type * as lib_env from "../lib/env.js";
import type * as lib_httpError from "../lib/httpError.js";
import type * as model_firecrawl_client from "../model/firecrawl/client.js";
import type * as model_firecrawl_payload from "../model/firecrawl/payload.js";
import type * as model_ingestion_runSourceIngestion from "../model/ingestion/runSourceIngestion.js";
import type * as model_llm_chatCompletions from "../model/llm/chatCompletions.js";
import type * as model_llm_chatCompletionsPayload from "../model/llm/chatCompletionsPayload.js";
import type * as model_llm_evidence from "../model/llm/evidence.js";
import type * as model_llm_generateJson from "../model/llm/generateJson.js";
import type * as model_mapasCulturais_client from "../model/mapasCulturais/client.js";
import type * as model_mapasCulturais_date from "../model/mapasCulturais/date.js";
import type * as model_mapasCulturais_listing from "../model/mapasCulturais/listing.js";
import type * as model_mapasCulturais_payload from "../model/mapasCulturais/payload.js";
import type * as model_nvoip_client from "../model/nvoip/client.js";
import type * as model_nvoip_payload from "../model/nvoip/payload.js";
import type * as sources from "../sources.js";
import type * as whatsapp from "../whatsapp.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  callNotices: typeof callNotices;
  crons: typeof crons;
  documents: typeof documents;
  extraction: typeof extraction;
  http: typeof http;
  ingestion: typeof ingestion;
  "lib/appError": typeof lib_appError;
  "lib/builders": typeof lib_builders;
  "lib/env": typeof lib_env;
  "lib/httpError": typeof lib_httpError;
  "model/firecrawl/client": typeof model_firecrawl_client;
  "model/firecrawl/payload": typeof model_firecrawl_payload;
  "model/ingestion/runSourceIngestion": typeof model_ingestion_runSourceIngestion;
  "model/llm/chatCompletions": typeof model_llm_chatCompletions;
  "model/llm/chatCompletionsPayload": typeof model_llm_chatCompletionsPayload;
  "model/llm/evidence": typeof model_llm_evidence;
  "model/llm/generateJson": typeof model_llm_generateJson;
  "model/mapasCulturais/client": typeof model_mapasCulturais_client;
  "model/mapasCulturais/date": typeof model_mapasCulturais_date;
  "model/mapasCulturais/listing": typeof model_mapasCulturais_listing;
  "model/mapasCulturais/payload": typeof model_mapasCulturais_payload;
  "model/nvoip/client": typeof model_nvoip_client;
  "model/nvoip/payload": typeof model_nvoip_payload;
  sources: typeof sources;
  whatsapp: typeof whatsapp;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
