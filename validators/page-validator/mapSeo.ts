// mapSeo.ts
export function mapSeo(meta: any): {
    title: string;
    description: string;
    keywords: string[];
  } {
    if (!meta || typeof meta !== 'object') {
      throw new Error('Invalid SEO metadata.');
    }
  
    const title = typeof meta.title === 'string' ? meta.title.trim() : '';
    const description = typeof meta.description === 'string' ? meta.description.trim() : '';
    const keywords = Array.isArray(meta.keywords)
      ? Array.from(new Set((meta.keywords as string[]).map((k: string) => k.toLowerCase())))
      : [];
  
    if (!title) throw new Error('SEO title is required.');
    if (!description) throw new Error('SEO description is required.');
  
    return {
      title,
      description,
      keywords
    };
  }
  