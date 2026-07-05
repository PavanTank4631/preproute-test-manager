interface Option {
  id: string;
  name: string;
}

interface Props {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
  disabled,
  placeholder = 'Select...',
}: Props) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className={`multi-select ${disabled ? 'disabled' : ''}`}>
        {options.length === 0 ? (
          <p className="multi-select-empty">{placeholder}</p>
        ) : (
          options.map((opt) => (
            <label key={opt.id} className="multi-select-item">
              <input
                type="checkbox"
                checked={selected.includes(opt.id)}
                onChange={() => toggle(opt.id)}
                disabled={disabled}
              />
              <span>{opt.name}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
