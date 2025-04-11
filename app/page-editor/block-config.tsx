// import PostAccordion from "./PostAccordion";
// import { BlockDefinition, BlockType, DroppedItem } from "./type";

// function getTextFormattingClass(format?: DroppedItem['format']) {
//   return [
//     format?.bold && 'font-bold',
//     format?.italic && 'italic',
//     format?.underline && 'underline'
//   ]
//     .filter(Boolean)
//     .join(' ');
// }
// function getLinkAttrs(isExternal: boolean) {
//   return {
//     target: isExternal ? '_blank' : '_self',
//     rel: isExternal ? 'noopener noreferrer' : undefined
//   };
// }

// export const BLOCKS_CONFIG: Record<BlockType, BlockDefinition> = {
//     h1: {
//       render: (item) => <h1 className="text-2xl">{item.content}</h1>,
//       overlay: (item) => <div className="text-2xl font-bold">{item.content}</div>
//     },
//     h2: {
//       render: (item) => <h2 className="text-xl">{item.content}</h2>,
//       overlay: (item) => <div className="text-xl">{item.content}</div>
//     },
//     h3: {
//       render: (item) => <h3 className="text-lg">{item.content}</h3>,
//       overlay: (item) => <div className="text-lg">{item.content}</div>
//     },
//     h4: {
//       render: (item) => <h4 className="text-base">{item.content}</h4>,
//       overlay: (item) => <div className="text-base">{item.content}</div>
//     },
//     h5: {
//       render: (item) => <h5 className="text-sm">{item.content}</h5>,
//       overlay: (item) => <div className="text-sm">{item.content}</div>
//     },
//     h6: {
//       render: (item) => <h6 className="text-xs">{item.content}</h6>,
//       overlay: (item) => <div className="text-xs">{item.content}</div>
//     },
//     p: {
//       render: (item) => <p className={getTextFormattingClass(item.format)}>{item.content}</p>,
//       overlay: (item) => <div>{item.content}</div>
//     },
//     embed: {
//       render: (item, mode) => (
//         <div
//           className="w-full"
//           dangerouslySetInnerHTML={{ __html: item.content }}
//         />
//       ),
//       overlay: () => (
//         <div className="text-xs text-gray-400 italic">Embed Block</div>
//       )
//     },
//     postAccordion: {
//       render: (item) => (
//         <PostAccordion title={item.content}>
//           {item.children?.map((child, index) => (
//             <div key={index}>
//               {BLOCKS_CONFIG[child.type].render(child, "preview")}
//             </div>
//           ))}
//         </PostAccordion>
//       ),
//       overlay: (item) => <div className="text-sm italic">Accordion block</div>,
//     },
//     video: {
//       render: (item) => (
//         <video controls src={item.content} className="rounded w-full max-w-full">
//           Your browser does not support the video tag.
//         </video>
//       ),
//       overlay: (item) => (
//         <div className="text-sm text-gray-500 italic">
//           Video URL: {item.content}
//         </div>
//       )
//     },
//     'rich-text': {
//       render: (item, mode) => (
//         <div
//           className="prose"
//           dangerouslySetInnerHTML={{ __html: item.content }}
//         />
//       ),
//       overlay: () => (
//         <div className="text-xs text-gray-400 italic">Rich Text Block</div>
//       )
//     },
//     link: {
//       render: (item) => {
//         const { url, isExternal } = item.button || { url: '#', isExternal: false };

//         return (
//           <a
//             href={url}
//             {...getLinkAttrs(isExternal)} // 👈 cleaner here
//             className="text-blue-600 underline hover:text-blue-800"
//           >
//             {item.content}
//           </a>
//         );
//       },
//       overlay: (item) => (
//         <span className="text-blue-600 underline">
//           {item.button?.url ?? 'Link'}
//         </span>
//       )
//     },
//     img: {
//       render: (item) => (
//         <img
//           src={item.image?.src}
//           alt={item.image?.alt}
//           width={item.image?.width}
//           height={item.image?.height}
//           className="rounded"
//         />
//       ),
//       overlay: (item) => (
//         <div>
//           {item.image ? (
//             <img
//               src={item.image.src}
//               alt={item.image.alt}
//               width={item.image.width}
//               height={item.image.height}
//               className="rounded"
//             />
//           ) : (
//             <span>No image available</span>
//           )}
//         </div>
//       )
//     },
//     button: {
//       render: (item) => {
//         const { url, isExternal } = item.button || {
//           url: '#',
//           isExternal: false
//         };
//         return (
//           <a
//             href={url}
//             target={isExternal ? '_blank' : '_self'}
//             rel={isExternal ? 'noopener noreferrer' : undefined}
//             className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//           >
//             {item.content}
//           </a>
//         );
//       },
//       overlay: (item) => (
//         <div className="bg-blue-600 text-white px-2 py-1 rounded">
//           {item.button?.url || 'No link'}
//         </div>
//       )
//     },
//     ul: {
//       render: (item) => {
//         const lines = item.content.split('\n');
//         const ListTag = item.listType === 'numbered' ? 'ol' : 'ul';

//         return (
//           <ListTag
//             className={
//               item.listType === 'numbered'
//                 ? 'list-decimal'
//                 : 'list-disc' + ' pl-6 space-y-1'
//             }
//           >
//             {lines.map((line, index) => (
//               <li key={index}>{line}</li>
//             ))}
//           </ListTag>
//         );
//       },
//       overlay: (item) => (
//         <div className="text-sm">
//           {(item.content ?? '').split('\n').map((line, index) => (
//             <div key={index}>• {line}</div>
//           ))}
//         </div>
//       )
//     },
//     youtube: {
//       render: (item) => (
//         <div className="aspect-video w-full">
//           <iframe
//             src={`https://www.youtube.com/embed/${item.content}`}
//             className="w-full h-full rounded"
//             allowFullScreen
//           ></iframe>
//         </div>
//       ),
//       overlay: (item) => <div className="text-sm">YouTube: {item.content}</div>
//     }
//   };


