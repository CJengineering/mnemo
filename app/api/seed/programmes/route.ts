import { NextResponse } from "next/server";
import { db, programme } from "@/lib/db";
import { eq } from "drizzle-orm";

// 👇️ Use camelCase keys to match your schema
const programmes = [
  { title: "Abdul Latif Jameel Poverty Action Lab", shortTitle: "J-PAL" },
  { title: "MIT Abdul Latif Jameel Water and Food Systems Lab", shortTitle: "MIT J-WAFS" },
  { title: "MIT Jameel World Education Lab", shortTitle: "J-WEL" },
  { title: "MIT Jameel Clinic", shortTitle: "MIT Jameel Clinic" },
  { title: "Jameel Institute", shortTitle: "Jameel Institute" },
  { title: "Jameel Observatory for Food Security Early Action", shortTitle: "Jameel Observatory" },
  { title: "Jameel Observatory-CREWSnet", shortTitle: "Jameel Observatory-CREWSnet" },
  { title: "Jameel Arts & Health Lab", shortTitle: "Jameel Arts & Health Lab" },
  { title: "CLIMAVORE x Jameel at RCA", shortTitle: "CLIMAVORE x Jameel at RCA" },
  { title: "Andrea Bocelli Foundation-Community Jameel Scholarship", shortTitle: "Bocelli-Jameel Scholarship" },
  { title: "Jameel House of Traditional Arts in Cairo", shortTitle: "Jameel House in Cairo" },
  { title: "Jameel C40 Urban Planning Climate Labs", shortTitle: "Jameel C40 Urban Planning Climate Labs" },
  { title: "J-PAL Air and Water Labs", shortTitle: "J-PAL AWL" },
  { title: "Pratham-Jameel Second Chance", shortTitle: "Pratham-Jameel Second Chance" },
  { title: "AUC Jameel Centre", shortTitle: "Jameel Centre" },
  { title: "Jameel House of World Traditional Arts in Scotland", shortTitle: "Jameel House in Scotland" },
  { title: "Ankur", shortTitle: "Ankur" },
  { title: "BRUVS Monaco", shortTitle: "BRUVS Monaco" },
  { title: "J-PAL Evidence to Policy", shortTitle: "J-PAL Evidence to Policy" },
  { title: "Jameel Institute-Kenneth C. Griffin Initiative for Economics of Pandemic Preparedness", shortTitle: "Kenneth Griffin Initiative" },
  { title: "GCC Health and Liveability", shortTitle: "GCC Health and Liveability" },
  { title: "Jameel Index for Food Trade and Vulnerability", shortTitle: "Jameel Index" },
  { title: "J-PAL MENA", shortTitle: "J-PAL MENA" },
  { title: "Egypt Impact Lab", shortTitle: "Egypt Impact Lab" },
  { title: "COVID-19 Excellence Fund", shortTitle: "Excellence Fund" },
  { title: "Jameel Hardship Fund", shortTitle: "Jameel Hardship Fund" },
  { title: "MIT Jameel-Toyota Scholarship", shortTitle: "MIT Jameel-Toyota Scholarship" },
  { title: "Ejada", shortTitle: "Ejada" },
  { title: "Iraq Cultural Health Fund", shortTitle: "Iraq Cultural Health Fund" },
  { title: "Jameel Fund", shortTitle: "Jameel Fund" }
];

export async function GET() {
  try {
    console.log("🌱 Seeding programme data...");

    for (const { title, shortTitle } of programmes) {
      const existing = await db
        .select({ id: programme.id })
        .from(programme)
        .where(eq(programme.title, title))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(programme).values({
          title,
          shortTitle,
          data: {},
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log(`✅ Inserted: ${title}`);
      } else {
        console.log(`⚠️ Skipped (already exists): ${title}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Programme seeding completed!"
    });
  } catch (error) {
    console.error("❌ Error seeding programme data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed programme data" },
      { status: 500 }
    );
  }
}
