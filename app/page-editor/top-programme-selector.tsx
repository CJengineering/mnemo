'use client';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export function TopProgrammeSelector() {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a programme" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Projects</SelectLabel>
          <SelectItem value="www.communityjameel.org">
            communityjameel.org
          </SelectItem>
          <SelectItem value="behna.com">Behna.com</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
