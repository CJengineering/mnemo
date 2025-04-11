'use client';
import { useMnemo } from "./mnemo-context";


export const Example = () => {
  const { dataChunks, pages, programmes, refreshAll } = useMnemo();

  return (
    <div>
      <h2>Data Chunks: {dataChunks.length}</h2>
      <h2>Pages: {pages.length}</h2>
      <h2>Programmes: {programmes.length}</h2>
      <button onClick={refreshAll}>Refresh</button>
    </div>
  );
};
