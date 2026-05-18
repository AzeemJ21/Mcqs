import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { parseDocx } from "@/lib/parsers/parseDocx";
import { parsePdf } from "@/lib/parsers/parsePdf";
import { parseTxt } from "@/lib/parsers/parseTxt";
import { parseQuestions } from "@/lib/parsers/parseQuestions";
import { saveQuiz } from "@/lib/quizStorage";
import type { Quiz, UploadResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type Kind = "docx" | "pdf" | "txt" | "doc";

function detectKind(name: string, mime: string): Kind | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".docx") || mime.includes("wordprocessingml")) return "docx";
  if (lower.endsWith(".doc") || mime === "application/msword") return "doc";
  if (lower.endsWith(".pdf") || mime === "application/pdf") return "pdf";
  if (lower.endsWith(".txt") || mime.startsWith("text/")) return "txt";
  return null;
}

function titleFromFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  const cleaned = base.replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return "Untitled Quiz";
  return cleaned
    .split(" ")
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const form = await req.formData().catch(() => null);
    if (!form) {
      return NextResponse.json(
        { error: "Invalid request. Expected multipart/form-data." },
        { status: 400 }
      );
    }

    const fileEntry = form.get("file");
    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        { error: "Missing 'file' field." },
        { status: 400 }
      );
    }

    if (fileEntry.size === 0) {
      return NextResponse.json(
        { error: "Uploaded file is empty." },
        { status: 400 }
      );
    }

    if (fileEntry.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 10MB limit." },
        { status: 413 }
      );
    }

    const kind = detectKind(fileEntry.name, fileEntry.type || "");
    if (!kind) {
      return NextResponse.json(
        { error: "Only .docx, .txt, and .pdf files are supported." },
        { status: 415 }
      );
    }

    const buffer = Buffer.from(await fileEntry.arrayBuffer());

    let rawText = "";
    try {
      if (kind === "docx" || kind === "doc") {
        rawText = await parseDocx(buffer);
      } else if (kind === "pdf") {
        rawText = await parsePdf(buffer);
      } else {
        rawText = await parseTxt(buffer);
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Unknown extraction error.";
      return NextResponse.json(
        {
          error:
            "We couldn't read the contents of your file. It may be corrupted or password-protected.",
          detail,
        },
        { status: 422 }
      );
    }

    let questions;
    try {
      questions = parseQuestions(rawText);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not detect any questions. Please check your file format and refer to the sample format below.";
      return NextResponse.json({ error: message }, { status: 422 });
    }

    const quiz: Quiz = {
      id: nanoid(10),
      title: titleFromFilename(fileEntry.name),
      questions,
      createdAt: new Date().toISOString(),
    };

    saveQuiz(quiz);

    const response: UploadResponse = {
      quizId: quiz.id,
      questionCount: quiz.questions.length,
      title: quiz.title,
    };
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown server error.";
    return NextResponse.json(
      { error: "Unexpected server error.", detail },
      { status: 500 }
    );
  }
}
