import { Collection } from './types';

export const mockCollections: Collection[] = [
  {
    id: 'news',
    name: 'News',
    items: [
      {
        id: 'news-1',
        title: 'Company Launches New Product',
        description:
          'Our company has launched an exciting new product that will revolutionize the industry.',
        date: '2023-04-15',
        status: 'published'
      },
      {
        id: 'news-2',
        title: 'Quarterly Results Announced',
        description:
          'The company has announced its quarterly results, exceeding market expectations.',
        date: '2023-03-30',
        status: 'published'
      },
      {
        id: 'news-3',
        title: 'New Office Opening',
        description:
          "We're excited to announce the opening of our new office in downtown.",
        date: '2023-05-10',
        status: 'draft'
      }
    ]
  },
  {
    id: 'posts',
    name: 'Posts',
    items: [
      {
        id: 'post-1',
        title: '10 Tips for Better Productivity',
        description:
          'Learn how to improve your productivity with these simple tips and tricks.',
        date: '2023-04-05',
        status: 'published'
      },
      {
        id: 'post-2',
        title: 'The Future of Web Development',
        description:
          'Exploring the trends and technologies that will shape the future of web development.',
        date: '2023-03-22',
        status: 'published'
      },
      {
        id: 'post-3',
        title: 'Getting Started with TypeScript',
        description:
          "A beginner's guide to TypeScript and how it can improve your JavaScript projects.",
        date: '2023-04-18',
        status: 'draft'
      }
    ]
  },
  {
    id: 'events',
    name: 'Events',
    items: [
      {
        id: 'event-1',
        title: 'Annual Conference 2023',
        description:
          'Join us for our annual conference featuring industry experts and networking opportunities.',
        date: '2023-06-15',
        status: 'published'
      },
      {
        id: 'event-2',
        title: 'Developer Workshop',
        description:
          'A hands-on workshop for developers to learn new skills and techniques.',
        date: '2023-05-20',
        status: 'published'
      },
      {
        id: 'event-3',
        title: 'Product Demo Webinar',
        description:
          'Join our product team for a live demonstration of our latest features.',
        date: '2023-05-05',
        status: 'draft'
      }
    ]
  }
];
