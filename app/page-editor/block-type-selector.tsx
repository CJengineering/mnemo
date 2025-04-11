'use client';

import { BlockType } from './type';

type Props = {
  value: BlockType;
  onChange: (value: BlockType) => void;
};

export function BlockTypeSelector({ value, onChange }: Props) {
  return (
    <select
      className="text-sm border rounded"
      value={value}
      onChange={(e) => onChange(e.target.value as BlockType)}
    >
      <option value="h1">H1</option>
      <option value="h2">H2</option>
      <option value="h3">H3</option>
      <option value="h4">H4</option>
      <option value="h5">H5</option>
      <option value="h6">H6</option>

      <option value="p">P</option>
    </select>
  );
}
