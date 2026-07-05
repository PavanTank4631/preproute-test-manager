interface Props {
  label?: string;
}

export default function LoadingSpinner({ label = 'Loading...' }: Props) {
  return (
    <div className="loading-wrap">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}
