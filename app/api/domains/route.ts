import { NextResponse } from "next/server"

// This is a mock API route that proxies requests to the external API
export async function GET() {
  try {
    const response = await fetch("http://localhost:5000/api/domains")

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch domains: ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching domains:", error)
    return NextResponse.json({ error: "Failed to fetch domains" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await fetch("http://localhost:5000/api/domains", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to create domain: ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating domain:", error)
    return NextResponse.json({ error: "Failed to create domain" }, { status: 500 })
  }
}

