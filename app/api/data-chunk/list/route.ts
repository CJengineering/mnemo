import { NextResponse } from "next/server";
import { dataChunks, db } from "@/lib/db";


export async function GET() {
  try {
    const chunks = await db.select().from(dataChunks);
    return NextResponse.json({ success: true, dataChunks: chunks });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch data chunks" }, { status: 500 });
  }
}
