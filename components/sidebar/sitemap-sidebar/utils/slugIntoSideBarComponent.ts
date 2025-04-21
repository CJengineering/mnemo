// utils/slugIntoSideBarComponent.ts

export type DynamicPage = { name: string; href: string };

/**
 * Transforms an array of pages into sidebar link entries.
 * - `href` is the slug without the leading `/`
 * - `name` is the last segment of that slug, turned into Title Case
 */
export function slugIntoSideBarComponent(
  pages: { slug: string }[]
): DynamicPage[] {
  return pages.map(({ slug }) => {
    // drop leading slash
    const raw = slug.startsWith('/') ? slug.slice(1) : slug;
    // this is your href
    const href = raw;
    // grab the last segment
    const last = raw.split('/').pop() || '';
    // turn kebab-case into Title Case
    const name = last
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { name, href };
  });
}
