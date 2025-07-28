"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import GoogleBucketViewer from "@/components/test-components/google-bucket-display";

export default function ContentIndexPage() {
  const [contents, setContents] = useState<{ id: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);


  return (
    <div>
      <GoogleBucketViewer />
  
    </div>
  );
}
