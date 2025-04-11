import { NextRequest, NextResponse } from "next/server";
import { contentDataChunkRelation, db } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop(); // Extract content ID from the URL
    const contentId = parseInt(id ?? "", 10);

    const { chunkId } = await req.json();

    if (isNaN(contentId) || !chunkId) {
      return NextResponse.json({ success: false, error: "Invalid content ID or missing chunkId" }, { status: 400 });
    }

    await db.delete(contentDataChunkRelation).where(
      and(
        eq(contentDataChunkRelation.contentId, contentId),
        eq(contentDataChunkRelation.dataChunkId, chunkId)
      )
    );

    return NextResponse.json({ success: true, message: "Data chunk unlinked successfully" });
  } catch (error) {
    console.error("Unlink Data Chunk Error:", error);
    return NextResponse.json({ success: false, error: "Failed to unlink data chunk" }, { status: 500 });
  }
}
