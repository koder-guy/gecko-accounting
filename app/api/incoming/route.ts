import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // or your prisma client import

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taxYearId = searchParams.get('taxYearId');
    
    const items = await prisma.incomingTransaction.findMany({
      where: taxYearId ? { taxYearId } : undefined,
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch incoming transactions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taxYearId, date, source, description, cardAmount, cashAmount, notes, documentUrl } = body;

    const record = await prisma.incomingTransaction.create({
      data: {
        taxYearId,
        date: new Date(date),
        source,
        description,
        cardAmount: parseFloat(cardAmount) || 0,
        cashAmount: parseFloat(cashAmount) || 0,
        notes: notes || null,
        documentUrl: documentUrl || null,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Failed to create incoming transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

