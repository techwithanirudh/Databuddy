import { cacheable } from '@databuddy/redis';
import { z } from 'zod';
import { logger } from '../lib/logger';

const GeoLocationSchema = z.object({
  ip: z.string(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  loc: z.string().optional(),
  org: z.string().optional(),
  timezone: z.string().optional(),
});

type GeoLocation = z.infer<typeof GeoLocationSchema>;

const DEFAULT_GEO: GeoLocation = {
  ip: '',
  city: undefined,
  region: undefined,
  country: undefined,
  loc: undefined,
  org: undefined,
  timezone: undefined,
};

const PRIVATE_IPS = [
  '127.0.0.1',
  '::1',
  '0.0.0.0',
  '192.168.0.0/16',
  '172.16.0.0/12', 
  '10.0.0.0/8',
  'localhost',
  'local'
];

const IPINFO_TOKEN = process.env.IPINFO_TOKEN;
const IPINFO_TIMEOUT = 4000;
const CACHE_DURATION = 60 * 60 * 24; // 24 hours
const STALE_TIME = 60 * 60 * 12; // 12 hours

function constructIpInfoUrl(ip: string): string {
  if (!IPINFO_TOKEN) {
    throw new Error('IPINFO_TOKEN is not configured');
  }
  return `https://ipinfo.io/${ip}?token=${IPINFO_TOKEN}`;
}

async function fetchIpGeo(ip: string): Promise<GeoLocation> {
  if (!ip || PRIVATE_IPS.includes(ip)) {
    return DEFAULT_GEO;
  }

  try {
    const url = constructIpInfoUrl(ip);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), IPINFO_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.warn('Failed to fetch geo location', { 
        status: response.status,
        ip 
      });
      return DEFAULT_GEO;
    }

    const data = await response.json();
    const parsed = GeoLocationSchema.safeParse(data);

    if (!parsed.success) {
      logger.warn('Invalid geo location data', { 
        error: parsed.error,
        ip
      });
      return DEFAULT_GEO;
    }

    return parsed.data;
  } catch (error) {
    logger.error('Error fetching geo location', { 
      error,
      ip 
    });
    return DEFAULT_GEO;
  }
}

export const getGeoLocation = cacheable(fetchIpGeo, {
  expireInSec: CACHE_DURATION,
  prefix: 'geo',
  staleWhileRevalidate: true,
  staleTime: STALE_TIME,
});

export function getClientIp(req: Request): string | undefined {
  const ip = req.headers.get('cf-connecting-ip') || 
             req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip');
  return ip || undefined;
}

export function anonymizeIp(ip: string): string {
  if (!ip) return '';

  if (ip.includes('.')) {
    return ip.replace(/\.\d+$/, '.0');
  }
  
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 3).concat(Array(parts.length - 3).fill('0000')).join(':');
  }
  
  return ip;
}

export async function parseIp(req: Request): Promise<GeoLocation> {
  const ip = getClientIp(req);
  if (!ip) return DEFAULT_GEO;
  
  const anonymizedIp = anonymizeIp(ip);
  return getGeoLocation(anonymizedIp);
}

export async function getGeoData(ip: string): Promise<GeoLocation> {
  if (!ip) return DEFAULT_GEO;
  
  const geo = await getGeoLocation(ip);
  return {
    ip: anonymizeIp(ip),
    city: geo.city,
    region: geo.region,
    country: geo.country,
    loc: geo.loc,
    org: geo.org,
    timezone: geo.timezone,
  };
}
