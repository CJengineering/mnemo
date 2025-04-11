import { NextResponse } from "next/server";
import { content, db } from "@/lib/db";


export async function GET() {
  try {
    const contents = await db.select().from(content);
    return NextResponse.json({ success: true, contents });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch content" }, { status: 500 });
  }
}