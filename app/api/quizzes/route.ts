import { NextResponse } from "next/server";
import { getBundledCatalog } from "@/lib/bundledQuizzes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const catalog = await getBundledCatalog();
  if (!catalog) {
    return NextResponse.json({ quizzes: [], totalQuestions: 0 });
  }
  return NextResponse.json(catalog);
}
