import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './FileExplorer.css';

/**
 * FileExplorer component props
 */
interface FileExplorerProps {
  /**
   * Initial file tree data
   */
  initialFiles: FileNode[];
}

/**
 * File node type
 */
interface FileNode {
  /**
   * Unique file id
   */
  id: string;
  /**
   * File name
   */
  name: string;
  /**
   * File type (directory or file)
   */
  type: 'directory' | 'file';
  /**
   * Child files (if directory)
   */
  children?: FileNode[];
}

/**
 * FileExplorer component
 */
const FileExplorer: React.FC<FileExplorerProps> = ({ initialFiles }) => {
  /**
   * File tree state
   */
  const [files, setFiles] = useState<FileNode[]>(initialFiles);
  /**
   * Selected file state
   */
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  /**
   * Dragging file state
   */
  const [draggingFile, setDraggingFile] = useState<FileNode | null>(null);
  /**
   * Dropping file state
   */
  const [droppingFile, setDroppingFile] = useState<FileNode | null>(null);

  /**
   * Create new file
   */
  const createFile = (name: string, type: 'directory' | 'file', parent: FileNode | null) => {
    const newFile: FileNode = {
      id: uuidv4(),
      name,
      type,
      children: type === 'directory' ? [] : undefined,
    };
    if (parent) {
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(newFile);
    } else {
      setFiles([...files, newFile]);
    }
  };

  /**
   * Rename file
   */
  const renameFile = (file: FileNode, newName: string) => {
    const updatedFiles = [...files];
    const fileIndex = updatedFiles.findIndex((f) => f.id === file.id);
    if (fileIndex !== -1) {
      updatedFiles[fileIndex].name = newName;
    } else {
      const parent = findParentFile(files, file.id);
      if (parent) {
        const childIndex = parent.children?.findIndex((f) => f.id === file.id);
        if (childIndex !== -1 && parent.children) {
          parent.children[childIndex].name = newName;
        }
      }
    }
    setFiles(updatedFiles);
  };

  /**
   * Delete file
   */
  const deleteFile = (file: FileNode) => {
    const updatedFiles = [...files];
    const fileIndex = updatedFiles.findIndex((f) => f.id === file.id);
    if (fileIndex !== -1) {
      updatedFiles.splice(fileIndex, 1);
    } else {
      const parent = findParentFile(files, file.id);
      if (parent && parent.children) {
        const childIndex = parent.children.findIndex((f) => f.id === file.id);
        if (childIndex !== -1) {
          parent.children.splice(childIndex, 1);
        }
      }
    }
    setFiles(updatedFiles);
  };

  /**
   * Find parent file
   */
  const findParentFile = (files: FileNode[], fileId: string): FileNode | null => {
    for (const file of files) {
      if (file.children) {
        const child = file.children.find((f) => f.id === fileId);
        if (child) {
          return file;
        }
        const parent = findParentFile(file.children, fileId);
        if (parent) {
          return parent;
        }
      }
    }
    return null;
  };

  /**
   * Handle drag start
   */
  const handleDragStart = (event: React.DragEvent, file: FileNode) => {
    setDraggingFile(file);
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (event: React.DragEvent, file: FileNode) => {
    event.preventDefault();
    setDroppingFile(file);
  };

  /**
   * Handle drop
   */
  const handleDrop = (event: React.DragEvent, file: FileNode) => {
    event.preventDefault();
    if (draggingFile && droppingFile) {
      const updatedFiles = [...files];
      const draggingFileIndex = updatedFiles.findIndex((f) => f.id === draggingFile.id);
      if (draggingFileIndex !== -1) {
        updatedFiles.splice(draggingFileIndex, 1);
      } else {
        const parent = findParentFile(updatedFiles, draggingFile.id);
        if (parent && parent.children) {
          const childIndex = parent.children.findIndex((f) => f.id === draggingFile.id);
          if (childIndex !== -1) {
            parent.children.splice(childIndex, 1);
          }
        }
      }
      if (droppingFile.children) {
        droppingFile.children.push(draggingFile);
      } else {
        droppingFile.children = [draggingFile];
      }
      setFiles(updatedFiles);
    }
  };

  return (
    <div className="file-explorer">
      <ul>
        {files.map((file) => (
          <FileNodeComponent
            key={file.id}
            file={file}
            createFile={createFile}
            renameFile={renameFile}
            deleteFile={deleteFile}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
          />
        ))}
      </ul>
    </div>
  );
};

/**
 * File node component
 */
const FileNodeComponent: React.FC<{
  file: FileNode;
  createFile: (name: string, type: 'directory' | 'file', parent: FileNode | null) => void;
  renameFile: (file: FileNode, newName: string) => void;
  deleteFile: (file: FileNode) => void;
  handleDragStart: (event: React.DragEvent, file: FileNode) => void;
  handleDragOver: (event: React.DragEvent, file: FileNode) => void;
  handleDrop: (event: React.DragEvent, file: FileNode) => void;
}> = ({
  file,
  createFile,
  renameFile,
  deleteFile,
  handleDragStart,
  handleDragOver,
  handleDrop,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);

  const handleRename = () => {
    renameFile(file, newName);
    setIsRenaming(false);
  };

  return (
    <li
      draggable
      onDragStart={(event) => handleDragStart(event, file)}
      onDragOver={(event) => handleDragOver(event, file)}
      onDrop={(event) => handleDrop(event, file)}
      className="file-node"
    >
      {isRenaming ? (
        <input
          type="text"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onBlur={handleRename}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleRename();
            }
          }}
        />
      ) : (
        <span onDoubleClick={() => setIsRenaming(true)}>{file.name}</span>
      )}
      {file.type === 'directory' && (
        <button
          className="create-file-button"
          onClick={() => createFile('New File', 'file', file)}
        >
          +
        </button>
      )}
      <button
        className="delete-file-button"
        onClick={() => deleteFile(file)}
      >
        -
      </button>
      {file.children && (
        <ul>
          {file.children.map((child) => (
            <FileNodeComponent
              key={child.id}
              file={child}
              createFile={createFile}
              renameFile={renameFile}
              deleteFile={deleteFile}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default FileExplorer;