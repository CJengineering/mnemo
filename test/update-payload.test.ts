// filepath: test/update-payload.test.ts
import {
  buildUpdatePayload,
  normalizeApiType
} from '../app/(dashboard)/collections/context/update-payload';

describe('normalizeApiType', () => {
  it('maps people -> person and allows known types', () => {
    expect(normalizeApiType('people')).toBe('person');
    expect(normalizeApiType('Programme')).toBe('programme');
    expect(normalizeApiType('unknown')).toBeUndefined();
  });
});

describe('buildUpdatePayload', () => {
  const base = { title: 'A', slug: 'a', status: 'draft' as const };

  it('builds status-only payload', () => {
    const payload = buildUpdatePayload(
      { status: 'published' },
      { statusOnly: true }
    );
    expect(payload).toEqual({ status: 'published' });
  });

  it('builds minimal payload for title-only', () => {
    const payload = buildUpdatePayload(
      { title: 'New' },
      { minimalUpdate: true }
    );
    expect(payload).toEqual({ title: 'New' });
  });

  it('builds minimal payload for slug-only', () => {
    const payload = buildUpdatePayload(
      { slug: 'new' },
      { minimalUpdate: true }
    );
    expect(payload).toEqual({ slug: 'new' });
  });

  it('builds minimal payload for title+status', () => {
    const payload = buildUpdatePayload(
      { title: 'New', status: 'published' },
      { minimalUpdate: true }
    );
    expect(payload).toEqual({ title: 'New', status: 'published' });
  });

  it('builds full payload and normalizes type', () => {
    const payload = buildUpdatePayload(
      { ...base, data: { x: 1 }, type: 'people' },
      undefined,
      'people'
    );
    expect(payload).toEqual({
      status: 'draft',
      slug: 'a',
      title: 'A',
      data: { x: 1 },
      type: 'person'
    });
  });

  it('omits type if not valid on full payload', () => {
    const payload = buildUpdatePayload(
      { ...base, data: { x: 1 }, type: 'unknown' as any },
      undefined,
      'unknown'
    );
    expect(payload).toEqual({
      status: 'draft',
      slug: 'a',
      title: 'A',
      data: { x: 1 }
    });
  });
});
