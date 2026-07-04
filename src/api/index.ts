import client from './client';
import type {
  ApiResponse,
  CreateTestPayload,
  LoginResponse,
  Question,
  Subject,
  SubTopic,
  Test,
  Topic,
} from '../types';

export const authApi = {
  login: (userId: string, password: string) =>
    client.post<ApiResponse<LoginResponse>>('/auth/login', { userId, password }),
};

export const subjectsApi = {
  getAll: () => client.get<ApiResponse<Subject[]>>('/subjects'),
  getTopics: (subjectId: string) =>
    client.get<ApiResponse<Topic[]>>(`/topics/subject/${subjectId}`),
  getSubTopics: (topicId: string) =>
    client.get<ApiResponse<SubTopic[]>>(`/sub-topics/topic/${topicId}`),
  getSubTopicsForTopics: (topicIds: string[]) =>
    client.post<ApiResponse<SubTopic[]>>('/sub-topics/multi-topics', { topicIds }),
};

export const testsApi = {
  getAll: () => client.get<ApiResponse<Test[]>>('/tests'),
  getById: (id: string) => client.get<ApiResponse<Test>>(`/tests/${id}`),
  create: (payload: CreateTestPayload) =>
    client.post<ApiResponse<Test>>('/tests', payload),
  update: (id: string, payload: Partial<CreateTestPayload> & { status?: string; questions?: string[] }) =>
    client.put<ApiResponse<Test>>(`/tests/${id}`, payload),
  delete: (id: string) => client.delete<ApiResponse<null>>(`/tests/${id}`),
  publish: (id: string) =>
    client.put<ApiResponse<Test>>(`/tests/${id}`, { status: 'live' }),
};

export const questionsApi = {
  bulkCreate: (questions: Question[]) =>
    client.post<ApiResponse<Question[]>>('/questions/bulk', { questions }),
  fetchBulk: (questionIds: string[]) =>
    client.post<ApiResponse<Question[]>>('/questions/fetchBulk', { question_ids: questionIds }),
};
