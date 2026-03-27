import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { token, platform, deviceInfo } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token missing' }, { status: 400 });
    }

    // Upsert into push_tokens table (multi-device support)
    const { error: dbError } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: user.id,
          token,
          platform: platform || 'web',
          device_info: deviceInfo || null,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'token' }
      );

    if (dbError) {
      // Fallback: try legacy users.fcm_token column
      await supabase
        .from('users')
        .update({ fcm_token: token })
        .eq('id', user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error updating FCM token' },
      { status: 500 }
    );
  }
}
