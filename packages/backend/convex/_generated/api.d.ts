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
import type * as ingestion from "../ingestion.js";
import type * as lib_appError from "../lib/appError.js";
import type * as lib_builders from "../lib/builders.js";
import type * as model_ingestion_runSourceIngestion from "../model/ingestion/runSourceIngestion.js";
import type * as model_mapasCulturais_client from "../model/mapasCulturais/client.js";
import type * as model_mapasCulturais_date from "../model/mapasCulturais/date.js";
import type * as model_mapasCulturais_listing from "../model/mapasCulturais/listing.js";
import type * as model_mapasCulturais_payload from "../model/mapasCulturais/payload.js";
import type * as sources from "../sources.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  callNotices: typeof callNotices;
  crons: typeof crons;
  ingestion: typeof ingestion;
  "lib/appError": typeof lib_appError;
  "lib/builders": typeof lib_builders;
  "model/ingestion/runSourceIngestion": typeof model_ingestion_runSourceIngestion;
  "model/mapasCulturais/client": typeof model_mapasCulturais_client;
  "model/mapasCulturais/date": typeof model_mapasCulturais_date;
  "model/mapasCulturais/listing": typeof model_mapasCulturais_listing;
  "model/mapasCulturais/payload": typeof model_mapasCulturais_payload;
  sources: typeof sources;
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
