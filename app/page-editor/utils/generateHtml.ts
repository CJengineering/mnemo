import { BLOCKS_CONFIG } from 'app/page-editor/block-config';
import { DroppedItem } from 'app/page-editor/type';
import { renderToString } from 'react-dom/server';

export function generateHtml(items: DroppedItem[]): string {
  return items
    .map((item) => {
      const rendered = BLOCKS_CONFIG[item.type].render(item, 'preview');
      return renderToString(rendered); // <- from 'react-dom/server'
    })
    .join('\n');
}
