// utils/mergeDynamicPagesIntoSidebar.ts

type NavItem = {
  name: string;
  href?: string;
  current?: boolean;
  children?: NavItem[];
  targetBlank?: boolean;
  icon?: string;
};

type FlatNavItem = {
  name: string;
  href: string;
};

const slugify = (text: string) =>
  text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

function findOrCreateChild(parent: NavItem, segment: string): NavItem {
  const slugSegment = slugify(segment);
  parent.children = parent.children || [];

  let match = parent.children.find(
    (child) => slugify(child.name) === slugSegment && !child.href
  );

  if (!match) {
    match = {
      name: segment.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      children: []
    };
    parent.children.push(match);
  }

  return match;
}

export function mergeDynamicPagesIntoSidebar(
  sidebar: NavItem[],
  dynamicPages: FlatNavItem[]
): NavItem[] {
  const updatedSidebar = JSON.parse(JSON.stringify(sidebar)) as NavItem[];

  for (const page of dynamicPages) {
    const segments = page.href.split('/').filter(Boolean);
    if (!segments.length) continue;

    // Determine top group
    let topGroup = 'Discover';
    if (segments[0] === 'programme' || segments[0] === 'programmes') {
      topGroup = 'Programmes';
    } else if (segments[0] === 'about') {
      topGroup = 'About';
    }

    const topItem = updatedSidebar.find(
      (item) => slugify(item.name) === slugify(topGroup)
    );
    if (!topItem) continue;

    // Remove topGroup slug from path if it's repeated
    if (slugify(segments[0]) === slugify(topGroup)) {
      segments.shift();
    }

    let parent = topItem;

    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      parent = findOrCreateChild(parent, segment);
    }

    // Add final leaf
    const finalHref = '/' + page.href;
    const exists = parent.children?.some((child) => child.href === finalHref);

    if (!exists) {
      parent.children = parent.children || [];
      parent.children.push({
        name: page.name,
        href: finalHref
      });
    }
  }

  return updatedSidebar;
}