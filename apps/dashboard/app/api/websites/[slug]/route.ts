import { NextRequest, NextResponse } from "next/server";
import { auth } from "@databuddy/auth";
import { db } from "@databuddy/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name } = params;

    const website = await db.website.findFirst({
      where: {
        name: name,
        userId: session.user.id
      }
    });

    if (!website) {
      return NextResponse.json(
        { error: "Website not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(website);
  } catch (error) {
    console.error("Error fetching website:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 