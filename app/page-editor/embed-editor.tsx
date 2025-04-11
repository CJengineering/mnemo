'use client';

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export function EmbedEditor({ value, onChange }: Props) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="<script>...</script> or <iframe>...</iframe>"
      className="border px-2 py-1 rounded text-sm w-full min-h-[100px] font-mono"
    />
  );
}
