import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];

  let nombre = 'A';
  let logoUrl: string | null = null;
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
      logoUrl = tenant.logo_url ?? null;
      colorPrimary = tenant.tema?.color_primary ?? colorPrimary;
      colorBackground = tenant.tema?.color_background ?? colorBackground;
    }
  } catch {
    // Usar defaults si el backend no responde
  }

  // Si el tenant tiene logo configurado, redirigir a él
  if (logoUrl) {
    return NextResponse.redirect(logoUrl);
  }

  // Fallback: SVG con la inicial del tenant
  const inicial = nombre.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="96" fill="${colorBackground}"/>
    <rect width="512" height="512" rx="96" fill="${colorPrimary}" opacity="0.9"/>
    <text x="256" y="340" font-family="Arial,sans-serif" font-size="300" font-weight="bold"
      text-anchor="middle" fill="white">${inicial}</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
