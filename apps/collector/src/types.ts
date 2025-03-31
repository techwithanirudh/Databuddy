import type { KVNamespace, D1Database } from '@cloudflare/workers-types';

// --- Placeholder Logger Type (Adjust if you have a proper import) ---
type Logger = {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
};

// --- Provided Type Definitions ---
export interface Website {
  id: string;
  name: string;
  domain: string;
  status: string;
  userId: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface EnrichedData {
  url: string;
  path: string;
  title: string;
  user_agent: string;
  browser: string;
  browser_version: string;
  os: string;
  os_version: string;
  device_type: string;
  device_vendor: string;
  device_model: string;
  screen_resolution: string;
  viewport_size: string;
  language: string;
  timezone: string;
  timezone_offset: number | null;
  connection_type: string;
  connection_speed: string;
  rtt: number | null;
  ip: string;
  country: string;
  region: string;
  city: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  load_time: number | null;
  dom_ready_time: number | null;
  ttfb: number | null;
  redirect_time: number | null;
  domain_lookup_time: number | null;
  connection_time: number | null;
  request_time: number | null;
  render_time: number | null;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  page_size: number | null;
  time_on_page: number | null;
  page_count: number | null;
  scroll_depth: number | null;
  interaction_count: number | null;
  exit_intent: number;
}

export interface TrackingEvent {
  type: 'track' | 'alias' | 'increment' | 'decrement';
  payload: {
    name?: string;
    anonymousId?: string;
    profileId?: string;
    properties?: Record<string, any>;
    property?: string;
    value?: number;
    screen_resolution?: string;
    viewport_size?: string;
    language?: string;
    timezone?: string;
    timezone_offset?: number | null;
    connection_type?: string;
    connection_speed?: string;
    rtt?: number | null;
    load_time?: number | null;
    dom_ready_time?: number | null;
    ttfb?: number | null;
    redirect_time?: number | null;
    domain_lookup_time?: number | null;
    connection_time?: number | null;
    request_time?: number | null;
    render_time?: number | null;
    fcp?: number | null;
    lcp?: number | null;
    cls?: number | null;
    page_size?: number | null;
    time_on_page?: number | null;
    page_count?: number | null;
    scroll_depth?: number | null;
    interaction_count?: number | null;
    exit_intent?: number;
    title?: string;
    path?: string;
    session_id?: string;
    session_start_time?: string;
    referrer?: string;
    referrer_type?: string;
    referrer_name?: string;
    sdk_name?: string;
    sdk_version?: string;
    __raw_properties?: Record<string, any>;
    __enriched?: EnrichedData;
  };
}

// --- Updated Env Interface ---
export interface Env {
  DB: D1Database;
  kv_collect: KVNamespace;
  LOGGER?: Logger;
  DATABUDDY_SECRET?: string;
}

// --- Updated AppVariables Interface ---
export interface AppVariables {
  log: Logger; // Using placeholder Logger (Ensure this is available in context)
  config: Env; // Environment bindings
  website?: Website;
  enriched?: EnrichedData;
  event?: TrackingEvent;
} 