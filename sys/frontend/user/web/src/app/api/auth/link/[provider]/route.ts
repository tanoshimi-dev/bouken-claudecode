import { type NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  const res = await fetch(`${API_URL}/api/auth/link/${provider}`, {
    method: 'DELETE',
    headers: {
      Cookie: req.headers.get('cookie') || '',
    },
  });

  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}
