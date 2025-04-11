import { mapSeo } from './mapSeo';

describe('mapSeo', () => {
  it('should return cleaned and normalized SEO object', () => {
    const result = mapSeo({
      title: '  My SEO Title  ',
      description: '  SEO Description  ',
      keywords: ['SEO', 'Content', 'seo']
    });

    expect(result).toEqual({
      title: 'My SEO Title',
      description: 'SEO Description',
      keywords: ['seo', 'content']
    });
  });

  it('should return empty keywords if none provided', () => {
    const result = mapSeo({
      title: 'Title',
      description: 'Description'
    });

    expect(result.keywords).toEqual([]);
  });

  it('should throw if title is missing or empty', () => {
    expect(() => mapSeo({ description: 'desc' })).toThrow('SEO title is required.');
    expect(() => mapSeo({ title: '', description: 'desc' })).toThrow('SEO title is required.');
  });

  it('should throw if description is missing or empty', () => {
    expect(() => mapSeo({ title: 'Title' })).toThrow('SEO description is required.');
    expect(() => mapSeo({ title: 'Title', description: '' })).toThrow('SEO description is required.');
  });

  it('should throw if meta is not an object', () => {
    expect(() => mapSeo(null)).toThrow('Invalid SEO metadata.');
    expect(() => mapSeo(undefined)).toThrow('Invalid SEO metadata.');
    expect(() => mapSeo('string')).toThrow('Invalid SEO metadata.');
  });
});
