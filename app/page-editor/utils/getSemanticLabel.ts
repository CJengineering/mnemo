import { BlockType } from '../type';

export function getSemanticLabel(type: BlockType): string {
  const semanticMap: Record<BlockType, string> = {
    h1: 'Heading 1',

    h2: 'Heading 2',
    h3: 'Heading 3',
    h4: 'Heading 4',
    h5: 'Heading 5',
    h6: 'Heading 6',
    p: 'Paragraph',
    img: 'Image',
    ul: 'Bullet List',
    youtube: 'YouTube Video',
    button: 'Button',
    link: 'Link',
    video: 'Video',
    'rich-text': 'Rich Text',
    embed: 'Embed',
    postAccordion: 'Post Accordion',
  };

  return semanticMap[type];
}
