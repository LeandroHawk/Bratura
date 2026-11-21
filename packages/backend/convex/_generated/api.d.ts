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
import type * as lib_monthNames from "../lib/monthNames.js";
import type * as lib_sha256 from "../lib/sha256.js";
import type * as lib_text from "../lib/text.js";
import type * as model_callNoticeDocuments_selection from "../model/callNoticeDocuments/selection.js";
import type * as model_callNoticeExtraction_prompt from "../model/callNoticeExtraction/prompt.js";
import type * as model_callNoticeExtraction_verify from "../model/callNoticeExtraction/verify.js";
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
import type * as model_officialPage_client from "../model/officialPage/client.js";
import type * as model_officialPage_discovery from "../model/officialPage/discovery.js";
import type * as model_officialPage_html from "../model/officialPage/html.js";
import type * as model_officialPage_listing from "../model/officialPage/listing.js";
import type * as model_officialPage_payload from "../model/officialPage/payload.js";
import type * as model_officialPage_registrationClose from "../model/officialPage/registrationClose.js";
import type * as model_pdfText_pdfTextOnSourceHost from "../model/pdfText/pdfTextOnSourceHost.js";
import type * as model_sourceHost_fetchOnSourceHost from "../model/sourceHost/fetchOnSourceHost.js";
import type * as model_sources_registry from "../model/sources/registry.js";
import type * as model_telegram_client from "../model/telegram/client.js";
import type * as model_telegram_payload from "../model/telegram/payload.js";
import type * as model_telegram_sendMessage from "../model/telegram/sendMessage.js";
import type * as notificationDeliveries from "../notificationDeliveries.js";
import type * as pdfText from "../pdfText.js";
import type * as sources from "../sources.js";
import type * as telegram from "../telegram.js";
import type * as userMessageChannels from "../userMessageChannels.js";
import type * as userNotifications from "../userNotifications.js";
import type * as users from "../users.js";

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
  "lib/monthNames": typeof lib_monthNames;
  "lib/sha256": typeof lib_sha256;
  "lib/text": typeof lib_text;
  "model/callNoticeDocuments/selection": typeof model_callNoticeDocuments_selection;
  "model/callNoticeExtraction/prompt": typeof model_callNoticeExtraction_prompt;
  "model/callNoticeExtraction/verify": typeof model_callNoticeExtraction_verify;
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
  "model/officialPage/client": typeof model_officialPage_client;
  "model/officialPage/discovery": typeof model_officialPage_discovery;
  "model/officialPage/html": typeof model_officialPage_html;
  "model/officialPage/listing": typeof model_officialPage_listing;
  "model/officialPage/payload": typeof model_officialPage_payload;
  "model/officialPage/registrationClose": typeof model_officialPage_registrationClose;
  "model/pdfText/pdfTextOnSourceHost": typeof model_pdfText_pdfTextOnSourceHost;
  "model/sourceHost/fetchOnSourceHost": typeof model_sourceHost_fetchOnSourceHost;
  "model/sources/registry": typeof model_sources_registry;
  "model/telegram/client": typeof model_telegram_client;
  "model/telegram/payload": typeof model_telegram_payload;
  "model/telegram/sendMessage": typeof model_telegram_sendMessage;
  notificationDeliveries: typeof notificationDeliveries;
  pdfText: typeof pdfText;
  sources: typeof sources;
  telegram: typeof telegram;
  userMessageChannels: typeof userMessageChannels;
  userNotifications: typeof userNotifications;
  users: typeof users;
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
