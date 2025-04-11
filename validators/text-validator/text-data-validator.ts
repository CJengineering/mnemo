import { MappedTextObject, MetaData } from "./type";

export function mapData(inputData: any, inputMeta: any, type: "text" | "rich_text" | "image"): MappedTextObject {
    if (!inputMeta || typeof inputMeta !== 'object') {
      throw new Error("Invalid metaData: must be an object.");
    }

    let cleanData: any = inputData;

    if (type === "text" || type === "rich_text") {
        if (typeof inputData !== 'string' || inputData.trim() === '') {
          throw new Error("Invalid text data: must be a non-empty string.");
        }
        cleanData = inputData.trim();
    } else if (type === "image") {
        if (typeof inputData !== 'string' || !inputData.startsWith("http")) {
          throw new Error("Invalid image data: must be a valid URL.");
        }

        cleanData = {
          url: inputData, // Image URL
          alt: typeof inputMeta.alt === "string" ? inputMeta.alt.trim() : "Image without description"
        };
    }

    const validatedMetaData: MetaData = {
        version: typeof inputMeta.version === "string" ? inputMeta.version.trim() : "1.0",
        editor: typeof inputMeta.editor === "string" && inputMeta.editor.trim() !== "" 
            ? inputMeta.editor.trim()
            : (() => { throw new Error("Editor is required in metaData."); })(),
        datePublished: inputMeta.datePublished && typeof inputMeta.datePublished === "string"
            ? inputMeta.datePublished
            : null,
        website: inputMeta.website && typeof inputMeta.website === "string"
            ? inputMeta.website.trim()
            : null,
        keywords: Array.isArray(inputMeta.keywords)
            ? Array.from(new Set(
                inputMeta.keywords.filter((k: unknown): k is string => typeof k === "string")
                .map((k: string) => k.toLowerCase())
            ))
            : []
    };

    return {
      data: cleanData, // Image type stores {url, alt}, others store plain text
      metaData: validatedMetaData
    };
}
