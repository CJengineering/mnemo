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
  const [uploading, setUploading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Large upload state
  const [largeUploading, setLargeUploading] = useState(false);
  const [largeUploadProgress, setLargeUploadProgress] = useState<number>(0);

  // Feedback state for Copy URL action
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

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

  const sanitizeFileName = (name: string) =>
    name
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.-]/g, '')
      .toLowerCase();

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('prefix', currentPath);

      console.log(`📤 Uploading ${file.name} to folder: "${currentPath}"`);

      const response = await fetch('/api/bucket/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      console.log('✅ File uploaded successfully:', result.file);

      // Refresh the current folder to show the new file
      await fetchFiles(currentPath);

      // Clear the input
      event.target.value = '';
    } catch (err) {
      console.error('🔴 Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Large file upload via GCS resumable session
  const handleLargeFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Optional client-side threshold guard
    if (file.size < 5 * 1024 * 1024) {
      console.log('ℹ️ Small file detected; consider using standard Upload.');
    }

    const sanitized = sanitizeFileName(file.name);
    const fullPath = currentPath ? `${currentPath}${sanitized}` : sanitized;

    try {
      setLargeUploading(true);
      setLargeUploadProgress(0);
      setError(null);

      // 1) Request a resumable session
      const startRes = await fetch('/api/bucket/start-resumable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: fullPath,
          contentType: file.type || 'application/octet-stream'
        })
      });

      if (!startRes.ok) {
        throw new Error(`Failed to start resumable upload: ${startRes.status}`);
      }

      const { success, uploadUrl, error: errMsg } = await startRes.json();
      if (!success || !uploadUrl) {
        throw new Error(errMsg || 'Could not get upload URL');
      }

      console.log('🔗 Resumable session URL acquired');

      // 2) Upload the file directly to GCS via the resumable URL
      // Use XHR to track progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader(
          'Content-Type',
          file.type || 'application/octet-stream'
        );
        // Full upload in one go: Content-Range header
        xhr.setRequestHeader(
          'Content-Range',
          `bytes 0-${file.size - 1}/${file.size}`
        );

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setLargeUploadProgress(pct);
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.onload = () => {
          // GCS returns 200 or 201 when the resumable upload completes
          if (xhr.status === 200 || xhr.status === 201) {
            resolve();
          } else if (xhr.status === 308) {
            // Incomplete; should not happen for single-shot upload
            setLargeUploadProgress(99);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.send(file);
      });

      console.log('✅ Large file uploaded successfully');

      // 3) Refresh listing
      await fetchFiles(currentPath);

      // Clear the input
      event.target.value = '';
    } catch (err) {
      console.error('🔴 Large upload error:', err);
      setError(err instanceof Error ? err.message : 'Large file upload failed');
    } finally {
      setLargeUploading(false);
      setLargeUploadProgress(0);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Please enter a folder name');
      return;
    }

    // Validate folder name (no special characters except dash and underscore)
    const validFolderName = /^[a-zA-Z0-9_-]+$/.test(newFolderName.trim());
    if (!validFolderName) {
      setError(
        'Folder name can only contain letters, numbers, dashes, and underscores'
      );
      return;
    }

    try {
      setCreatingFolder(true);
      setError(null);

      // Create the full folder path
      const folderPath = currentPath
        ? `${currentPath}${newFolderName.trim()}/`
        : `${newFolderName.trim()}/`;

      console.log(`📁 Creating folder: "${folderPath}"`);

      const response = await fetch('/api/bucket/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          folderPath: folderPath
        })
      });

      if (!response.ok) {
        throw new Error(`Create folder failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Create folder failed');
      }

      console.log('✅ Folder created successfully:', result);

      // Clear the input and hide the form
      setNewFolderName('');
      setShowFolderInput(false);

      // Refresh the current folder to show the new folder
      await fetchFiles(currentPath);
    } catch (err) {
      console.error('🔴 Create folder error:', err);
      setError(err instanceof Error ? err.message : 'Create folder failed');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDelete = async (file: BucketFile) => {
    const itemType = file.isFolder ? 'folder' : 'file';
    const itemName = getDisplayName(file);

    // Show confirmation alert
    const confirmed = window.confirm(
      `⚠️ Are you sure you want to delete this ${itemType}?\n\n"${itemName}"\n\n${
        file.isFolder
          ? 'This will delete ALL files inside this folder. This action cannot be undone!'
          : 'This action cannot be undone!'
      }`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(file.name);
      setError(null);

      console.log(`🗑️ Deleting ${itemType}: ${file.name}`);

      const response = await fetch(
        `/api/bucket/delete?path=${encodeURIComponent(file.name)}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Delete failed');
      }

      console.log(`✅ ${itemType} deleted successfully:`, result);

      // Refresh the current folder to remove the deleted item
      await fetchFiles(currentPath);
    } catch (err) {
      console.error('🔴 Delete error:', err);
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleteLoading(null);
    }
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
              {/* Render clickable segments for each folder level */}
              {(() => {
                const trimmed = currentPath.replace(/\/$/, '');
                const segments = trimmed.split('/').filter(Boolean);
                return segments.map((seg, idx) => {
                  const prefix = segments.slice(0, idx + 1).join('/') + '/';
                  const isLast = idx === segments.length - 1;
                  return (
                    <span
                      key={`${prefix}-${idx}`}
                      className="flex items-center gap-2"
                    >
                      <span>/</span>
                      {isLast ? (
                        <span className="text-gray-800">{seg}</span>
                      ) : (
                        <button
                          onClick={() => navigateToFolder(prefix)}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {seg}
                        </button>
                      )}
                    </span>
                  );
                });
              })()}
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

          {/* Upload Button */}
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading || largeUploading}
            />
            <label
              htmlFor="file-upload"
              className={`px-3 py-1 text-sm rounded cursor-pointer transition-colors ${
                uploading || largeUploading
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {uploading ? '⏳ Uploading...' : '📤 Upload File'}
            </label>
          </div>

          {/* Upload Large File Button */}
          <div className="relative">
            <input
              type="file"
              id="large-file-upload"
              className="hidden"
              onChange={handleLargeFileUpload}
              disabled={largeUploading || uploading}
            />
            <label
              htmlFor="large-file-upload"
              className={`px-3 py-1 text-sm rounded cursor-pointer transition-colors ${
                largeUploading || uploading
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              {largeUploading
                ? `⏳ Uploading... ${largeUploadProgress}%`
                : '📦 Upload Large File'}
            </label>
          </div>

          {/* Create Folder Button */}
          <button
            onClick={() => setShowFolderInput(!showFolderInput)}
            disabled={creatingFolder}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              creatingFolder
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {creatingFolder ? '⏳ Creating...' : '📁 Add Folder'}
          </button>
        </div>

        {/* Optional hint for large uploads */}
        <p className="text-xs text-gray-500 -mt-2 mb-2">
          Tip: Use "Upload Large File" for files bigger than ~5 MB (uploads
          directly to GCS)
        </p>

        {/* Create Folder Input */}
        {showFolderInput && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <h3 className="text-purple-800 font-medium mb-2">
              Create New Folder
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => {
                  setNewFolderName(e.target.value);
                  // Clear any existing error when user starts typing
                  if (error) setError(null);
                }}
                placeholder="Enter folder name..."
                className="flex-1 px-3 py-2 border border-purple-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
                disabled={creatingFolder}
              />
              <button
                onClick={handleCreateFolder}
                disabled={creatingFolder || !newFolderName.trim()}
                className={`px-4 py-2 text-sm rounded transition-colors ${
                  creatingFolder || !newFolderName.trim()
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowFolderInput(false);
                  setNewFolderName('');
                }}
                disabled={creatingFolder}
                className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-purple-600 mt-2">
              📁 Folder will be created in:{' '}
              <span className="font-mono bg-purple-100 px-1 rounded">
                {currentPath || '/'}
              </span>
            </p>
            <p className="text-xs text-purple-500 mt-1">
              Only letters, numbers, dashes (-), and underscores (_) are allowed
            </p>
          </div>
        )}

        {/* Current Path Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">📁 Current folder:</span>{' '}
            <span className="font-mono bg-blue-100 px-2 py-1 rounded">
              {currentPath || '/'}
            </span>
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Files uploaded here will be saved to this folder
          </p>
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
              className={`p-3 border rounded-lg hover:bg-gray-50 transition-colors overflow-hidden ${
                file.isFolder ? 'cursor-pointer hover:border-blue-300' : ''
              }`}
              onClick={
                file.isFolder ? () => navigateToFolder(file.name) : undefined
              }
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">
                    {getFileIcon(file)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div
                      className="font-medium text-gray-900 truncate w-full"
                      title={getDisplayName(file)}
                    >
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
                  <div className="flex space-x-2 ml-4 flex-none whitespace-nowrap">
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
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await navigator.clipboard.writeText(file.url);
                          setCopiedFile(file.name);
                          setTimeout(() => setCopiedFile(null), 1500);
                        } catch (err) {
                          console.error('Copy URL failed', err);
                        }
                      }}
                      className={`px-3 py-1 text-white text-sm rounded transition-colors ${
                        copiedFile === file.name
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-gray-600 hover:bg-gray-700'
                      }`}
                      title={
                        copiedFile === file.name
                          ? 'Copied!'
                          : 'Copy URL to clipboard'
                      }
                    >
                      {copiedFile === file.name ? '✓ Copied' : 'Copy URL'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file);
                      }}
                      disabled={deleteLoading === file.name}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        deleteLoading === file.name
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {deleteLoading === file.name ? '⏳' : '🗑️'} Delete
                    </button>
                  </div>
                )}

                {file.isFolder && (
                  <div className="flex items-center space-x-2 ml-4 flex-none whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file);
                      }}
                      disabled={deleteLoading === file.name}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        deleteLoading === file.name
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {deleteLoading === file.name ? '⏳' : '🗑️'} Delete
                    </button>
                    <span className="text-gray-400">→</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
