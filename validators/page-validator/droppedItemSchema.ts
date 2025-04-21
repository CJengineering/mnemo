// droppedItemSchema.ts
import { z } from 'zod';

export const droppedItemSchema = z.object({
  id: z.string(),
  type: z.enum([
    'h1', 'h2', 'p', 'img', 'ul', 'youtube',
    'button', 'link', 'video', 'rich-text', 'embed', 'postAccordion'
  ]),
  content: z.string(),
  children: z
    .any() // Allow `children` to be any type, but optional
    .optional()
    .nullable(),
  image: z
    .object({
      src: z.string().url(),
      alt: z.string(),
      width: z.number(),
      height: z.number()
    })
    .optional(),
  button: z
    .object({
      url: z.string(),
      isExternal: z.boolean()
    })
    .optional(),
  format: z
    .object({
      bold: z.boolean().optional(),
      italic: z.boolean().optional(),
      underline: z.boolean().optional()
    })
    .optional(),
  listType: z.enum(['bullet', 'numbered']).optional(),
  link: z
    .object({
      url: z.string(),
      isExternal: z.boolean()
    })
    .optional()
});

export const droppedItemArraySchema = z.array(droppedItemSchema);

// Type from schema
export type DroppedItem = z.infer<typeof droppedItemSchema>;
