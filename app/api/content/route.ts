import { NextResponse } from "next/server";
import { db, content } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { title, description, programmeId, metaData } = await req.json();

    if (!title || !description || !programmeId || !metaData) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // ✅ Insert content into the database
    const [newContent] = await db.insert(content)
      .values({
        title,
        description,
        programmeId,
        status: "draft",
        data: {}, // Empty by default
        metaData, // Store full metaData object
      })
      .returning();

    return NextResponse.json({ success: true, content: newContent });
  } catch (error) {
    console.error("Content creation error:", error);
    return NextResponse.json({ success: false, error: "Failed to create content" }, { status: 500 });
  }
}
