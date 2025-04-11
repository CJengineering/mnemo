import { NextRequest, NextResponse } from "next/server";
import { db, content, dataChunks, contentDataChunkRelation, programme } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    const contentId = parseInt(id ?? "", 10);

    // ✅ Validate ID
    if (isNaN(contentId)) {
      return NextResponse.json({ success: false, error: "Invalid Content ID" }, { status: 400 });
    }

    // ✅ Fetch the content entry
    const contentEntry = await db
      .select()
      .from(content)
      .where(eq(content.id, contentId))
      .limit(1);

    if (!contentEntry.length) {
      return NextResponse.json({ success: false, error: "Content not found" }, { status: 404 });
    }

    // ✅ Fetch linked data chunks
    const linkedChunks = await db
      .select({
        id: dataChunks.id,
        name: dataChunks.name,
        type: dataChunks.type,
        data: dataChunks.data,
        metaData: dataChunks.metaData,
        programmeId: dataChunks.programmeId,
        programmeName: programme.title,
      })
      .from(contentDataChunkRelation)
      .innerJoin(dataChunks, eq(contentDataChunkRelation.dataChunkId, dataChunks.id))
      .leftJoin(programme, eq(dataChunks.programmeId, programme.id))
      .where(eq(contentDataChunkRelation.contentId, contentId));

    return NextResponse.json({
      success: true,
      content: contentEntry[0],
      dataChunks: linkedChunks,
    });
  } catch (error) {
    console.error("Fetch Content Error:", error);
    return NextResponse.json({ success: false, error: "Failed to retrieve content" }, { status: 500 });
  }
}
