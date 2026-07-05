import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { testsApi } from '../api';
import { formatDate } from '../utils/formatDate';
import type { Test } from '../types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Test | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await testsApi.getAll();
      setTests(res.data.data || []);
    } catch {
      setError('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const filtered = tests.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (typeof t.subject === 'string' && t.subject.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await testsApi.delete(deleteTarget.id);
      setTests((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError('Could not delete test');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Tests</h1>
          <p className="page-subtitle">Manage and publish your test papers</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/tests/new')}>
          + Create New Test
        </button>
      </div>

      <div className="filters-bar">
        <input
          className="form-input search-input"
          placeholder="Search by name or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-input filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="live">Live</option>
          <option value="scheduled">Scheduled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <LoadingSpinner label="Fetching tests..." />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No tests found</p>
          <button className="btn btn-primary" onClick={() => navigate('/tests/new')}>
            Create your first test
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Questions</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((test) => (
                <tr key={test.id}>
                  <td className="td-name">{test.name}</td>
                  <td>{test.subject}</td>
                  <td>
                    <StatusBadge status={test.status} />
                  </td>
                  <td>{test.total_questions}</td>
                  <td>{formatDate(test.created_at)}</td>
                  <td className="td-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/tests/${test.id}/preview`)}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/tests/${test.id}/edit`)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-sm text-danger"
                      onClick={() => setDeleteTarget(test)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Test"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove all associated questions.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </Layout>
  );
}
