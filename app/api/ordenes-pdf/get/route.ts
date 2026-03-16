import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const numero = searchParams.get('numero');
    const locCod = searchParams.get('loc_cod');

    if (!numero || !locCod) {
      return Response.json({ error: 'Faltan parámetros numero y loc_cod' }, { status: 400 });
    }

    // Hacer la petición al backend para órdenes de compra (tipo=2)
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8050/api/v1';
    const backendUrl = `${API_BASE}/documentos-pdf/get-cliente?loc_cod=${locCod}&tipo=2&numero=${numero}`;
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
        'Content-Disposition': `attachment; filename="orden-compra-${numero}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('Error in PDF proxy for órdenes:', error);
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}