import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];

  let nombre = 'A';
  let colorPrimary = '#5ec8f2';
  let colorBackground = '#0f172a';

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const res = await fetch(`${apiUrl}/tenant/config`, {
      headers: { 'X-Tenant-Domain': hostname },
      cache: 'no-store',
    });
    if (res.ok) {
      const tenant = await res.json();
      nombre = tenant.nombre ?? nombre;
      colorPrimary = tenant.tema?.color_primary ?? colorPrimary;
      colorBackground = tenant.tema?.color_background ?? colorBackground;
    }
  } catch {
    // Usar defaults si el backend no responde
  }

  const inicial = nombre.charAt(0).toUpperCase();

  // iOS espera 180x180 para apple-touch-icon
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
    <rect width="180" height="180" rx="34" fill="${colorBackground}"/>
    <rect width="180" height="180" rx="34" fill="${colorPrimary}" opacity="0.9"/>
    <text x="90" y="120" font-family="Arial,sans-serif" font-size="108" font-weight="bold"
      text-anchor="middle" fill="white">${inicial}</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
