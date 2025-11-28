import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileItem[];
}

const fileSystem: { [key: string]: FileItem } = {};

app.get('/api/filesystem', (req: Request, res: Response) => {
  try {
    const rootDir = getRootDir();
    const fileTree = buildFileTree(rootDir);
    res.json(fileTree);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get file system' });
  }
});

app.post('/api/filesystem', (req: Request, res: Response) => {
  try {
    const { action, parentId, newName, oldName, targetId } = req.body;

    if (!action) {
      res.status(400).json({ message: 'Action is required' });
      return;
    }

    switch (action) {
      case 'create':
        createFile(parentId, newName);
        break;
      case 'rename':
        renameFile(oldName, newName);
        break;
      case 'delete':
        deleteFile(oldName);
        break;
      case 'drag-drop':
        dragDropFile(targetId, oldName);
        break;
      default:
        res.status(400).json({ message: 'Invalid action' });
        return;
    }

    res.json({ message: 'Operation successful' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to perform operation' });
  }
});

function getRootDir(): string {
  return process.cwd();
}

function buildFileTree(dir: string): FileItem {
  const fileTree: FileItem = {
    id: uuidv4(),
    name: path.basename(dir),
    type: 'directory',
  };

  const files = fs.readdirSync(dir);

  if (files.length > 0) {
    fileTree.children = files.map((file) => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        return buildFileTree(filePath);
      } else {
        return {
          id: uuidv4(),
          name: file,
          type: 'file',
        };
      }
    });
  }

  return fileTree;
}

function createFile(parentId: string, name: string): void {
  const parentDir = getParentDir(parentId);
  const filePath = path.join(parentDir, name);

  if (fs.existsSync(filePath)) {
    throw new Error(`File with name ${name} already exists`);
  }

  fs.mkdirSync(filePath);
}

function renameFile(oldName: string, newName: string): void {
  const oldPath = path.join(getRootDir(), oldName);
  const newPath = path.join(getRootDir(), newName);

  if (!fs.existsSync(oldPath)) {
    throw new Error(`File with name ${oldName} does not exist`);
  }

  fs.renameSync(oldPath, newPath);
}

function deleteFile(name: string): void {
  const filePath = path.join(getRootDir(), name);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File with name ${name} does not exist`);
  }

  fs.rmSync(filePath, { recursive: true });
}

function dragDropFile(targetId: string, name: string): void {
  const targetDir = getParentDir(targetId);
  const oldPath = path.join(getRootDir(), name);
  const newPath = path.join(targetDir, name);

  if (!fs.existsSync(oldPath)) {
    throw new Error(`File with name ${name} does not exist`);
  }

  fs.renameSync(oldPath, newPath);
}

function getParentDir(id: string): string {
  const dir = getRootDir();

  if (id === uuidv4()) {
    return dir;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      if (file === id) {
        return filePath;
      }

      const parentDir = getParentDir(id);

      if (parentDir) {
        return parentDir;
      }
    }
  }

  return null;
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});