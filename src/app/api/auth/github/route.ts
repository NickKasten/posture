import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient, encrypt } from '../../../../lib/storage/supabase';
import { authRateLimit } from '@/lib/rate-limit/client';
import { withRateLimit } from '@/lib/rate-limit/middleware';

// GitHub OAuth API route

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  // Apply rate limiting (IP-based to prevent OAuth abuse)
  const rateLimitResult = await withRateLimit(request, authRateLimit);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    // Log successful OAuth callback
    console.log('GitHub OAuth callback received for user authentication');
    
    // Remove userId requirement
    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing code' }), { status: 400 });
    }

    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: new URLSearchParams({
        client_id: GITHUB_CLIENT_ID!,
        client_secret: GITHUB_CLIENT_SECRET!,
        code,
        redirect_uri: process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI!,
      }),
    });
    
    const tokenData = await tokenRes.json() as { access_token?: string; [key: string]: any };
    
    if (!tokenData.access_token) {
      return new Response(JSON.stringify({ 
        error: 'Failed to get access token', 
        details: tokenData,
        debug: {
          status: tokenRes.status,
          clientIdPresent: !!GITHUB_CLIENT_ID,
          clientSecretPresent: !!GITHUB_CLIENT_SECRET,
          redirectUri: process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI
        }
      }), { status: 500 });
    }

    // Fetch the user's GitHub profile to get their unique user ID
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch GitHub user profile' }), { status: 500 });
    }
    const user = await userRes.json();
    const githubUserId = user.id;
    if (!githubUserId) {
      return new Response(JSON.stringify({ error: 'GitHub user ID not found' }), { status: 500 });
    }

    // Store encrypted token in Supabase using GitHub user ID as string
    const { error } = await supabaseClient.from('user_tokens').upsert({
      user_id: githubUserId.toString(), // Convert GitHub user ID to string
      provider: 'github',
      encrypted_token: encrypt(tokenData.access_token),
      github_user_id: githubUserId, // Store GitHub ID separately if needed
    });
    if (error) {
      // If it's a duplicate key error, user is already authenticated
      if (error.message?.includes('duplicate key value')) {
        console.log('User already authenticated, updating token');
        // Token updated successfully, continue to success
      } else {
        console.error('Failed to store GitHub token:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to store token', 
          details: error.message
        }), { status: 500 });
      }
    }

    // Redirect to main app instead of showing JSON response
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('auth', 'success');
    redirectUrl.searchParams.set('user', githubUserId.toString());
    
    return Response.redirect(redirectUrl.toString(), 302);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Internal server error', details: err.message }), { status: 500 });
  }
} 