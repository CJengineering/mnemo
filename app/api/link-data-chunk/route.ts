import { NextResponse } from "next/server";
import { contentDataChunkRelation, db } from "@/lib/db";


export async function POST(req: Request) {
  try {
    const { contentId, dataChunkId } = await req.json();


    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to link data chunk" }, { status: 500 });
  }
}
