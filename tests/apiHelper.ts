import { request, APIRequestContext, expect } from '@playwright/test';

// Base URL for API
const BASE_URL = process.env.BASE_URL || 'https://mptestapi.missionpeak.us';

// Example static token (replace with dynamic function if needed)
const AUTH_TOKEN = process.env.AUTH_TOKEN || "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Imw1QWJJaTlpQmVFVFBkUnhFU1dYayJ9.eyJpc3MiOiJodHRwczovL21wdGVzdGF1dGgubWlzc2lvbnBlYWsudXMvIiwic3ViIjoiYXV0aDB8NjZlYTA4M2E2ZjRhZWYyNDU1ZDM1NzdiIiwiYXVkIjpbImh0dHBzOi8vbXB0ZXN0dWkubWlzc2lvbnBlYWsuYXBwIiwiaHR0cHM6Ly9tcHRlc3RhdXRoLnVzLmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE3NTg5MTMxMzUsImV4cCI6MTc1ODk5OTUzNSwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCIsImF6cCI6InNhT24yZ1NZTXNFQXIwQ1lwVFl6TnROeUpWQ3d6UThMIn0.xJxlNw4RaDZU49OBMb5BudjPN6LWag11NuB1N64rwaTYjP1KcrzhM6LoDTUQoO9LqaUu9i9VrXKeWl3r4Ubw2Cb5fT0dnY8EVhfiYCk6vUe3MrBeRB3l1Ji_hXak-EJQ40AJ7N7h4xP9AebhkRAl--8Sngu80cyXzGkokzsAwRgdRRy31DxBM3mjJq1G_UQqDuaJ3O0jXNt2yA75LuCt1SEyTC1UU-6mwi8Ph0AnfL-ZK5ntvSLEQGGryveVxZ9tt_ON0kjTKrJSn9R5ZVdFdDoBva7GxSlvLFEbpD1-nuAejuKXftyO7w_q0hsVgzb0SlCub1xnhT0JNHTDwhCvZw";

// Default headers
const HEADERS = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

// Helper to create a request context
export async function createRequestContext(): Promise<APIRequestContext> {
  return await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: HEADERS,
  });
}

/**
 * Generic GET request helper
 */
export async function getRequest(endpoint: string, queryParams?: Record<string, any>, payload?: any) {
  const context = await createRequestContext();

  // Construct query string
  const url = new URL(endpoint, BASE_URL);
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => url.searchParams.append(key, value.toString()));
  }

  // Make GET request
  const response = await context.get(url.toString(), {
  });

  // Check for 200 OK
  expect(response.status()).toBe(200);

  return response.json();
}


