'use client';

type Props = {
  value: {
    label: string;
    url?: string;
    isExternal?: boolean;
  };
  onLabelChange: (text: string) => void;
  onUrlChange: (url: string) => void;
  onToggleExternal: (value: boolean) => void;
};

export function LinkEditor({
  value,
  onLabelChange,
  onUrlChange,
  onToggleExternal
}: Props) {
  return (
    <div className="flex flex-col gap-1 text-sm mt-2 w-full">
      <input
        type="text"
        placeholder="Link Label"
        value={value.label}
        onChange={(e) => onLabelChange(e.target.value)}
        className="border px-2 py-1 rounded"
      />
      <input
        type="text"
        placeholder="URL"
        value={value.url ?? ''}
        onChange={(e) => onUrlChange(e.target.value)}
        className="border px-2 py-1 rounded"
      />
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={value.isExternal ?? false}
          onChange={(e) => onToggleExternal(e.target.checked)}
        />
        Open in new tab
      </label>
    </div>
  );
}
