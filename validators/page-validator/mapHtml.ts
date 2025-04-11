export function mapHtml(rawHtml: any): { rawHtml: string } {
    if (typeof rawHtml !== 'string' || rawHtml.trim() === '') {
      throw new Error('Invalid HTML: must be a non-empty string.');
    }
    return { rawHtml: rawHtml.trim() };
  }