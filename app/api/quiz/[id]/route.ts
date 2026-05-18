import { NextRequest, NextResponse } from "next/server";
import { getBundledQuiz } from "@/lib/bundledQuizzes";
import { getQuiz, saveQuiz } from "@/lib/quizStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  let quiz = getQuiz(params.id);

  if (!quiz) {
    const bundled = await getBundledQuiz(params.id);
    if (bundled) {
      saveQuiz(bundled);
      quiz = bundled;
    }
  }

  if (!quiz) {
    return NextResponse.json(
      {
        error:
          "Quiz not found. Choose a quiz from the home page or upload your file again.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json(quiz);
}
