import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const filePathParam = url.searchParams.get('file'); // e.g. /uploads/1792787442284_invoice.pdf

  if (!filePathParam) {
    return new NextResponse('File not specified', { status: 400 });
  }

  // Prevent directory traversal attacks
  const safePath = path.normalize(filePathParam).replace(/^(\.\.[\/\\])+/, '');
  const absolutePath = path.join(process.cwd(), 'public', safePath);

  if (!fs.existsSync(absolutePath)) {
    return new NextResponse('File not found on server', { status: 404 });
  }

  try {
    const fileBuffer = await readFile(absolutePath);
    const filename = path.basename(absolutePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return new NextResponse('Error reading file', { status: 500 });
  }
}

