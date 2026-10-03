import { NextResponse } from 'next/server';
import dns from 'node:dns/promises';
import { scrapeWebsite } from '@/lib/scraper';
import { withAuth } from '@/lib/auth';
import { serverErrorMessage } from '@/lib/api/serverError';

function isPrivateOrReservedIp(ip) {
  // IPv4
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 0) return true; // 0.0.0.0/8
    if (a >= 224) return true; // multicast/reserved
    return false;
  }
  // IPv6
  const lower = ip.toLowerCase();
  if (lower === '::1') return true; // loopback
  if (lower.startsWith('fe80:')) return true; // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
  if (lower.startsWith('::ffff:')) return isPrivateOrReservedIp(lower.replace('::ffff:', ''));
  return false;
}

async function assertPublicUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return 'Invalid URL';
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return 'Only http/https URLs are allowed';
  }
  const hostname = parsed.hostname;
  if (hostname === 'localhost' || hostname.endsWith('.local')) {
    return 'URL host is not allowed';
  }
  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    return 'Could not resolve URL host';
  }
  if (addresses.some((a) => isPrivateOrReservedIp(a.address))) {
    return 'URL resolves to a private or internal address, which is not allowed';
  }
  return null;
}

export const POST = withAuth()(async (req) => {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const validationError = await assertPublicUrl(url);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await scrapeWebsite(url);

    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: serverErrorMessage(error) }, { status: 500 });
  }
});
