import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { questionsApi, subjectsApi, testsApi } from '../api';
import type { Question, Subject, SubTopic, Test, Topic } from '../types';

const questionSchema = z.object({
  question: z.string().min(1, 'Question text is required'),
  option1: z.string().min(1, 'Required'),
  option2: z.string().min(1, 'Required'),
  option3: z.string().min(1, 'Required'),
  option4: z.string().min(1, 'Required'),
  correct_option: z.enum(['option1', 'option2', 'option3', 'option4']),
  explanation: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  topic: z.string().optional(),
  sub_topic: z.string().optional(),
  media_url: z.string().optional(),
});

type QForm = z.infer<typeof questionSchema>;

export default function QuestionsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<QForm>({
    resolver: zodResolver(questionSchema),
    defaultValues: { correct_option: 'option1', difficulty: 'medium' },
  });

  useEffect(() => {
    if (!id) return;
    const init = async () => {
      try {
        const testRes = await testsApi.getById(id);
        const t = testRes.data.data;
        setTest(t);

        const subRes = await subjectsApi.getAll();
        const subjects: Subject[] = subRes.data.data;
        const sub = subjects.find((s) => s.name === t.subject || s.id === t.subject);
        if (sub) {
          setSubjectId(sub.id);
          const topicRes = await subjectsApi.getTopics(sub.id);
          setTopics(topicRes.data.data);

          const topicIds = t.topics
            .map((tn) => topicRes.data.data.find((tp) => tp.name === tn || tp.id === tn)?.id)
            .filter(Boolean) as string[];

          if (topicIds.length) {
            const stRes = await subjectsApi.getSubTopicsForTopics(topicIds);
            setSubTopics(stRes.data.data);
          }
        }

        if (t.questions && t.questions.length > 0) {
          const qRes = await questionsApi.fetchBulk(t.questions);
          setQuestions(qRes.data.data);
        }
      } catch {
        setApiError('Failed to load test');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const onAddQuestion = (data: QForm) => {
    const q: Question = {
      type: 'mcq',
      ...data,
      test_id: id,
      subject: subjectId,
    };

    if (editIdx !== null) {
      const updated = [...questions];
      updated[editIdx] = { ...updated[editIdx], ...q };
      setQuestions(updated);
      setEditIdx(null);
    } else {
      setQuestions((prev) => [...prev, q]);
    }
    reset({ correct_option: 'option1', difficulty: 'medium' });
  };

  const startEdit = (idx: number) => {
    const q = questions[idx];
    setEditIdx(idx);
    setValue('question', q.question);
    setValue('option1', q.option1);
    setValue('option2', q.option2);
    setValue('option3', q.option3);
    setValue('option4', q.option4);
    setValue('correct_option', q.correct_option);
    setValue('explanation', q.explanation || '');
    setValue('difficulty', q.difficulty || 'medium');
    setValue('topic', q.topic || '');
    setValue('sub_topic', q.sub_topic || '');
    setValue('media_url', q.media_url || '');
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    if (editIdx === idx) {
      setEditIdx(null);
      reset({ correct_option: 'option1', difficulty: 'medium' });
    }
  };

  const handleSaveContinue = async () => {
    if (questions.length === 0) {
      setApiError('Add at least one question before continuing');
      return;
    }
    setSaving(true);
    setApiError('');
    try {
      const res = await questionsApi.bulkCreate(questions);
      const createdIds = res.data.data.map((q) => q.id!).filter(Boolean);
      await testsApi.update(id!, {
        questions: createdIds,
        total_questions: questions.length,
        total_marks: questions.length * (test?.correct_marks || 4),
      });
      navigate(`/tests/${id}/preview`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save questions';
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Questions</h1>
          <p className="page-subtitle">
            {test?.name} · {test?.subject} · {questions.length} question(s) added
          </p>
        </div>
      </div>

      {apiError && <div className="alert alert-error">{apiError}</div>}

      <div className="questions-layout">
        <div className="form-card">
          <h2 className="section-title">{editIdx !== null ? 'Edit Question' : 'New Question'}</h2>

          <form onSubmit={handleSubmit(onAddQuestion)}>
            <div className="form-group">
              <label className="form-label">Question *</label>
              <textarea
                className={`form-input ${errors.question ? 'input-error' : ''}`}
                rows={3}
                placeholder="Enter question text"
                {...register('question')}
              />
              {errors.question && <span className="field-error">{errors.question.message}</span>}
            </div>

            <div className="options-grid">
              {(['option1', 'option2', 'option3', 'option4'] as const).map((opt, i) => (
                <div className="form-group" key={opt}>
                  <label className="form-label">Option {i + 1} *</label>
                  <input
                    className={`form-input ${errors[opt] ? 'input-error' : ''}`}
                    placeholder={`Option ${i + 1}`}
                    {...register(opt)}
                  />
                  {errors[opt] && <span className="field-error">{errors[opt]?.message}</span>}
                </div>
              ))}
            </div>

            <div className="form-grid cols-3">
              <div className="form-group">
                <label className="form-label">Correct Answer *</label>
                <select className="form-input" {...register('correct_option')}>
                  <option value="option1">Option 1</option>
                  <option value="option2">Option 2</option>
                  <option value="option3">Option 3</option>
                  <option value="option4">Option 4</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select className="form-input" {...register('difficulty')}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Topic</label>
                <select className="form-input" {...register('topic')}>
                  <option value="">None</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sub-topic</label>
                <select className="form-input" {...register('sub_topic')}>
                  <option value="">None</option>
                  {subTopics.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group span-2">
                <label className="form-label">Explanation (optional)</label>
                <input className="form-input" placeholder="Explain the answer" {...register('explanation')} />
              </div>
              <div className="form-group span-2">
                <label className="form-label">Media URL (optional)</label>
                <input className="form-input" placeholder="https://..." {...register('media_url')} />
              </div>
            </div>

            <div className="form-actions">
              {editIdx !== null && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setEditIdx(null);
                    reset({ correct_option: 'option1', difficulty: 'medium' });
                  }}
                >
                  Cancel Edit
                </button>
              )}
              <button type="submit" className="btn btn-secondary">
                {editIdx !== null ? 'Update Question' : '+ Add Question'}
              </button>
            </div>
          </form>
        </div>

        <div className="questions-list-panel">
          <h2 className="section-title">Added Questions ({questions.length})</h2>
          {questions.length === 0 ? (
            <p className="empty-hint">No questions yet. Add your first one on the left.</p>
          ) : (
            <ul className="questions-list">
              {questions.map((q, idx) => (
                <li key={idx} className="question-item">
                  <div className="q-number">Q{idx + 1}</div>
                  <div className="q-body">
                    <p className="q-text">{q.question}</p>
                    <p className="q-meta">
                      Answer: {q[q.correct_option]} · {q.difficulty || 'medium'}
                    </p>
                  </div>
                  <div className="q-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(idx)}>Edit</button>
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => removeQuestion(idx)}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={() => navigate(`/tests/${id}/edit`)}>
              ← Back to Test Details
            </button>
            <button
              className="btn btn-primary"
              disabled={saving || questions.length === 0}
              onClick={handleSaveContinue}
            >
              {saving ? 'Saving...' : 'Save & Continue →'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
