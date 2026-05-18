import { NextRequest, NextResponse } from "next/server";
import { getQuiz } from "@/lib/quizStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const quiz = getQuiz(params.id);
  if (!quiz) {
    return NextResponse.json(
      { error: "Quiz not found. It may have expired — please re-upload your file." },
      { status: 404 }
    );
  }
  return NextResponse.json(quiz);
}
