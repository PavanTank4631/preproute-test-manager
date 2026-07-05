import type { TestStatus } from '../types';

const statusStyles: Record<TestStatus, string> = {
  draft: 'badge-draft',
  live: 'badge-live',
  unpublished: 'badge-unpublished',
  scheduled: 'badge-scheduled',
  expired: 'badge-expired',
};

interface Props {
  status: TestStatus;
}

export default function StatusBadge({ status }: Props) {
  return <span className={`status-badge ${statusStyles[status] || ''}`}>{status}</span>;
}
