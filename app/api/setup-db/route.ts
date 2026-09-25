import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function GET() {
  try {
    const pushOutput = execSync("npx prisma db push --accept-data-loss", {
      encoding: "utf-8",
      cwd: process.cwd(),
    });

    return NextResponse.json({
      success: true,
      message: "Database tables created successfully!",
      output: pushOutput,
    });
  } catch (error: any) {
    console.error("Setup DB error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to push database schema",
        stderr: error?.stderr?.toString() || null,
      },
      { status: 500 }
    );
  }
}
