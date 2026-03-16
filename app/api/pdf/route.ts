import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tipo = searchParams.get('tipo');
    const numero = searchParams.get('numero');

    if (!tipo || !numero) {
      return Response.json({ error: 'Faltan parámetros tipo y numero' }, { status: 400 });
    }

    // URL interna al backend (server-side)
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8050/api/v1';
    const backendUrl = `${API_BASE}/documentos-pdf/get?tipo=${tipo}&numero=${numero}`;

    // Tenant domain: viene del host del request del cliente
    const tenantDomain = request.headers.get('host')?.split(':')[0] || '';

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.PDF_API_KEY || '',
        'x-tenant-domain': tenantDomain,
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      return Response.json(
        { error: `Error del backend: ${response.status} - ${response.statusText}` },
        { status: response.status }
      );
    }

    const pdfBuffer = await response.arrayBuffer();
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.byteLength.toString(),
        'Content-Disposition': `attachment; filename="presupuesto-${numero}.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error('Error in PDF proxy:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}