'use client';



type Props = {
  value: {
    content: string;
    url?: string;
    isExternal?: boolean;
  };
  onContentChange: (text: string) => void;
  onUrlChange: (url: string) => void;
  onToggleExternal: (value: boolean) => void;
};

export function ButtonEditor({
  value,
  onContentChange,
  onUrlChange,
  onToggleExternal
}: Props) {
  return (
    <div className="flex flex-col gap-1 text-sm mt-2 w-full">
      <input
        type="text"
        placeholder="Button Text"
        value={value.content}
        onChange={(e) => onContentChange(e.target.value)}
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
