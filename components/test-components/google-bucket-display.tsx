import { useState, useEffect } from "react";

interface FileItem {
  name: string;
  url: string;
}

interface FolderTree {
  [key: string]: FolderTree | FileItem;
}

export default function GoogleBucketExplorer() {
  const [folderTree, setFolderTree] = useState<FolderTree>({});

  useEffect(() => {
    // Simulated API response
    const response = {
      files: [
        { name: "1741790032106-chbika3.jpg", url: "http://cdn.communityjameel.io/1741790032106-chbika3.jpg" },
        { name: "1741858299678-chbika3.jpg", url: "http://cdn.communityjameel.io/1741858299678-chbika3.jpg" },
        { name: "countries/1741881833533-BRUVS_MODEL_BLURRED.webp", url: "http://cdn.communityjameel.io/countries/1741881833533-BRUVS_MODEL_BLURRED.webp" },
        { name: "countries/_combined/world.json", url: "http://cdn.communityjameel.io/countries/_combined/world.json" },
        { name: "countries/africa/egypt.png", url: "http://cdn.communityjameel.io/countries/africa/egypt.png" },
        { name: "countries/africa/morocco.png", url: "http://cdn.communityjameel.io/countries/africa/morocco.png" },
      ],
    };

    const buildTree = (files: FileItem[]) => {
      const root: FolderTree = {};

      files.forEach((file) => {
        const parts = file.name.split("/");
        let currentLevel: FolderTree = root;

        parts.forEach((part, index) => {
          if (index === parts.length - 1) {
            currentLevel[part] = file; // Last part is the file itself
          } else {
            if (!currentLevel[part]) {
              currentLevel[part] = {}; // Create folder if not exists
            }
            currentLevel = currentLevel[part] as FolderTree;
          }
        });
      });

      return root;
    };

    setFolderTree(buildTree(response.files));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Google Bucket Explorer</h2>
      <FolderView tree={folderTree} />
    </div>
  );
}

const FolderView = ({ tree, level = 0 }: { tree: FolderTree; level?: number }) => {
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});

  const toggleFolder = (folder: string) => {
    setExpanded((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  return (
    <ul className={`ml-${level * 4} space-y-2`}>
      {Object.entries(tree).map(([key, value]) => (
        <li key={key}>
          {typeof value === "object" && !("url" in value) ? (
            // Folder
            <div>
              <button
                className="font-medium text-blue-500"
                onClick={() => toggleFolder(key)}
              >
                {expanded[key] ? "📂" : "📁"} {key}
              </button>
              {expanded[key] && <FolderView tree={value} level={level + 1} />}
            </div>
          ) : (
            // File
            <div className="ml-4 flex items-center space-x-2">
              {key.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                <img
                  src={(value as FileItem).url}
                  alt={key}
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <a href={(value as FileItem).url} target="_blank" className="text-gray-700 underline">
                  📄 {key}
                </a>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};
