'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { DataChunk, Page, Programme } from './type';

const BASE_URL = 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app/';

interface MnemoContextType {
  dataChunks: DataChunk[];
  pages: Page[];
  programmes: Programme[];
  refreshAll: () => void;
}

const MnemoContext = createContext<MnemoContextType | undefined>(undefined);

export const MnemoProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [dataChunks, setDataChunks] = useState<DataChunk[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);

  const fetchDataChunks = async () => {
    const res = await fetch(`${BASE_URL}/data-chunks`);
    console.log('Fetching data chunks from:', `${BASE_URL}/data-chunks`);
    if (!res.ok) throw new Error('Failed to fetch data chunks');
    const json = await res.json();
    setDataChunks(json.dataChunks);
  };

  const fetchPages = async () => {
    const res = await fetch(`${BASE_URL}/pages`);
    if (!res.ok) throw new Error('Failed to fetch pages');
    const json = await res.json();
    setPages(json.pages);
  };

  const fetchProgrammes = async () => {
    const res = await fetch(`${BASE_URL}/collection-items?type=programme`);
    if (!res.ok) throw new Error('Failed to fetch programmes');
    const json = await res.json();
    // Transform collection items to match expected programme format
    const programmes =
      json.collectionItems?.map((item: any) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        status: item.status,
        ...item.data
      })) || [];
    setProgrammes(programmes);
  };

  const refreshAll = async () => {
    try {
      await Promise.all([fetchDataChunks(), fetchPages(), fetchProgrammes()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  return (
    <MnemoContext.Provider
      value={{ dataChunks, pages, programmes, refreshAll }}
    >
      {children}
    </MnemoContext.Provider>
  );
};

export const useMnemo = (): MnemoContextType => {
  const context = useContext(MnemoContext);
  if (!context) {
    throw new Error('useMnemo must be used within a MnemoProvider');
  }
  return context;
};
