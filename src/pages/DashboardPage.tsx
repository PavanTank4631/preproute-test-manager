import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { testsApi } from '../api';
import { formatDate } from '../utils/formatDate';
import type { Test } from '../types';

const TESTS_CACHE_KEY = 'tests_cache';

function readCachedTests(): Test[] | null {
  try {
    const raw = sessionStorage.getItem(TESTS_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Test[]) : null;
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const cached = readCachedTests();
  const [tests, setTests] = useState<Test[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Test | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const fetchTests = async (hasCache: boolean) => {
    if (hasCache) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await testsApi.getAll();
      const list = res.data.data || [];
      setTests(list);
      try {
        sessionStorage.setItem(TESTS_CACHE_KEY, JSON.stringify(list));
      } catch {
        /* ignore quota errors */
      }
    } catch {
      if (!hasCache) setError('Failed to load tests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTests(!!cached);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = tests.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (typeof t.subject === 'string' && t.subject.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await testsApi.delete(deleteTarget.id);
      setTests((prev) => {
        const next = prev.filter((t) => t.id !== deleteTarget.id);
        try {
          sessionStorage.setItem(TESTS_CACHE_KEY, JSON.stringify(next));
        } catch {
          /* ignore quota errors */
        }
        return next;
      });
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
          <p className="page-subtitle">
            Manage and publish your test papers
            {refreshing && <span className="refresh-hint"> · refreshing…</span>}
          </p>
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
              {paged.map((test) => (
                <tr key={test.id}>
                  <td className="td-name">{test.name}</td>
                  <td>{test.subject}</td>
                  <td>
                    <StatusBadge status={test.status} />
                  </td>
                  <td>{test.total_questions}</td>
                  <td>{formatDate(test.created_at)}</td>
                  <td className="td-actions">
                    <div className="td-actions-inner">
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <span className="pagination-info">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="pagination-controls">
              <button
                className="btn btn-outline btn-sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Prev
              </button>
              <span className="pagination-page">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next →
              </button>
            </div>
          </div>
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
