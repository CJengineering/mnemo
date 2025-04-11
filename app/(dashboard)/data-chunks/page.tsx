"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import EditDataChunkModal from "@/components/test-components/edit-data-chunk-model";

interface DataChunk {
  id: string;
  name: string;
  type: string;
  programme_id: string;
  data: string |  any;
  metaData: Record<string, any>;
}

export default function DataChunksPage() {
  const [dataChunks, setDataChunks] = useState<DataChunk[]>([]);
  const [selectedChunk, setSelectedChunk] = useState<DataChunk | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load Data Chunks
  useEffect(() => {
    fetch("/api/data-chunk")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDataChunks(data.dataChunks);
      });
  }, []);

  // Open Update Form
  const handleEdit = (chunk: DataChunk) => {
    setSelectedChunk(chunk);
    setIsModalOpen(true);
  };

  // Delete Data Chunk
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/data-chunk/${id}`, { method: "DELETE" });

    if (res.ok) {
      setDataChunks((prev) => prev.filter((chunk) => chunk.id !== id));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Data Chunks</h1>
      <ul className="space-y-4">
        {dataChunks.map((chunk) => (
          <li key={chunk.id} className="p-4 border rounded flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold">{chunk.name}</p>
              <p className="text-sm text-gray-500">{chunk.type}</p>

              {/* Display content based on type */}
              {chunk.type === "text" && (
                <p className="text-sm text-gray-700">{chunk.data}</p>
              )}

              {chunk.type === "rich_text" && (
                <div
                  className="text-sm text-gray-700"
                  dangerouslySetInnerHTML={{ __html: chunk.data }}
                />
              )}

              {chunk.type === "image" && (
                <img
                  src={chunk.data.url}
                  alt={chunk.metaData?.alt || "Uploaded Image"}
                  className="w-32 h-32 object-cover rounded-md"
                />
              )}

              {/* Display Metadata */}
              {chunk.metaData && (
                <div className="mt-2 p-2 border rounded bg-gray-50">
                  <h4 className="text-sm font-semibold">Metadata:</h4>
                  <ul className="text-xs text-gray-600">
                
                    {Object.entries(chunk.metaData).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}:</strong> {String(value)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => handleEdit(chunk)}>
                Edit
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(chunk.id)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {/* Update Modal */}
      {isModalOpen && selectedChunk && (
        <EditDataChunkModal
          chunk={selectedChunk}
          onClose={() => setIsModalOpen(false)}
          onUpdate={(updatedChunk) =>
            setDataChunks((prev) =>
              prev.map((c) => (c.id === updatedChunk.id ? updatedChunk : c))
            )
          }
        />
      )}
    </div>
  );
}
