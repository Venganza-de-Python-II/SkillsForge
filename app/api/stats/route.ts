import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      totalTalleres: 15,
      talleresActivos: 8,
      totalInscritos: 234,
      promedioAsistencia: 85.5
    }
  });
}
