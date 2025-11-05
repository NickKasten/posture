require('@testing-library/jest-dom');
require('whatwg-fetch');

// Only add polyfills if they don't exist (for jsdom environment)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill Headers if not available
if (typeof global.Headers === 'undefined') {
  global.Headers = class MockHeaders {
    constructor(init = {}) {
      this._headers = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), String(value));
        });
      }
    }

    get(name) {
      return this._headers.get(name.toLowerCase()) || null;
    }

    set(name, value) {
      this._headers.set(name.toLowerCase(), String(value));
    }

    has(name) {
      return this._headers.has(name.toLowerCase());
    }

    delete(name) {
      this._headers.delete(name.toLowerCase());
    }

    forEach(callback) {
      this._headers.forEach((value, key) => callback(value, key, this));
    }

    entries() {
      return this._headers.entries();
    }

    keys() {
      return this._headers.keys();
    }

    values() {
      return this._headers.values();
    }
  };
}

// Add Request and Response for API tests in Node environment
if (typeof global.Request === 'undefined') {
  // Simple Request/Response polyfill for tests
  global.Request = class MockRequest {
    constructor(url, options = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this.headers = new global.Headers(options.headers || {});
      this._body = options.body;
    }

    async json() {
      if (this._body) {
        return JSON.parse(this._body);
      }
      throw new Error('Invalid JSON');
    }
  };

  global.Response = class MockResponse {
    constructor(body, options = {}) {
      this._body = body;
      this.status = options.status || 200;
      this.statusText = options.statusText || '';
      this.headers = new global.Headers(options.headers || {});
      this.ok = this.status >= 200 && this.status < 300;
    }

    async json() {
      return JSON.parse(this._body);
    }

    async text() {
      return this._body;
    }

    // Add static json method for Response.json()
    static json(data, init = {}) {
      return new MockResponse(JSON.stringify(data), {
        ...init,
        status: init.status || 200,
        headers: {
          ...init.headers,
          'content-type': 'application/json',
        },
      });
    }
  };
} 