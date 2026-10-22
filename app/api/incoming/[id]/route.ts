import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const item = await prisma.incomingTransaction.update({
      where: { id: params.id },
      data: {
        date: new Date(body.date),
        source: body.source,
        description: body.description,
        cardAmount: parseFloat(body.cardAmount) || 0,
        cashAmount: parseFloat(body.cashAmount) || 0,
        notes: body.notes || '',
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update incoming transaction' }, { status: 500 });
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
