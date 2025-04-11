export const TEXT_LIBRARY = [
  { id: 't1', content: 'Welcome to our site!', type: 'h1' },
  { id: 't2', content: 'About Us', type: 'h2' },
  { id: 't3', content: 'Contact us at hello@example.com', type: 'p' },
  { id: 't4', content: 'Services we offer', type: 'p' },
  { id: 't5', content: 'This is a paragraph example.', type: 'p' },
  {
    id: 't6',
    content: '',
    type: 'img',
    image: {
      src: 'https://storage.googleapis.com/mnemo/1741871489655-Canyon%20de%20Mide%CC%80s.webp',
      alt: 'image',
      width: 200,
      height: 200
    }
  },
  {
    id: 't7',
    content: 'First point\nSecond point\nThird point',
    type: 'ul'
  },
  {
    id: 't8',
    content: 'dQw4w9WgXcQ',
    type: 'youtube'
  },
  {
    id: 't9',
    type: 'button',
    content: 'Click Me',
    button: {
      url: '/about',
      isExternal: false
    }
  },
  {
    id: 't11',
    type: 'link',
    content: 'Go to Google',
    button: {
      url: 'https://google.com',
      isExternal: true
    }
  },
  {
    id: 't12',
    type: 'video',
    content: 'https://www.w3schools.com/html/mov_bbb.mp4' // 👈 video URL
  },
  {
    id: 't13',
    type: 'rich-text',
    content: '<p><strong>Hello</strong>, you can <em>edit</em> this!</p>'
  },
  {
    id: 't14',
    type: 'embed',
    content: `<iframe src="https://example.com" width="100%" height="300"></iframe>`
  },
  {
    id: 't15',
    type: 'embed',
    content: `
      <form action="https://httpbin.org/post" method="POST" class="space-y-2">
        <label class="block">
          Name:
          <input type="text" name="name" class="border px-2 py-1 rounded w-full" />
        </label>
        <label class="block">
          Email:
          <input type="email" name="email" class="border px-2 py-1 rounded w-full" />
        </label>
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Submit
        </button>
      </form>
    `
  }
];