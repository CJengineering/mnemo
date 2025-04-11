import { NextResponse } from "next/server";
import { dataChunks, db } from "@/lib/db";
import { mapData } from "validators/text-validator/text-data-validator";


export async function POST(req: Request) {
  try {
    const { name, type, programmeId, data, metaData } = await req.json();

    console.log("Received content:", { name, type, programmeId, data, metaData });

    // ✅ Ensure `type` is valid
    const validTypes = ["text", "rich_text", "image", "video", "link"];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid type: '${type}'. Allowed types: ${validTypes.join(", ")}`);
    }

    // ✅ Ensure `programmeId` exists
    if (!programmeId) {
      throw new Error("Programme ID is required.");
    }

    // ✅ Validate & transform data (only for text type)
    let mappedData: { data?: any; metaData?: any } = {};
    if (type === "text") {
      mappedData = mapData(data, metaData, type);
    } else {
      mappedData = {
        data: data, // Keep the raw data for non-text types
        metaData: metaData || {}, // Default to empty metadata
      };
    }

    // ✅ Store in database
    const [newDataChunk] = await db
      .insert(dataChunks)
      .values({
        name, // Required
        type, // Must be valid
        programmeId, // Must be valid
        data: mappedData.data || {}, // Store actual content (JSONB)
        metaData: mappedData.metaData || {}, // Store metadata
      })
      .returning();

    console.log("Saved to DB:", newDataChunk);

    return NextResponse.json({ success: true, dataChunk: newDataChunk });
  } catch (error) {
    console.error("Error in /api/data-chunk:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create data chunk" },
      { status: 500 }
    );
  }
}
export async function GET() {
  try {
    const chunks = await db.select().from(dataChunks);
    return NextResponse.json({ success: true, dataChunks: chunks });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch data chunks" }, { status: 500 });
  }
}
