import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting
const rateLimit = new Map<string, { count: number; timestamp: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 100; // máximo 100 requests por minuto por IP

// IPs bloqueadas
const BLOCKED_IPS: string[] = [
  // '1.2.3.4',
];

// User agents sospechosos o patrones maliciosos
const BLOCKED_USER_AGENTS = [
  'sqlmap',
  'nikto',
  'nmap',
  'masscan',
  'python-requests',
  'curl',
  'wget',
];

// Paths que no necesitan rate limiting
const EXCLUDED_PATHS = [
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
];

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  return realIP || 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimit.get(ip);
  
  if (!record) {
    rateLimit.set(ip, { count: 1, timestamp: now });
    return false;
  }
  
  // Si pasó la ventana, resetear
  if (now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimit.set(ip, { count: 1, timestamp: now });
    return false;
  }
  
  // Incrementar contador
  record.count++;
  
  if (record.count > MAX_REQUESTS) {
    return true;
  }
  
  return false;
}

function isSuspiciousRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  const url = request.url.toLowerCase();
  
  // Bloquear user agents maliciosos
  for (const blocked of BLOCKED_USER_AGENTS) {
    if (userAgent.includes(blocked)) {
      return true;
    }
  }
  
  // Bloquear intentos de SQL injection en URL
  const sqlPatterns = [
    'union+select',
    'union%20select',
    '--',
    ';drop',
    'xp_cmdshell',
    'exec(',
    'execute(',
  ];
  
  for (const pattern of sqlPatterns) {
    if (url.includes(pattern)) {
      return true;
    }
  }
  
  // Bloquear path traversal
  if (url.includes('../') || url.includes('..%2f')) {
    return true;
  }
  
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Excluir assets estáticos
  if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  const ip = getClientIP(request);
  
  // Bloquear IPs en lista negra
  if (BLOCKED_IPS.includes(ip)) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // Bloquear requests sospechosos
  if (isSuspiciousRequest(request)) {
    console.log(`[BLOCKED] Suspicious request from ${ip}: ${request.url}`);
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // Rate limiting
  if (isRateLimited(ip)) {
    console.log(`[RATE LIMITED] ${ip}`);
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '60',
      }
    });
  }
  
  // Headers de seguridad
  const response = NextResponse.next();
  
  // Prevenir clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevenir sniffing de MIME type
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

// Solo aplicar a estas rutas
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
