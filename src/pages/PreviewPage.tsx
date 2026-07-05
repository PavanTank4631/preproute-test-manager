import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { questionsApi, testsApi } from '../api';
import type { Question, Test } from '../types';

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const testRes = await testsApi.getById(id);
        const t = testRes.data.data;
        setTest(t);

        if (t.questions && t.questions.length > 0) {
          const qRes = await questionsApi.fetchBulk(t.questions);
          setQuestions(qRes.data.data);
        }
      } catch {
        setError('Could not load test preview');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePublish = async () => {
    if (!id) return;
    setPublishing(true);
    setError('');
    try {
      await testsApi.publish(id);
      setPublished(true);
      setTest((prev) => (prev ? { ...prev, status: 'live' } : prev));
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch {
      setError('Publish failed. Make sure the test has questions.');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (!test) return <Layout><div className="alert alert-error">Test not found</div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Preview & Publish</h1>
          <p className="page-subtitle">Review everything before going live</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => navigate(`/tests/${id}/edit`)}>
            Edit Test
          </button>
          <button className="btn btn-outline" onClick={() => navigate(`/tests/${id}/questions`)}>
            Edit Questions
          </button>
        </div>
      </div>

      {published && (
        <div className="alert alert-success">
          Test published successfully! Redirecting to dashboard...
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="preview-grid">
        <div className="preview-card">
          <h2 className="section-title">Test Details</h2>
          <dl className="detail-list">
            <div className="detail-row">
              <dt>Name</dt>
              <dd>{test.name}</dd>
            </div>
            <div className="detail-row">
              <dt>Subject</dt>
              <dd>{test.subject}</dd>
            </div>
            <div className="detail-row">
              <dt>Type</dt>
              <dd>{test.type}</dd>
            </div>
            <div className="detail-row">
              <dt>Status</dt>
              <dd><StatusBadge status={test.status} /></dd>
            </div>
            <div className="detail-row">
              <dt>Topics</dt>
              <dd>{test.topics?.join(', ') || '—'}</dd>
            </div>
            <div className="detail-row">
              <dt>Sub-topics</dt>
              <dd>{test.sub_topics?.join(', ') || '—'}</dd>
            </div>
            <div className="detail-row">
              <dt>Difficulty</dt>
              <dd>{test.difficulty}</dd>
            </div>
            <div className="detail-row">
              <dt>Duration</dt>
              <dd>{test.total_time} minutes</dd>
            </div>
            <div className="detail-row">
              <dt>Total Marks</dt>
              <dd>{test.total_marks}</dd>
            </div>
            <div className="detail-row">
              <dt>Marking</dt>
              <dd>
                +{test.correct_marks} / {test.wrong_marks} / {test.unattempt_marks} (C/W/U)
              </dd>
            </div>
          </dl>
        </div>

        <div className="preview-card questions-preview">
          <h2 className="section-title">Questions ({questions.length})</h2>
          {questions.length === 0 ? (
            <p className="empty-hint">No questions added yet.</p>
          ) : (
            <div className="preview-questions">
              {questions.map((q, idx) => (
                <div key={q.id || idx} className="preview-q">
                  <p className="preview-q-text">
                    <strong>Q{idx + 1}.</strong> {q.question}
                  </p>
                  <ul className="preview-options">
                    {(['option1', 'option2', 'option3', 'option4'] as const).map((opt, i) => (
                      <li
                        key={opt}
                        className={q.correct_option === opt ? 'correct-opt' : ''}
                      >
                        <span className="opt-label">{String.fromCharCode(65 + i)}.</span>
                        {q[opt]}
                        {q.correct_option === opt && <span className="correct-tag">✓</span>}
                      </li>
                    ))}
                  </ul>
                  {q.explanation && (
                    <p className="preview-explanation">Explanation: {q.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {test.status !== 'live' && (
        <div className="publish-bar">
          <p>Ready to make this test available to students?</p>
          <button
            className="btn btn-primary btn-lg"
            disabled={publishing || questions.length === 0}
            onClick={handlePublish}
          >
            {publishing ? 'Publishing...' : 'Publish Test'}
          </button>
        </div>
      )}
    </Layout>
  );
}
