"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// ✅ Define form validation schema using Zod
const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  editor: z.string().min(2, {
    message: "Editor name must be at least 2 characters.",
  }),
  datePublished: z.string().optional(),
  website: z.string().url().optional(),
  keywords: z.string().optional(),
  programmeId: z.string().uuid({ message: "Programme selection is required." }),
});

export default function CreateContentPage() {
  const [message, setMessage] = useState("");
  const [programmes, setProgrammes] = useState<{ id: string; title: string }[]>(
    []
  );

  // ✅ Fetch programmes for selection
  useEffect(() => {
    fetch("/api/programmes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProgrammes(data.programmes);
        }
      });
  }, []);

  // ✅ Initialize react-hook-form with Zod validation
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      editor: "",
      datePublished: "",
      website: "",
      keywords: "",
      programmeId: "",
    },
  });

  // ✅ Handle form submission
  const handleSubmit = async (values: any) => {
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          metaData: {
            editor: values.editor,
            datePublished: values.datePublished || null,
            website: values.website || null,
            keywords: values.keywords
              ? values.keywords.split(",").map((k: string) => k.trim())
              : [],
          },
        }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Content Created Successfully!");
        form.reset(); // Reset the form after success
      } else {
        setMessage("Error: " + data.error);
      }
    } catch (error) {
      setMessage("Failed to submit content.");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow rounded-md">
      <h1 className="text-2xl font-bold mb-4">Create Content</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* ✅ Title Field */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ✅ Description Field */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ✅ Editor Name */}
          <FormField
            control={form.control}
            name="editor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Editor</FormLabel>
                <FormControl>
                  <Input placeholder="Enter editor name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ✅ Date Published */}
          <FormField
            control={form.control}
            name="datePublished"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Published</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ✅ Website */}
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ✅ Keywords */}
          <FormField
            control={form.control}
            name="keywords"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Keywords</FormLabel>
                <FormControl>
                  <Input placeholder="Enter keywords (comma-separated)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ✅ Programme Selection */}
          <FormField
            control={form.control}
            name="programmeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Programme</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a programme" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {programmes.map((programme) => (
                      <SelectItem key={programme.id} value={programme.id}>
                        {programme.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ✅ Submit Button */}
          <Button type="submit" className="w-full">
            Create Content
          </Button>
        </form>
      </Form>

      {/* ✅ Message Display */}
      {message && <p className="mt-4 text-center text-sm">{message}</p>}
    </div>
  );
}
