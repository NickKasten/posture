import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient, decrypt } from '../../../../lib/storage/supabase';
import { githubRateLimit } from '@/lib/rate-limit/client';
import { withRateLimit, addRateLimitHeaders } from '@/lib/rate-limit/middleware';

// GitHub activity fetch API route

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400 });
    }

    // Apply rate limiting (user-based to prevent excessive GitHub API calls)
    const rateLimitResult = await withRateLimit(request, githubRateLimit, userId);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Retrieve encrypted token from Supabase
    const { data, error } = await supabaseClient
      .from('user_tokens')
      .select('encrypted_token')
      .eq('user_id', userId)
      .eq('provider', 'github')
      .single();
    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Token not found', details: error?.message }), { status: 404 });
    }

    const accessToken = decrypt(data.encrypted_token);

    // Fetch user activity from GitHub
    const ghRes = await fetch('https://api.github.com/user/events', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!ghRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch GitHub activity', status: ghRes.status }), { status: 502 });
    }
    const activity = await ghRes.json();

    const response = NextResponse.json({ activity }, { status: 200 });

    // Add rate limit headers to response
    if (rateLimitResult.metadata) {
      return addRateLimitHeaders(response, rateLimitResult.metadata);
    }

    return response;
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Internal server error', details: err.message }), { status: 500 });
  }
} 