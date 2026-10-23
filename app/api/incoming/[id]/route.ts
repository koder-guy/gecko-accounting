import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { taxYearId, date, source, description, cardAmount, cashAmount, notes, documentUrl } = body;

    const updated = await prisma.incomingTransaction.update({
      where: { id },
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update incoming transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.incomingTransaction.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete incoming transaction' }, { status: 500 });
  }
}
