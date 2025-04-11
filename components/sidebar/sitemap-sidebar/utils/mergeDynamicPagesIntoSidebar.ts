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

export function mergeDynamicPagesIntoSidebar(
  sidebar: NavItem[],
  dynamicPages: FlatNavItem[]
): NavItem[] {
  const updatedSidebar = JSON.parse(JSON.stringify(sidebar)) as NavItem[];

  for (const page of dynamicPages) {
    const segments = page.href.split('/').filter(Boolean);
    let topGroup = 'Discover';

    if (segments[0] === 'programme' || segments[0] === 'programmes') {
      topGroup = 'Programmes';
      segments.shift();
    } else if (segments[0] === 'about') {
      topGroup = 'About';
      segments.shift();
    }

    const topItem = updatedSidebar.find((item) => item.name === topGroup);
    if (!topItem) continue;

    let parent = topItem;

    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];

      // Try to find existing node by slug match
      let match = parent.children?.find(
        (child) => slugify(child.name) === slugify(segment)
      );

      if (!match) {
        // Create intermediate group if missing
        const newNode: NavItem = {
          name: segment.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          children: []
        };
        parent.children = parent.children || [];
        parent.children.push(newNode);
        match = newNode;
      }

      parent = match;
    }

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
