import { NextRequest, NextResponse } from 'next/server';

// URL del API Gateway de AWS (backend real)
const AWS_API_URL = 'https://qt6hwpaad0.execute-api.us-east-1.amazonaws.com/dev';

/**
 * GET /api/workshops - Proxy a AWS API Gateway
 * Esta ruta actúa como proxy para evitar problemas de CORS
 * y conectar al backend real de AWS
 */
export async function GET(request: NextRequest) {
  try {
    // Hacer proxy al API Gateway de AWS
    const response = await fetch(`${AWS_API_URL}/workshops`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Importante: no enviar credenciales para evitar problemas CORS
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('AWS API Error:', response.status, response.statusText);
      return NextResponse.json(
        { success: false, error: `AWS API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transformar los datos de AWS al formato esperado por el frontend
    const workshops = data.workshops || data.data || [];

    // Aplicar filtros si se pasan como query params
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort');
    const order = searchParams.get('order');
    const limit = searchParams.get('limit');

    let filteredWorkshops = [...workshops];

    // Sort by rating if requested
    if (sort === 'rating') {
      filteredWorkshops.sort((a: { rating?: number }, b: { rating?: number }) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return order === 'desc' ? ratingB - ratingA : ratingA - ratingB;
      });
    }

    // Sort by fecha if requested
    if (sort === 'fecha') {
      filteredWorkshops.sort((a: { fecha?: string }, b: { fecha?: string }) => {
        const dateA = new Date(a.fecha || '').getTime();
        const dateB = new Date(b.fecha || '').getTime();
        return order === 'desc' ? dateB - dateA : dateA - dateB;
      });
    }

    // Limit results if requested
    if (limit) {
      filteredWorkshops = filteredWorkshops.slice(0, parseInt(limit));
    }

    return NextResponse.json({
      success: true,
      data: filteredWorkshops,
      total: filteredWorkshops.length,
      source: 'aws' // Indicador de que los datos vienen de AWS
    });

  } catch (error) {
    console.error('Error fetching from AWS:', error);

    // Si falla la conexión a AWS, podríamos devolver datos mock como fallback
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to AWS backend',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
