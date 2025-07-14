import React from 'react';

async function fetchContent() {
  const response = await fetch('/api/rich-text', {
    method: 'GET',
    cache: 'no-store'
  });
  const data = await response.json();
  return data;
}

export default async function RichTextPage() {
  const content = await fetchContent();

  return (
    <div className="container mx-auto p-6">
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: content.content.html }}
      />
    </div>
  );
}
