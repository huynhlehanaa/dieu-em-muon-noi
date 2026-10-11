import { NextResponse } from "next/server";
import { initDB } from "@/lib/db";
import { connection } from "next/server";

export async function GET() {
  // Ensure this runs at request time, not build time
  await connection();
  try {
    await initDB();
    return NextResponse.json({
      message: "Database initialized successfully",
    });
  } catch (error) {
    console.error("DB init error:", error);
    return NextResponse.json(
      { error: "Failed to initialize database" },
      { status: 500 }
    );
  }
}
