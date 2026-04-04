import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // Use anon-key client to read the user session from cookies
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { token, platform, deviceInfo } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
    }

    // Use service-role client for DB write (bypasses RLS)
    const adminSupabase = await createAdminClient();

    const { error: dbError } = await adminSupabase
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


    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'enregistrement du token' },
      { status: 500 }
    );
  }
}
