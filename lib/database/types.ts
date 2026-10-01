export interface Page {
  id: string;
  title: string;
  parentFolder?: string;
  content?: string;
  coverImage?: string;
  icon?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface Folder {
  id: string;
  title: string;
  parentFolder?: string;
  color?: string;
}
