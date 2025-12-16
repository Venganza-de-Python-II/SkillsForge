import { NextResponse } from 'next/server';

/**
 * API Root - Información de endpoints disponibles
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'SkillsForge API - Desarrollo Local',
    version: '1.0.0',
    endpoints: {
      stats: {
        url: '/api/stats',
        method: 'GET',
        description: 'Estadísticas generales de la plataforma'
      },
      workshops: {
        url: '/api/workshops',
        method: 'GET',
        description: 'Lista de talleres disponibles',
        params: {
          sort: 'rating | fecha',
          order: 'asc | desc',
          limit: 'number'
        },
        example: '/api/workshops?sort=rating&order=desc&limit=3'
      }
    },
    note: 'Esta es una API mock para desarrollo local. Para producción, despliega el backend en AWS.',
    documentation: '/docs/api-specification.md'
  });
}
