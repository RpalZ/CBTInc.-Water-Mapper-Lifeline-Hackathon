// src/app/api/routing/solve/route.ts
import { NextRequest, NextResponse } from 'next/server';

// The URL of your Python routing service.
// It's best practice to use an environment variable for this.
const ROUTING_SERVICE_URL = process.env.ROUTING_SERVICE_URL || 'http://localhost:5000/solve-vrp';

/**
 * This route handler acts as a proxy to the Python OR-Tools microservice.
 * The Next.js frontend should call this endpoint, which then securely
 * communicates with the Python backend.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Get the request body from the frontend call
    const requestBody = await req.json();

    // 2. Forward the request to the Python routing service
    const response = await fetch(ROUTING_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // 3. Check if the Python service responded successfully
    if (!response.ok) {
      const errorText = await response.text();
      // Forward the error from the Python service to the client
      return NextResponse.json(
        { error: `Routing service error: ${errorText}` },
        { status: response.status }
      );
    }

    // 4. Parse the JSON response from the Python service
    const data = await response.json();

    // 5. Return the successful response to the Next.js frontend
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in routing proxy:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