import { AccordionDroppable } from './droppable-accordion';
import { PostAccordion } from '@cj-tech/shared-blocks';
import { DroppedItem } from './type';
import { BlockDefinition, BlockType } from './type';

function getTextFormattingClass(format?: DroppedItem['format']) {
  return [
    format?.bold && 'font-bold',
    format?.italic && 'italic',
    format?.underline && 'underline'
  ]
    .filter(Boolean)
    .join(' ');
}
function getLinkAttrs(isExternal: boolean) {
  return {
    target: isExternal ? '_blank' : '_self',
    rel: isExternal ? 'noopener noreferrer' : undefined
  };
}

export const BLOCKS_CONFIG: Record<BlockType, BlockDefinition> = {
  h1: {
    render: (item) => <h1 className="text-2xl">{item.content}</h1>,
    overlay: (item) => <div className="text-2xl font-bold">{item.content}</div>
  },
  h2: {
    render: (item) => <h2 className="text-xl">{item.content}</h2>,
    overlay: (item) => <div className="text-xl">{item.content}</div>
  },
  h3: {
    render: (item) => <h3 className="text-lg">{item.content}</h3>,
    overlay: (item) => <div className="text-lg">{item.content}</div>
  },
  h4: {
    render: (item) => <h4 className="text-base">{item.content}</h4>,
    overlay: (item) => <div className="text-base">{item.content}</div>
  },
  h5: {
    render: (item) => <h5 className="text-sm">{item.content}</h5>,
    overlay: (item) => <div className="text-sm">{item.content}</div>
  },
  h6: {
    render: (item) => <h6 className="text-xs">{item.content}</h6>,
    overlay: (item) => <div className="text-xs">{item.content}</div>
  },
  p: {
    render: (item) => (
      <p className={getTextFormattingClass(item.format)}>{item.content}</p>
    ),
    overlay: (item) => <div>{item.content}</div>
  },
  embed: {
    render: (item, mode) => (
      <div
        className="w-full"
        dangerouslySetInnerHTML={{ __html: item.content }}
      />
    ),
    overlay: () => (
      <div className="text-xs text-gray-400 italic">Embed Block</div>
    )
  },
  video: {
    render: (item) => (
      <video controls src={item.content} className="rounded w-full max-w-full">
        Your browser does not support the video tag.
      </video>
    ),
    overlay: (item) => (
      <div className="text-sm text-gray-500 italic">
        Video URL: {item.content}
      </div>
    )
  },
  'rich-text': {
    render: (item, mode) => (
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: item.content }}
      />
    ),
    overlay: () => (
      <div className="text-xs text-gray-400 italic">Rich Text Block</div>
    )
  },
  link: {
    render: (item) => {
      const { url, isExternal } = item.button || {
        url: '#',
        isExternal: false
      };

      return (
        <a
          href={url}
          {...getLinkAttrs(isExternal)} // 👈 cleaner here
          className="text-blue-600 underline hover:text-blue-800"
        >
          {item.content}
        </a>
      );
    },
    overlay: (item) => (
      <span className="text-blue-600 underline">
        {item.button?.url ?? 'Link'}
      </span>
    )
  },
  img: {
    render: (item) => (
      <img
        src={item.image?.src}
        alt={item.image?.alt}
        width={item.image?.width}
        height={item.image?.height}
        className="rounded"
      />
    ),
    overlay: (item) => (
      <div>
        {item.image ? (
          <img
            src={item.image.src}
            alt={item.image.alt}
            width={item.image.width}
            height={item.image.height}
            className="rounded"
          />
        ) : (
          <span>No image available</span>
        )}
      </div>
    )
  },
  button: {
    render: (item) => {
      const { url, isExternal } = item.button || {
        url: '#',
        isExternal: false
      };
      return (
        <a
          href={url}
          target={isExternal ? '_blank' : '_self'}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {item.content}
        </a>
      );
    },
    overlay: (item) => (
      <div className="bg-blue-600 text-white px-2 py-1 rounded">
        {item.button?.url || 'No link'}
      </div>
    )
  },
  postAccordion: {
    render: (item, mode) => (
      <PostAccordion title={item.content}>
        <AccordionDroppable id={`accordion-${item.id}`}>
          <div className={item.containerType}>
            {item.children?.map((child, index) => (
              <div key={index}>
                {BLOCKS_CONFIG[child.type].render(child, 'preview')}
              </div>
            ))}
          </div>
        </AccordionDroppable>
      </PostAccordion>
    ),
    overlay: () => <div className="text-sm italic">Accordion Block</div>
  },
  ul: {
    render: (item) => {
      const lines = item.content.split('\n');
      const ListTag = item.listType === 'numbered' ? 'ol' : 'ul';

      return (
        <ListTag
          className={
            item.listType === 'numbered'
              ? 'list-decimal'
              : 'list-disc' + ' pl-6 space-y-1'
          }
        >
          {lines.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ListTag>
      );
    },
    overlay: (item) => (
      <div className="text-sm">
        {(item.content ?? '').split('\n').map((line, index) => (
          <div key={index}>• {line}</div>
        ))}
      </div>
    )
  },
  youtube: {
    render: (item) => (
      <div className="aspect-video w-full">
        <iframe
          src={`https://www.youtube.com/embed/${item.content}`}
          className="w-full h-full rounded"
          allowFullScreen
        ></iframe>
      </div>
    ),
    overlay: (item) => <div className="text-sm">YouTube: {item.content}</div>
  }
};
