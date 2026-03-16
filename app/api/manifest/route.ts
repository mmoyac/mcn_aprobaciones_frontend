import { NextRequest, NextResponse } from 'next/server';

// Manifest dinámico por tenant.
// El móvil solicita /api/manifest con el Host del dominio correcto,
// por lo que podemos derivar el tenant y devolver nombre, colores e icono específicos.
export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0]; // quitar el puerto si existe

  // Defaults en caso de error
  let nombre = 'Aprobaciones';
  let shortName = 'Aprob.';
  let colorPrimary = '#5ec8f2';
  let colorBackground = '#0f172a';

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const res = await fetch(`${apiUrl}/tenant/config`, {
      headers: { 'X-Tenant-Domain': hostname },
      // No cachear en el servidor para que siempre refleje el tenant actual
      cache: 'no-store',
    });

    if (res.ok) {
      const tenant = await res.json();
      nombre = tenant.nombre ?? nombre;
      shortName = tenant.nombre ?? shortName;
      colorPrimary = tenant.tema?.color_primary ?? colorPrimary;
      colorBackground = tenant.tema?.color_background ?? colorBackground;
    }
  } catch {
    // Si el backend no responde, usamos los defaults definidos arriba
  }

  // Generar icono SVG dinámico con la inicial y el color del tenant
  const inicial = nombre.charAt(0).toUpperCase();
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="96" fill="${colorPrimary}"/>
    <text x="256" y="340" font-family="Arial,sans-serif" font-size="300" font-weight="bold"
      text-anchor="middle" fill="white">${inicial}</text>
  </svg>`;
  const iconDataUrl = `data:image/svg+xml,${encodeURIComponent(svgIcon)}`;

  const manifest = {
    name: `${nombre} Aprobaciones`,
    short_name: nombre,
    description: `Panel de aprobaciones ${nombre}`,
    start_url: '/',
    display: 'standalone',
    background_color: colorBackground,
    theme_color: colorPrimary,
    orientation: 'portrait',
    icons: [
      {
        src: iconDataUrl,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      // Sin cache en el cliente para que refleje cambios de tenant
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
