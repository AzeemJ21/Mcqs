export interface Option {
  id: string; // 'A' | 'B' | 'C' | 'D' (or further letters if needed)
  text: string;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  correctOptionId: string;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  createdAt: string;
}

export interface QuizAttempt {
  quizId: string;
  answers: Record<string, string>; // questionId → chosen optionId
  startedAt: string;
  completedAt?: string;
}

export interface UploadResponse {
  quizId: string;
  questionCount: number;
  title: string;
}

export interface ApiError {
  error: string;
  detail?: string;
}
