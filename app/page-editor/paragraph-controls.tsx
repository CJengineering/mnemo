import { DroppedItem } from "./type";

type Props = {
    format?: DroppedItem['format'];
    onChange: (update: Partial<DroppedItem['format']>) => void;
  };
  
  export function ParagraphControls({ format, onChange }: Props) {
    return (
      <div className="flex gap-2 items-center">
        {['bold', 'italic', 'underline'].map((key) => (
          <label key={key} className="text-xs capitalize flex items-centers space-x-2">
            <input
              type="checkbox"
              checked={format?.[key as keyof typeof format] || false}
              onChange={(e) => onChange({ [key]: e.target.checked })}
              className="mr-1 "
            />
            {key}
          </label>
        ))}
      </div>
    );
  }
  