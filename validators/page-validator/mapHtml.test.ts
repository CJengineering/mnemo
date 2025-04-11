import { mapHtml } from './mapHtml';

describe('mapHtml', () => {
  it('should return trimmed rawHtml string wrapped in object', () => {
    const input = '   <h1>Hello</h1>   ';
    const result = mapHtml(input);
    expect(result).toEqual({ rawHtml: '<h1>Hello</h1>' });
  });

  it('should throw an error for empty string', () => {
    expect(() => mapHtml('')).toThrow('Invalid HTML: must be a non-empty string.');
  });

  it('should throw an error for non-string values', () => {
    expect(() => mapHtml(123)).toThrow('Invalid HTML: must be a non-empty string.');
    expect(() => mapHtml(null)).toThrow('Invalid HTML: must be a non-empty string.');
    expect(() => mapHtml(undefined)).toThrow('Invalid HTML: must be a non-empty string.');
  });
});
