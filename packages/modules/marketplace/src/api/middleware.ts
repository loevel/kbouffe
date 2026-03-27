import type { Context } from 'hono';
import { errors, MarketplaceError } from '../lib/errors.js';

export function handleError(err: unknown, c: Context) {
  if (err instanceof MarketplaceError) {
    return c.json(
      { error: err.message, code: err.code },
      err.statusCode as any
    );
  }

  console.error('Unexpected error:', err);
  return c.json({ error: 'Erreur serveur' }, 500);
}

export function requireSupabase(c: Context) {
  const supabase = c.get('supabase');
  if (!supabase) {
    throw errors.serviceUnavailable();
  }
  return supabase;
}

export function requireAuth(c: Context) {
  const supabase = requireSupabase(c);
  const restaurantId = c.get('restaurantId');
  const userId = c.get('userId');

  if (!restaurantId || !userId) {
    throw errors.unauthorized();
  }

  return { supabase, restaurantId, userId };
}

export function requireAdmin(c: Context) {
  const supabase = requireSupabase(c);
  const user = c.get('user');

  if (!user || user.role !== 'admin') {
    throw errors.unauthorized();
  }

  return { supabase, user };
}
