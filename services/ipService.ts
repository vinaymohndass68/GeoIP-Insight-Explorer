
import { IpData } from '../types';

const ERROR_MAP: Record<string, string> = {
  'Reserved IP address': 'This IP belongs to a private range and cannot be tracked publicly.',
  'Invalid IP address': 'The IP address format is invalid.',
  'Rate limited': 'Too many requests. Please wait a moment.',
};

/**
 * Tier 1: ipapi.co
 */
async function fetchFromIpApi(ip: string): Promise<IpData> {
  const sanitizedIp = ip.trim();
  const url = sanitizedIp ? `https://ipapi.co/${sanitizedIp}/json/` : 'https://ipapi.co/json/';
  const response = await fetch(url);
  if (response.status === 429) throw new Error('Rate limited');
  const data = await response.json();
  if (data.error) throw new Error(data.reason || 'Service Error');
  return data;
}

/**
 * Tier 2: ipwho.is
 */
async function fetchFromIpWhoIs(ip: string): Promise<IpData> {
  const sanitizedIp = ip.trim();
  const url = `https://ipwho.is/${sanitizedIp}`;
  const response = await fetch(url);
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Secondary service failed');
  return {
    ip: data.ip,
    city: data.city,
    region: data.region,
    country_name: data.country,
    latitude: data.latitude,
    longitude: data.longitude,
    asn: data.connection?.asn ? `AS${data.connection.asn}` : '',
    org: data.connection?.org || data.connection?.isp || '',
    timezone: data.timezone?.id || '',
    postal: data.postal || ''
  };
}

/**
 * Tier 3: db-ip.com (Often less likely to be on simple blocklists)
 */
async function fetchFromDbIp(ip: string): Promise<IpData> {
  const sanitizedIp = ip.trim();
  const url = sanitizedIp ? `https://api.db-ip.com/v2/free/${sanitizedIp}` : 'https://api.db-ip.com/v2/free/self';
  const response = await fetch(url);
  if (!response.ok) throw new Error('DbIp failed');
  const data = await response.json();
  return {
    ip: data.ipAddress,
    city: data.city || 'Unknown',
    region: data.stateProv || 'Unknown',
    country_name: data.countryName || 'Unknown',
    latitude: 0, // DB-IP Free doesn't always give lat/lng
    longitude: 0,
    asn: '',
    org: '',
    timezone: '',
    postal: ''
  };
}

/**
 * Tier 4: freeipapi.com
 */
async function fetchFromFreeIpApi(ip: string): Promise<IpData> {
  const sanitizedIp = ip.trim();
  const url = sanitizedIp ? `https://freeipapi.com/api/json/${sanitizedIp}` : 'https://freeipapi.com/api/json';
  const response = await fetch(url);
  const data = await response.json();
  return {
    ip: data.ipAddress,
    city: data.cityName || 'Unknown',
    region: data.regionName || 'Unknown',
    country_name: data.countryName || 'Unknown',
    latitude: data.latitude,
    longitude: data.longitude,
    asn: '',
    org: '',
    timezone: data.timeZone || '',
    postal: data.zipCode || ''
  };
}

export const fetchIpData = async (ip: string): Promise<IpData> => {
  const providers = [fetchFromIpApi, fetchFromIpWhoIs, fetchFromDbIp, fetchFromFreeIpApi];
  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      return await provider(ip);
    } catch (err: any) {
      console.warn(`${provider.name} failed:`, err.message);
      lastError = err;
      if (err.message && ERROR_MAP[err.message]) {
        throw new Error(ERROR_MAP[err.message]);
      }
    }
  }

  // Use a specific message that the App can catch to trigger AI Search
  throw new Error('API_BLOCK');
};
