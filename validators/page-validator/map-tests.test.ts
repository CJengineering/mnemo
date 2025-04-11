
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
});
