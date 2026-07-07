import { useEffect, useRef } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  error?: boolean;
}

type Cmd = { icon: string; command: string; title: string; value?: string };

const commands: Cmd[] = [
  { icon: 'B', command: 'bold', title: 'Bold' },
  { icon: 'I', command: 'italic', title: 'Italic' },
  { icon: 'U', command: 'underline', title: 'Underline' },
  { icon: 'S', command: 'strikeThrough', title: 'Strikethrough' },
  { icon: 'x²', command: 'superscript', title: 'Superscript' },
  { icon: 'x₂', command: 'subscript', title: 'Subscript' },
  { icon: '• List', command: 'insertUnorderedList', title: 'Bullet list' },
  { icon: '1. List', command: 'insertOrderedList', title: 'Numbered list' },
];

export default function RichTextEditor({ value, onChange, placeholder, error }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    ref.current?.focus();
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className={`rte ${error ? 'rte-error' : ''}`}>
      <div className="rte-toolbar">
        {commands.map((c) => (
          <button
            key={c.command}
            type="button"
            className="rte-btn"
            title={c.title}
            onMouseDown={(e) => {
              e.preventDefault();
              exec(c.command, c.value);
            }}
          >
            {c.icon}
          </button>
        ))}
        <button
          type="button"
          className="rte-btn"
          title="Clear formatting"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('removeFormat');
          }}
        >
          ⌫
        </button>
      </div>
      <div
        ref={ref}
        className="rte-content"
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={handleInput}
        suppressContentEditableWarning
      />
    </div>
  );
}
