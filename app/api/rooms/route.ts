import { NextResponse } from 'next/server';
import { getServerRooms } from '@/lib/utils';

export async function GET() {
  try {
    const rooms = getServerRooms();
    return NextResponse.json({ rooms });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}
