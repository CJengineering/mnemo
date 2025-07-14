'use client';

import { useState, useEffect } from 'react';

interface BucketFile {
  name: string;
  url: string;
  size?: number;
  timeCreated?: string;
  contentType?: string;
  isFolder?: boolean;
}

interface BucketResponse {
  success: boolean;
  files: BucketFile[];
  totalFiles: number;
  currentPrefix: string;
  error?: string;
}

export default function GoogleBucketExplorer() {
  const [files, setFiles] = useState<BucketFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [pathHistory, setPathHistory] = useState<string[]>(['']);

  const fetchFiles = async (prefix: string = '') => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🟢 Fetching files for prefix: "${prefix}"`);
      const url = `/api/bucket/list${prefix ? `?prefix=${encodeURIComponent(prefix)}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch bucket data: ${response.status}`);
      }

      const data: BucketResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch bucket data');
      }

      console.log(`🟢 Loaded ${data.files.length} items from bucket`);
      setFiles(data.files);
      setCurrentPath(prefix);
    } catch (err) {
      console.error('🔴 Error fetching bucket data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load bucket data'
      );
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folderPath: string) => {
    setPathHistory([...pathHistory, currentPath]);
    fetchFiles(folderPath);
  };

  const navigateBack = () => {
    if (pathHistory.length > 1) {
      const newHistory = [...pathHistory];
      const previousPath = newHistory.pop()!;
      setPathHistory(newHistory);
      fetchFiles(previousPath);
    }
  };

  const navigateToRoot = () => {
    setPathHistory(['']);
    fetchFiles('');
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (file: BucketFile): string => {
    if (file.isFolder) return '📁';

    const contentType = file.contentType?.toLowerCase() || '';
    const fileName = file.name.toLowerCase();

    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.startsWith('video/')) return '🎥';
    if (contentType.startsWith('audio/')) return '🎵';
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('zip') || contentType.includes('archive'))
      return '📦';
    if (fileName.endsWith('.txt') || fileName.endsWith('.md')) return '📝';
    if (fileName.endsWith('.json') || fileName.endsWith('.xml')) return '⚙️';

    return '📄';
  };

  const getDisplayName = (file: BucketFile): string => {
    if (file.isFolder) {
      // Remove the current path prefix and trailing slash
      let name = file.name;
      if (currentPath && name.startsWith(currentPath)) {
        name = name.substring(currentPath.length);
      }
      return name.replace(/\/$/, '');
    }

    // For files, show just the filename if we're in a folder
    if (currentPath && file.name.startsWith(currentPath)) {
      return file.name.substring(currentPath.length);
    }

    return file.name;
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading bucket contents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-600 text-xl mr-2">⚠️</span>
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Bucket</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={() => fetchFiles(currentPath)}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          📁 Google Cloud Storage Explorer
        </h2>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <button
            onClick={navigateToRoot}
            className="hover:text-blue-600 hover:underline"
          >
            🏠 Root
          </button>
          {currentPath && (
            <>
              <span>/</span>
              <span className="text-gray-800">
                {currentPath.replace(/\/$/, '')}
              </span>
            </>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex gap-2 mb-4">
          {pathHistory.length > 1 && (
            <button
              onClick={navigateBack}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
            >
              ← Back
            </button>
          )}
          <button
            onClick={() => fetchFiles(currentPath)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
        </div>

        <p className="text-gray-600">
          Bucket:{' '}
          <span className="font-mono bg-gray-100 px-2 py-1 rounded">mnemo</span>
          {files.length > 0 && (
            <span className="ml-4">
              {files.filter((f) => f.isFolder).length} folders,{' '}
              {files.filter((f) => !f.isFolder).length} files
            </span>
          )}
        </p>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <span className="text-4xl mb-4 block">📭</span>
          <p>This folder is empty</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className={`p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                file.isFolder ? 'cursor-pointer hover:border-blue-300' : ''
              }`}
              onClick={
                file.isFolder ? () => navigateToFolder(file.name) : undefined
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">
                    {getFileIcon(file)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {getDisplayName(file)}
                    </div>

                    {!file.isFolder && (
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        {file.size && <span>{formatFileSize(file.size)}</span>}
                        {file.contentType && (
                          <span className="font-mono bg-gray-100 px-1 rounded text-xs">
                            {file.contentType.split('/')[1] || file.contentType}
                          </span>
                        )}
                        {file.timeCreated && (
                          <span>
                            {new Date(file.timeCreated).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {!file.isFolder && file.url && (
                  <div className="flex space-x-2 ml-4">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(file.url);
                      }}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                    >
                      Copy URL
                    </button>
                  </div>
                )}

                {file.isFolder && <span className="text-gray-400 ml-4">→</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
