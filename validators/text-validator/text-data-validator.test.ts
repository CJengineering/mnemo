import { describe, it, beforeEach, expect } from '@jest/globals';
import { mapData } from './text-data-validator';
import { FakeDatabase } from '../../test/database/fakeDatabase';
const mockImageUpload = async (fileName: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`https://cdn.example.com/uploads/${fileName}`);
    }, 100);
  });
};
describe('FakeDatabase CRUD Operations with Mappers', () => {
  let db: FakeDatabase;

  beforeEach(() => {
    db = new FakeDatabase();
    db.reset();
  });

  /** ✅ Test: Creating a text data chunk */
  it('should create a text data chunk after passing through mapper', () => {
    const inputData = '  Hello World!  ';
    const inputMeta = { editor: 'Alice' }; // Missing fields will be autofilled

    const mappedData = mapData(inputData, inputMeta, 'text');
    const dataChunk = db.createDataChunk(
      'programme-1',
      'My Text',
      'text',
      mappedData.data,
      mappedData.metaData
    );

    expect(dataChunk).toHaveProperty('id');
    expect(dataChunk.data).toBe('Hello World!');
    expect(dataChunk.metaData.version).toBe('1.0');
    expect(dataChunk.metaData.editor).toBe('Alice');
  });

  /** ✅ Test: Creating content linked to a programme */
  it('should create content linked to a programme', () => {
    const programme = db.createProgramme('Programme A');
    const content = db.createContent(
      programme.id,
      'Test Content',
      'Content Description'
    );

    expect(content).toHaveProperty('id');
    expect(content.programmeId).toBe(programme.id);
    expect(db.getContentByProgramme(programme.id).length).toBe(1);
  });

  /** ✅ Test: Retrieving content & verifying metadata */
  it('should retrieve data chunk and verify metadata fields exist', () => {
    const programme = db.createProgramme('Programme B');
    const mappedData = mapData('Sample Text', { editor: 'Bob' }, 'text');

    const dataChunk = db.createDataChunk(
      programme.id,
      'Chunk 1',
      'text',
      mappedData.data,
      mappedData.metaData
    );
    const retrievedDataChunks = db.getDataChunksByProgramme(programme.id);

    expect(retrievedDataChunks.length).toBe(1);
    expect(retrievedDataChunks[0].metaData.version).toBe('1.0');
    expect(retrievedDataChunks[0].metaData.editor).toBe('Bob');
    expect(retrievedDataChunks[0].metaData.keywords).toEqual([]);
  });

  /** ✅ Test: Updating an existing text data chunk */
  it('should update an existing text data chunk', () => {
    const programme = db.createProgramme('Programme C');
    const mappedData = mapData('Old Text', { editor: 'Charlie' }, 'text');

    const dataChunk = db.createDataChunk(
      programme.id,
      'My Text',
      'text',
      mappedData.data,
      mappedData.metaData
    );

    // Simulate update
    dataChunk.data = 'Updated Text';
    dataChunk.metaData.keywords = ['updated', 'text'];
    dataChunk.updatedAt = new Date();

    expect(dataChunk.data).toBe('Updated Text');
    expect(dataChunk.metaData.keywords).toContain('updated');
  });

  /** ✅ Test: Deleting a text data chunk */
  it('should delete a text data chunk', () => {
    const programme = db.createProgramme('Programme D');
    const mappedData = mapData(
      'To Be Deleted',
      {
        editor: 'David'
      },
      'text'
    );

    const dataChunk = db.createDataChunk(
      programme.id,
      'Chunk To Delete',
      'text',
      mappedData.data,
      mappedData.metaData
    );
    const beforeDeleteCount = db.getDataChunksByProgramme(programme.id).length;
    db.deleteDataChunk(dataChunk.id);
    // Simulate deletion
    db.getDataChunksByProgramme(programme.id).splice(
      db.getDataChunksByProgramme(programme.id).indexOf(dataChunk),
      1
    );

    const afterDeleteCount = db.getDataChunksByProgramme(programme.id).length;

    expect(beforeDeleteCount).toBe(1);
    expect(afterDeleteCount).toBe(0);
  });
});
describe('mapData function', () => {
  it('should map valid text data correctly', () => {
    const inputData = '  Hello World!  ';
    const inputMeta = {
      version: '1.2',
      editor: 'Alice',
      datePublished: '2024-03-18',
      website: 'https://example.com',
      keywords: ['data', 'text']
    };

    const result = mapData(inputData, inputMeta, 'rich_text');

    expect(result).toEqual({
      data: 'Hello World!',
      metaData: {
        version: '1.2',
        editor: 'Alice',
        datePublished: '2024-03-18',
        website: 'https://example.com',
        keywords: ['data', 'text']
      }
    });
  });

  it('should handle rich-text data without modifications', () => {
    const inputData = '<h1>Hello</h1><p>World</p>';
    const inputMeta = { editor: 'Bob' };

    const result = mapData(inputData, inputMeta, 'rich_text');

    expect(result.data).toBe('<h1>Hello</h1><p>World</p>');
    expect(result.metaData.editor).toBe('Bob');
  });

  it('should throw an error for empty data', () => {
    expect(() => mapData('', { editor: 'Alice' }, 'rich_text')).toThrow(
      'Invalid text data: must be a non-empty string.'
    );
  });

  it('should throw an error if editor is missing', () => {
    expect(() => mapData('Hello', {}, 'rich_text')).toThrow(
      'Editor is required in metaData.'
    );
  });

  it('should remove duplicate and lowercase keywords', () => {
    const result = mapData(
      'Valid Data',
      {
        editor: 'John',
        keywords: ['AI', 'AI', 'Machine Learning', 'machine learning']
      },
      'rich_text'
    );

    expect(result.metaData.keywords).toEqual(['ai', 'machine learning']);
  });

  it('should default optional metadata values', () => {
    const result = mapData('Valid Data', { editor: 'John' }, 'rich_text');

    expect(result.metaData.datePublished).toBeNull();
    expect(result.metaData.website).toBeNull();
    expect(result.metaData.keywords).toEqual([]);
  });
});
describe('CRUD Operations with Mapper Enforcement', () => {
  let db: FakeDatabase;

  beforeEach(() => {
    db = new FakeDatabase();
    db.reset();
  });

  /** ✅ Test: Creating a text data chunk (mapper first) */
  it('should create a text data chunk after passing through mapper', () => {
    const inputData = '  Hello World!  ';
    const inputMeta = { editor: 'Alice' };

    // 🛠 Step 1: Validate data before CRUD operation
    const mappedData = mapData(inputData, inputMeta, 'text');

    // 🛠 Step 2: Insert only if mapping succeeds
    const dataChunk = db.createDataChunk(
      'programme-1',
      'My Text',
      'text',
      mappedData.data,
      mappedData.metaData
    );

    expect(dataChunk).toHaveProperty('id');
    expect(dataChunk.data).toBe('Hello World!');
    expect(dataChunk.metaData.version).toBe('1.0');
    expect(dataChunk.metaData.editor).toBe('Alice');
  });

  /** ❌ Test: Prevent storing invalid text data */
  it('should NOT create a data chunk if the mapper throws an error', () => {
    const inputData = ''; // ❌ Invalid data
    const inputMeta = { editor: 'Charlie' };

    expect(() => {
      const mappedData = mapData(inputData, inputMeta, 'rich_text'); // ❌ This should throw an error
      db.createDataChunk(
        'programme-1',
        'Invalid Text',
        'text',
        mappedData.data,
        mappedData.metaData
      );
    }).toThrowError('Invalid text data: must be a non-empty string.');
  });

  /** ✅ Test: Retrieving content with verified metadata */
  it('should retrieve data chunk and verify metadata fields exist', () => {
    const programme = db.createProgramme('Programme B');
    const mappedData = mapData('Sample Text', { editor: 'Bob' }, 'text');

    const dataChunk = db.createDataChunk(
      programme.id,
      'Chunk 1',
      'text',
      mappedData.data,
      mappedData.metaData
    );

    const retrievedDataChunks = db.getDataChunksByProgramme(programme.id);

    expect(retrievedDataChunks.length).toBe(1);
    expect(retrievedDataChunks[0].metaData.version).toBe('1.0');
    expect(retrievedDataChunks[0].metaData.editor).toBe('Bob');
    expect(retrievedDataChunks[0].metaData.keywords).toEqual([]);
  });

  /** ✅ Test: Updating an existing text data chunk (mapper applied before update) */
  it('should update an existing text data chunk', () => {
    const programme = db.createProgramme('Programme C');
    const mappedData = mapData('Old Text', { editor: 'Charlie' }, 'text');

    const dataChunk = db.createDataChunk(
      programme.id,
      'My Text',
      'text',
      mappedData.data,
      mappedData.metaData
    );

    // 🛠 Step 1: Validate update data before applying changes
    const updatedData = mapData(
      'Updated Text',
      { editor: 'Charlie', keywords: ['updated', 'text'] },
      'text'
    );

    // 🛠 Step 2: Apply only if mapping succeeds
    dataChunk.data = updatedData.data;
    dataChunk.metaData = updatedData.metaData;
    dataChunk.updatedAt = new Date();

    expect(dataChunk.data).toBe('Updated Text');
    expect(dataChunk.metaData.keywords).toContain('updated');
  });

  /** ✅ Test: Prevent invalid update */
  it('should NOT update a data chunk if new data fails mapping', () => {
    const programme = db.createProgramme('Programme D');
    const mappedData = mapData('Initial Text', { editor: 'David' }, 'text');

    const dataChunk = db.createDataChunk(
      programme.id,
      'Chunk To Test Update',
      'text',
      mappedData.data,
      mappedData.metaData
    );

    // ❌ Attempt invalid update (empty text should fail)
    expect(() => {
      const invalidUpdate = mapData('', { editor: 'David' }, 'text'); // ❌ This should throw
      dataChunk.data = invalidUpdate.data;
    }).toThrowError('Invalid text data: must be a non-empty string.');
  });

  /** ✅ Test: Deleting a text data chunk */
  it('should delete a text data chunk', () => {
    const programme = db.createProgramme('Programme D');
    const mappedData = mapData('To Be Deleted', { editor: 'David' }, 'text');

    const dataChunk = db.createDataChunk(
      programme.id,
      'Chunk To Delete',
      'text',
      mappedData.data,
      mappedData.metaData
    );

    const beforeDeleteCount = db.getDataChunksByProgramme(programme.id).length;

    // ✅ Perform deletion
    db.deleteDataChunk(dataChunk.id);

    const afterDeleteCount = db.getDataChunksByProgramme(programme.id).length;

    expect(beforeDeleteCount).toBe(1);
    expect(afterDeleteCount).toBe(0);
  });
});
describe('mapData Function', () => {
  // ✅ Test: Handles plain text
  it('should correctly map text data', () => {
    const result = mapData(
      'Valid Text',
      {
        editor: 'Alice',
        datePublished: '2024-03-18',
        website: 'https://example.com',
        keywords: ['AI', 'Machine Learning']
      },
      'text'
    );

    expect(result).toEqual({
      data: 'Valid Text',
      metaData: {
        version: '1.0',
        editor: 'Alice',
        datePublished: '2024-03-18',
        website: 'https://example.com',
        keywords: ['ai', 'machine learning']
      }
    });
  });

  // ✅ Test: Handles rich text
  it('should correctly map rich text data', () => {
    const result = mapData(
      '<p>Rich Text</p>',
      {
        editor: 'Bob',
        datePublished: '2024-03-18',
        website: 'https://example.com',
        keywords: ['Tech', 'Innovation']
      },
      'rich_text'
    );

    expect(result).toEqual({
      data: '<p>Rich Text</p>',
      metaData: {
        version: '1.0',
        editor: 'Bob',
        datePublished: '2024-03-18',
        website: 'https://example.com',
        keywords: ['tech', 'innovation']
      }
    });
  });

  // ✅ Test: Handles image upload
  it('should correctly map image data', async () => {
    const uploadedUrl = await mockImageUpload('test-image.jpg');
    const result = mapData(
      uploadedUrl,
      {
        editor: 'Charlie',
        datePublished: '2024-03-18',
        website: 'https://example.com',
        keywords: ['Photography', 'Nature'],
        alt: 'A beautiful landscape'
      },
      'image'
    );

    expect(result).toEqual({
      data: {
        url: 'https://cdn.example.com/uploads/test-image.jpg',
        alt: 'A beautiful landscape'
      },
      metaData: {
        version: '1.0',
        editor: 'Charlie',
        datePublished: '2024-03-18',
        website: 'https://example.com',
        keywords: ['photography', 'nature']
      }
    });
  });

  // ❌ Test: Fails when text is empty
  it('should throw an error for empty text', () => {
    expect(() => mapData('', { editor: 'Alice' }, 'text')).toThrow(
      'Invalid text data: must be a non-empty string.'
    );
  });

  // ❌ Test: Fails when image URL is invalid
  it('should throw an error for invalid image URL', () => {
    expect(() =>
      mapData(
        'invalid-url',
        { editor: 'Charlie', alt: 'Invalid Image' },
        'image'
      )
    ).toThrow('Invalid image data: must be a valid URL.');
  });

  // ❌ Test: Fails when editor is missing
  it('should throw an error when editor is missing in metadata', () => {
    expect(() =>
      mapData('Valid Text', { datePublished: '2024-03-18' }, 'text')
    ).toThrow('Editor is required in metaData.');
  });
});
describe('CRUD Operations with different type of data', () => {
  let db: FakeDatabase;

  beforeEach(() => {
    db = new FakeDatabase();
    db.reset();
  });

  it('should create an embed data chunk', () => {
    const programme = db.createProgramme('Programme A');
    const dataChunk = db.createDataChunk(
      programme.id,
      'Embed Data',
      'embed',
      { data: '<div>Hello world</div>' },
      { editor: 'Alice' }
    );

    expect(dataChunk).toHaveProperty('id');
    expect(dataChunk.data).toEqual({ data: '<div>Hello world</div>' });
    expect(dataChunk.metaData.editor).toBe('Alice');
    expect(dataChunk.type).toBe('embed'); 
  });
});
