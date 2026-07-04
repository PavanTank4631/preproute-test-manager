export interface User {
  id: string;
  userId: string;
  name: string;
  role: string;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Topic {
  id: string;
  name: string;
  subject_id: string;
}

export interface SubTopic {
  id: string;
  name: string;
  topic_id: string;
}

export type TestStatus = 'draft' | 'live' | 'unpublished' | 'scheduled' | 'expired';
export type TestType = 'chapterwise' | 'full_length' | 'topicwise';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Test {
  id: string;
  name: string;
  type: TestType;
  subject: string;
  topics: string[];
  sub_topics: string[];
  questions: string[] | null;
  correct_marks: number;
  wrong_marks: number;
  unattempt_marks: number;
  difficulty: Difficulty;
  total_marks: number;
  total_time: number;
  total_questions: number;
  status: TestStatus;
  created_at: string;
  updated_at?: string | null;
}

export interface Question {
  id?: string;
  type: 'mcq';
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: 'option1' | 'option2' | 'option3' | 'option4';
  explanation?: string;
  difficulty?: Difficulty;
  media_url?: string;
  test_id?: string;
  subject?: string;
  topic?: string;
  sub_topic?: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateTestPayload {
  name: string;
  type: TestType;
  subject: string;
  topics: string[];
  sub_topics: string[];
  correct_marks: number;
  wrong_marks: number;
  unattempt_marks: number;
  difficulty: Difficulty;
  total_time: number;
  total_marks: number;
  total_questions: number;
  status: TestStatus;
}
