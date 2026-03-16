import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

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

  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          borderRadius: 96,
          background: `linear-gradient(135deg, ${colorPrimary}, ${colorBackground})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 280,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {inicial}
      </div>
    ),
    {
      width: 512,
      height: 512,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
