import React from 'react';
import { TopContentTypeSelector } from './top-content-type-selector';
import { TopProgrammeSelector } from './top-programme-selector';
import { SearchDataChunks } from './search-data-chunks';

export default function ContentSearchSelectors() {
  return (
    <div className="flex space-x-2">
      <div className="w-1/3">
        <SearchDataChunks />
      </div>
      <TopContentTypeSelector />
      <TopProgrammeSelector />
    </div>
  );
}
