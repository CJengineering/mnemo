"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DataChunk {
  id: string;
  name: string;
  type: "text" | "rich_text" | "image";
  data: string | { url: string; alt: string } ;
  metaData: {
    editor?: string;
    datePublished?: string;
    website?: string;
    keywords?: string[];
  };
}

export default function ContentDetailPage() {
  const params = useParams();
  const contentId = params.id;

  const [content, setContent] = useState<{ title: string; description: string } | null>(null);
  const [dataChunks, setDataChunks] = useState<DataChunk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      const response = await fetch(`/api/content/${contentId}`);

      if (!response.ok) {
        console.error("Failed to fetch content");
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setContent(data.content);
        setDataChunks(data.dataChunks);
      }

      setLoading(false);
    }

    fetchContent();
  }, [contentId]);
  const handleRemoveDataChunk = async (chunkId: string) => {
    const response = await fetch(`/api/content/${contentId}/unlink-data-chunk`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chunkId }),
    });

    if (response.ok) {
      setDataChunks((prev) => prev.filter((chunk) => chunk.id !== chunkId));
    } else {
      console.error("Failed to remove data chunk");
    }
  };
  if (loading) return <p>Loading content...</p>;
  if (!content) return <p>Content not found</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
      <p className="text-lg text-gray-700">{content.description}</p>

      <h2 className="text-2xl font-semibold mt-6">Linked Data Chunks</h2>
      <ul className="mt-4 space-y-6">
        {dataChunks.map((chunk) => (
          <li key={chunk.id} className="p-4 border rounded bg-gray-100">
            <h3 className="text-lg font-bold">{chunk.name}</h3>
            <p className="text-sm text-gray-500">Type: {chunk.type}</p>

            {/* ✅ Render based on chunk type */}
            {chunk.type === "text" && (
              <p className="mt-2 text-gray-800">chunk.data</p>
            )}

            {chunk.type === "rich_text" && (
              <div className=" rich-text mt-2" dangerouslySetInnerHTML={{ __html: chunk.data }} />
            )}

            {chunk.type === "image" && (
              <div className="mt-2">
                <img
                  src={'chunk.data.url'}
                  alt={chunk.metaData?.keywords?.join(", ") || "Image"}
                  className="max-w-full h-auto rounded-md shadow-md"
                />
              </div>
            )}

            {/* ✅ Render Metadata */}
            {chunk.metaData && (
              <div className="mt-3 p-3 bg-white rounded shadow">
                <h4 className="font-semibold text-sm">Metadata:</h4>
                <ul className="text-sm text-gray-600">
                  {chunk.metaData.editor && <li><strong>Editor:</strong> {chunk.metaData.editor}</li>}
                  {chunk.metaData.datePublished && <li><strong>Date Published:</strong> {chunk.metaData.datePublished}</li>}
                  {chunk.metaData.website && (
                    <li>
                      <strong>Website:</strong>{" "}
                      <a href={chunk.metaData.website} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                        {chunk.metaData.website}
                      </a>
                    </li>
                  )}
                  {(chunk.metaData.keywords?.length ?? 0) > 0 && (
                    <li><strong>Keywords:</strong> {chunk.metaData.keywords?.join(", ")}</li>
                  )}
                </ul>
              </div>
            )}
                <Button variant="destructive" onClick={() => handleRemoveDataChunk(chunk.id)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
