// filepath: app/(dashboard)/collections/context/update-payload.ts

export type UiStatus = 'published' | 'draft';

export interface APICollectionItemPartial {
  id?: string;
  title?: string;
  type?: string;
  slug?: string;
  status?: UiStatus;
  data?: any;
}

const ALLOWED_API_TYPES = new Set([
  'event',
  'post',
  'programme',
  'news',
  'team',
  'innovation',
  'award',
  'publication',
  'prize',
  'partner',
  'person',
  'tag'
]);

export function normalizeApiType(input?: string): string | undefined {
  if (!input) return undefined;
  const lower = input.toLowerCase();
  const mapped = lower === 'people' ? 'person' : lower;
  return ALLOWED_API_TYPES.has(mapped) ? mapped : undefined;
}

export const transformStatusToAPI = (uiStatus: UiStatus): string => uiStatus;

export function buildUpdatePayload(
  formData: APICollectionItemPartial,
  options?: { statusOnly?: boolean; minimalUpdate?: boolean },
  selectedItemType?: string
): any {
  const apiStatus = transformStatusToAPI(formData.status || 'draft');

  if (options?.statusOnly) {
    return { status: apiStatus };
  }

  if (options?.minimalUpdate) {
    const payload: any = {};
    if (formData.title !== undefined) payload.title = formData.title?.trim();
    if (formData.slug !== undefined) payload.slug = formData.slug?.trim();
    if (formData.status !== undefined) payload.status = apiStatus;
    return payload;
  }

  // Full update
  const normalizedType = normalizeApiType(formData.type || selectedItemType);
  const payload: any = {
    status: apiStatus,
    slug: formData.slug?.trim(),
    title: formData.title?.trim(),
    data: formData.data
  };
  if (normalizedType) payload.type = normalizedType;
  return payload;
}
