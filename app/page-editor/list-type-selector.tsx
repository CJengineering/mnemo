'use client';

type Props = {
  value: 'bullet' | 'numbered';
  onChange: (value: 'bullet' | 'numbered') => void;
};

export function ListTypeSelector({ value, onChange }: Props) {
  return (
    <select
      className="text-sm border rounded"
      value={value}
      onChange={(e) => onChange(e.target.value as 'bullet' | 'numbered')}
    >
      <option value="bullet">• Bullet</option>
      <option value="numbered">1. Numbered</option>
    </select>
  );
}
