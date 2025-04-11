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

export function TopSelectorSiteMap() {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a website" />
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
