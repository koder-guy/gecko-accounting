import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const years = await prisma.taxYear.findMany({
      orderBy: { startDate: 'desc' },
    });
    return NextResponse.json(years);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tax years' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ty = await prisma.taxYear.create({
      data: {
        label: body.label,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        isCurrent: false,
      },
    });
    return NextResponse.json(ty);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tax year' }, { status: 500 });
  }
}
