import { useEffect, useState } from 'react';

interface Props {
  src: string;
  alt?: string;
  className?: string;
  showError?: boolean;
}

export default function SmartImage({ src, alt = '', className, showError }: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    setStatus('loading');
  }, [src]);

  if (!src) return null;

  if (status === 'error') {
    if (!showError) return null;
    return (
      <div className={`image-broken ${className || ''}`}>
        Image could not be loaded. Check the URL.
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={status === 'loading' ? { opacity: 0.4 } : undefined}
      onLoad={() => setStatus('loaded')}
      onError={() => setStatus('error')}
    />
  );
}
