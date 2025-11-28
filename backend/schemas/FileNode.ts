interface FileNode {
  id: number;
  name: string;
  type: 'file' | 'directory';
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface FileNodeRelationships {
  children: FileNode[];
  parent: FileNode | null;
}

interface FileNodeWithRelationships extends FileNode {
  relationships: FileNodeRelationships;
}

interface NewFileNode {
  name: string;
  type: 'file' | 'directory';
  parentId: number | null;
}

interface UpdatedFileNode {
  id: number;
  name?: string;
  parentId?: number | null;
}