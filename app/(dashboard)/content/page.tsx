"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import GoogleBucketViewer from "@/components/test-components/google-bucket-display";

export default function ContentIndexPage() {
  const [contents, setContents] = useState<{ id: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContents() {
      const response = await fetch("/api/content/list");

      if (!response.ok) {
        console.error("Failed to fetch content list");
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setContents(data.contents);
      }

      setLoading(false);
    }

    fetchContents();
  }, []);

  if (loading) return <p>Loading content...</p>;
  if (contents.length === 0) return <p>No content found.</p>;

  return (
    <div>
      <GoogleBucketViewer />
      <h1>All Content</h1>
      <ul>
        {contents.map((content) => (
          <li key={content.id}>
            <Link href={`/content/${content.id}`}>
              {content.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
