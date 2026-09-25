import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const ballEndpointUrl = new URL(`/api/matches/${id}/ball`, req.url);

    const ballPayload = {
      ...body,
      isWicket: true,
    };

    const response = await fetch(ballEndpointUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify(ballPayload),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Wicket API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to record wicket" },
      { status: 500 }
    );
  }
}
