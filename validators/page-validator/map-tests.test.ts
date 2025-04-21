import { FakeDatabase } from '../../test/database/fakeDatabase';
import { mapData } from './mapData';

describe('validate form data and assign to page.data', () => {
  let db: FakeDatabase;

  beforeEach(() => {
    db = new FakeDatabase();
    db.reset();
  });

  it('should validate DroppedItem[] and assign to page.data', () => {
    const formInput = [
      {
        id: 'block-1',
        type: 'p',
        content: 'This is valid content'
      }
    ];

    const validated = mapData(formInput); // ✅ This checks the structure

    const page = db.createPage('test-page');

    // ✅ Assign validated data to the page
    page.data = validated;

    expect(page.data.length).toBe(1);
    expect(page.data[0].type).toBe('p');
    expect(page.data[0].content).toBe('This is valid content');
  });

  it('should throw error if form input is not a valid DroppedItem[]', () => {
    const invalidInput = [
      {
        id: 'block-2',
        type: 'p'
        // missing `content`
      }
    ];

    db.createPage('test-page');

    expect(() => {
      const validated = mapData(invalidInput); // ❌ This should throw
      db.getPageBySlug('test-page')!.data = validated; // never runs
    }).toThrow('mapData validation failed');
  });

  it('should validate postAccordion type and preserve children', () => {
    const accordionInput = [
      {
        id: 'puLsAxzVicSnFQuiPf2Nf',
        type: 'postAccordion',
        content: 'Accordion Title',
        children: [
          { id: '77d6fb9c-3d20-41c8-aa53-4499718e5c70', type: 'p', content: 'Test data real' }
        ]
      }
    ];

    const validated = mapData(accordionInput); // ✅ Ensure children are passed

    const page = db.createPage('test-page');

    // ✅ Assign validated data to the page
    page.data = validated;

    expect(page.data.length).toBe(1); // Only 1 accordion block
    expect(page.data[0].type).toBe('postAccordion');
    expect(page.data[0].content).toBe('Accordion Title');
    expect(page.data[0].children).toHaveLength(1); // Ensure children are there
    expect(page.data[0].children?.[0]?.type).toBe('p');
    expect(page.data[0].children?.[0]?.content).toBe('Test data real');
  });

  
});
