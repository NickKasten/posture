/**
 * Test utilities for mocking Next.js types
 * @module __test-utils__/next-mocks
 */

import { NextRequest } from 'next/server';

/**
 * Creates a mock NextRequest from a standard Request object
 * This is needed because Next.js route handlers expect NextRequest,
 * but in tests we create standard Request objects.
 *
 * @param url - The URL for the request
 * @param init - Request initialization options
 * @returns A Request object cast to NextRequest for testing
 */
export function createMockNextRequest(
  url: string,
  init?: RequestInit
): NextRequest {
  const request = new Request(url, init);
  // Cast to NextRequest for type compatibility in tests
  // In the actual Next.js runtime, these would have the proper NextRequest properties
  return request as unknown as NextRequest;
}

/**
 * Creates a mock NextRequest with common defaults for API testing
 *
 * @param path - The API path (e.g., '/api/ai')
 * @param options - Additional request options
 * @returns A mock NextRequest
 */
export function createMockAPIRequest(
  path: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const {
    method = 'GET',
    body,
    headers = {},
  } = options;

  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  return createMockNextRequest(`http://localhost${path}`, init);
}
