interface FileNode {
  id: number;
  name: string;
  type: 'file' | 'directory';
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface FileNodeRelations {
  children: FileNode[];
  parent: FileNode | null;
}

interface FileNodeWithRelations extends FileNode, FileNodeRelations {}

interface FileNodeCreateInput {
  name: string;
  type: 'file' | 'directory';
  parentId: number | null;
}

interface FileNodeUpdateInput {
  id: number;
  name?: string;
  type?: 'file' | 'directory';
  parentId?: number | null;
}

interface FileNodeDeleteInput {
  id: number;
}

interface FileNodeDragDropInput {
  id: number;
  newParentId: number | null;
}