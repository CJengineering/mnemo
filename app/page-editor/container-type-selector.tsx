'use client';

export type ContainerType = string;

type Props = {
  value: ContainerType;
  onChange: (value: ContainerType) => void;
};

export function ContainerTypeSelector({ value, onChange }: Props) {
  return (
    <select
      className="text-sm border rounded"
      value={value}
      onChange={(e) => onChange(e.target.value as ContainerType)}
    >
      <option value="block">Block</option>
      <option value="flex gap-2">Flex</option>
      <option value="grid grid-cols-2 gap-2">Grid (2 cols)</option>
      <option value="grid grid-cols-3 gap-2">Grid (3 cols)</option>
    </select>
  );
}
