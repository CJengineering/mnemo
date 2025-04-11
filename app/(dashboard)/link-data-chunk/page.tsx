"use client";
import { useState, useEffect } from "react";

export default function LinkDataChunkPage() {
  const [contents, setContents] = useState<{ id: string; title: string }[]>([]);
  const [dataChunks, setDataChunks] = useState<{ id: string; type:string; data: any }[]>([]);
  const [selectedContent, setSelectedContent] = useState("");
  const [selectedChunk, setSelectedChunk] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchData() {
      const contentRes = await fetch("/api/content/list");
      const chunkRes = await fetch("/api/data-chunk/list");

      const contentData = await contentRes.json();
      const chunkData = await chunkRes.json();

      setContents(contentData.contents);
      setDataChunks(chunkData.dataChunks);
    }

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch("/api/link-data-chunk", {
      method: "POST",
      body: JSON.stringify({ contentId: selectedContent, dataChunkId: selectedChunk }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (response.ok) {
      setMessage("Data Chunk Linked Successfully!");
    } else {
      setMessage("Error: " + data.error);
    }
  };

  return (
    <div>
      <h1>Link Data Chunk to Content</h1>
      <form onSubmit={handleSubmit}>
        <select onChange={(e) => setSelectedContent(e.target.value)} required>
          <option value="">Select Content</option>
          {contents.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>

        <select onChange={(e) => setSelectedChunk(e.target.value)} required>
          <option value="">Select Data Chunk</option>
          {dataChunks.map((d) => (
            <option key={d.id} value={d.id}>{d.type}</option>
          ))}
        </select>

        <button type="submit">Link</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
