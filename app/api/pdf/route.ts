import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tipo = searchParams.get('tipo');
    const numero = searchParams.get('numero');
    
    if (!tipo || !numero) {
      return Response.json({ error: 'Faltan parámetros tipo y numero' }, { status: 400 });
    }

    // Hacer la petición al backend desde el servidor Next.js
    const backendUrl = `http://localhost:8000/api/v1/documentos-pdf/get?tipo=${tipo}&numero=${numero}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'x-api-key': 'supersecreta123',
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

  } catch (error: any) {
    console.error('Error in PDF proxy:', error);
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}