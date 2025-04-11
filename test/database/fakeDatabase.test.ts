import { describe, it, beforeEach, expect } from '@jest/globals';
import { FakeDatabase } from './fakeDatabase';
import { DroppedItem } from 'app/page-editor/type';


const dummyBlock: DroppedItem = {
  id: 'block-1',
  type: 'p',
  content: 'Test block content'
};

describe('FakeDatabase CRUD Operations', () => {
  let db: FakeDatabase;

  beforeEach(() => {
    db = new FakeDatabase();
    db.reset();
  });

  it('should create a new programme', () => {
    const programme = db.createProgramme('Test Programme', 'Description', 'Short', 'TP');
    expect(programme).toHaveProperty('id');
    expect(programme.title).toBe('Test Programme');
    expect(db.getProgrammes().length).toBe(1);
  });

  it('should create content linked to a programme', () => {
    const programme = db.createProgramme('Programme A');
    const content = db.createContent(programme.id, 'Test Content', 'Content Description');

    expect(content).toHaveProperty('id');
    expect(content.programmeId).toBe(programme.id);
    expect(db.getContentByProgramme(programme.id).length).toBe(1);
  });

  it('should create data chunks linked to a programme', () => {
    const programme = db.createProgramme('Programme B');
    const dataChunk = db.createDataChunk(programme.id, 'Chunk A', 'text', { content: 'Hello world' });

    expect(dataChunk).toHaveProperty('id');
    expect(dataChunk.programmeId).toBe(programme.id);
    expect(db.getDataChunksByProgramme(programme.id).length).toBe(1);
  });

  it('should reset database correctly', () => {
    db.createProgramme('Programme C');
    db.createContent('1', 'Some Content');
    db.createDataChunk('1', 'Some Chunk', 'text', {});

    db.reset();
    expect(db.getProgrammes().length).toBe(0);
    expect(db.getContentByProgramme('1').length).toBe(0);
    expect(db.getDataChunksByProgramme('1').length).toBe(0);
  });

  it('should create a page with valid dataHtml and dataSeo', () => {
    const page = db.createPage(
      'programme/events',
      [dummyBlock],
      { rawHtml: '<h1>Hello</h1>' },
      {
        title: 'Programme Events',
        description: 'All about our programme',
        keywords: ['programme', 'events']
      }
    );

    expect(page).toHaveProperty('id');
    expect(page.slug).toBe('programme/events');
    expect(page.data).toEqual([dummyBlock]);
    expect(page.dataHtml).toEqual({ rawHtml: '<h1>Hello</h1>' });
    expect(page.dataSeo?.title).toBe('Programme Events');
    expect(page.dataSeo?.description).toBe('All about our programme');
    expect(page.dataSeo?.keywords).toContain('programme');
    expect(page.createdAt).toBeInstanceOf(Date);
    expect(page.updatedAt).toBeInstanceOf(Date);
  });

  it('should retrieve a page by slug', () => {
    db.createPage(
      'custom-page',
      [dummyBlock],
      { rawHtml: '<p>Hi</p>' },
      {
        title: 'Custom Page',
        description: 'Landing page for marketing',
        keywords: ['landing', 'marketing']
      }
    );

    const found = db.getPageBySlug('custom-page');

    expect(found).toBeDefined();
    expect(found && found.data && found.data[0]?.type).toBe('p');
    expect(found?.dataHtml?.rawHtml).toBe('<p>Hi</p>');
  });

  it('should create a unique slug if one already exists', () => {
    const p1 = db.createPage('programme/events');
    const p2 = db.createPage('programme/events');
    const p3 = db.createPage('programme/events');

    expect(p1.slug).toBe('programme/events');
    expect(p2.slug).toBe('programme/events-1');
    expect(p3.slug).toBe('programme/events-2');
  });

  it('should increment correctly even if slug ends in a number', () => {
    const p1 = db.createPage('programme/events-1');
    const p2 = db.createPage('programme/events-1');

    expect(p1.slug).toBe('programme/events-1');
    expect(p2.slug).toBe('programme/events-1-1');
  });
});
