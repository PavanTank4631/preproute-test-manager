import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Layout from '../components/Layout';
import MultiSelect from '../components/MultiSelect';
import LoadingSpinner from '../components/LoadingSpinner';
import { subjectsApi, testsApi } from '../api';
import type { Subject, SubTopic, TestType, Topic } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Test name is required'),
  type: z.enum(['chapterwise', 'full_length', 'topicwise']),
  subject: z.string().min(1, 'Subject is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  correct_marks: z.number().min(0),
  wrong_marks: z.number(),
  unattempt_marks: z.number(),
  total_time: z.number().min(1, 'Time must be at least 1 min'),
  total_marks: z.number().min(1),
  total_questions: z.number().min(1),
});

type FormData = z.infer<typeof schema>;

export default function TestFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSubTopics, setSelectedSubTopics] = useState<string[]>([]);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'chapterwise',
      difficulty: 'medium',
      correct_marks: 4,
      wrong_marks: -1,
      unattempt_marks: 0,
      total_time: 60,
      total_marks: 100,
      total_questions: 25,
    },
  });

  const selectedSubject = watch('subject');

  useEffect(() => {
    subjectsApi.getAll().then((res) => setSubjects(res.data.data));
  }, []);

  useEffect(() => {
    if (!selectedSubject) {
      setTopics([]);
      setSubTopics([]);
      setSelectedTopics([]);
      setSelectedSubTopics([]);
      return;
    }
    subjectsApi.getTopics(selectedSubject).then((res) => {
      setTopics(res.data.data);
    });
    if (!isEdit) {
      setSelectedTopics([]);
      setSelectedSubTopics([]);
    }
  }, [selectedSubject, isEdit]);

  useEffect(() => {
    if (selectedTopics.length === 0) {
      setSubTopics([]);
      setSelectedSubTopics([]);
      return;
    }
    subjectsApi.getSubTopicsForTopics(selectedTopics).then((res) => {
      setSubTopics(res.data.data);
    });
  }, [selectedTopics]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await testsApi.getById(id);
        const test = res.data.data;

        const subRes = await subjectsApi.getAll();
        const allSubjects = subRes.data.data;
        setSubjects(allSubjects);

        const subjectObj = allSubjects.find((s) => s.name === test.subject || s.id === test.subject);
        const subjectId = subjectObj?.id || '';

        reset({
          name: test.name,
          type: test.type as TestType,
          subject: subjectId,
          difficulty: test.difficulty,
          correct_marks: test.correct_marks,
          wrong_marks: test.wrong_marks,
          unattempt_marks: test.unattempt_marks,
          total_time: test.total_time,
          total_marks: test.total_marks,
          total_questions: test.total_questions,
        });

        if (subjectId) {
          const topicRes = await subjectsApi.getTopics(subjectId);
          const allTopics = topicRes.data.data;
          setTopics(allTopics);

          const topicIds = test.topics
            .map((t) => allTopics.find((at) => at.name === t || at.id === t)?.id)
            .filter(Boolean) as string[];
          setSelectedTopics(topicIds);

          if (topicIds.length) {
            const stRes = await subjectsApi.getSubTopicsForTopics(topicIds);
            const allST = stRes.data.data;
            setSubTopics(allST);
            const stIds = test.sub_topics
              .map((st) => allST.find((a) => a.name === st || a.id === st)?.id)
              .filter(Boolean) as string[];
            setSelectedSubTopics(stIds);
          }
        }
      } catch {
        setApiError('Failed to load test details');
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id, reset]);

  const saveTest = async (data: FormData, goToQuestions: boolean) => {
    setApiError('');
    if (selectedTopics.length === 0) {
      setApiError('Please select at least one topic');
      return;
    }

    setSaving(true);
    const payload = {
      ...data,
      topics: selectedTopics,
      sub_topics: selectedSubTopics,
      status: 'draft' as const,
    };

    try {
      let testId = id;
      if (isEdit && id) {
        await testsApi.update(id, payload);
      } else {
        const res = await testsApi.create(payload);
        testId = res.data.data.id;
      }
      if (goToQuestions && testId) {
        navigate(`/tests/${testId}/questions`);
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Something went wrong while saving';
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Test' : 'Create New Test'}</h1>
          <p className="page-subtitle">Fill in the test details below</p>
        </div>
      </div>

      {apiError && <div className="alert alert-error">{apiError}</div>}

      <form className="form-card">
        <div className="form-section">
          <h2 className="section-title">Basic Info</h2>
          <div className="form-grid">
            <div className="form-group span-2">
              <label className="form-label">Test Name *</label>
              <input
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                placeholder="e.g. Algebra Chapter Test"
                {...register('name')}
              />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Subject *</label>
              <select className="form-input" {...register('subject')}>
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.subject && <span className="field-error">{errors.subject.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Test Type</label>
              <select className="form-input" {...register('type')}>
                <option value="chapterwise">Chapterwise</option>
                <option value="full_length">Full Length</option>
                <option value="topicwise">Topicwise</option>
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
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Topics</h2>
          <div className="form-grid">
            <MultiSelect
              label="Topics *"
              options={topics}
              selected={selectedTopics}
              onChange={setSelectedTopics}
              disabled={!selectedSubject}
              placeholder={selectedSubject ? 'No topics available' : 'Select a subject first'}
            />
            <MultiSelect
              label="Sub-topics"
              options={subTopics}
              selected={selectedSubTopics}
              onChange={setSelectedSubTopics}
              disabled={selectedTopics.length === 0}
              placeholder="Select topics first"
            />
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Marking Scheme & Duration</h2>
          <div className="form-grid cols-3">
            <div className="form-group">
              <label className="form-label">Correct Marks</label>
              <input type="number" className="form-input" {...register('correct_marks', { valueAsNumber: true })} />
            </div>
            <div className="form-group">
              <label className="form-label">Wrong Marks</label>
              <input type="number" className="form-input" {...register('wrong_marks', { valueAsNumber: true })} />
            </div>
            <div className="form-group">
              <label className="form-label">Unattempted Marks</label>
              <input type="number" className="form-input" {...register('unattempt_marks', { valueAsNumber: true })} />
            </div>
            <div className="form-group">
              <label className="form-label">Total Time (mins)</label>
              <input type="number" className="form-input" {...register('total_time', { valueAsNumber: true })} />
              {errors.total_time && <span className="field-error">{errors.total_time.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Total Marks</label>
              <input type="number" className="form-input" {...register('total_marks', { valueAsNumber: true })} />
            </div>
            <div className="form-group">
              <label className="form-label">Total Questions</label>
              <input type="number" className="form-input" {...register('total_questions', { valueAsNumber: true })} />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={saving}
            onClick={handleSubmit((d) => saveTest(d, false))}
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving}
            onClick={handleSubmit((d) => saveTest(d, true))}
          >
            Next: Add Questions →
          </button>
        </div>
      </form>
    </Layout>
  );
}
