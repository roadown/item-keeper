export interface ItemRecord {
  id: string;
  userId: string;
  item: string;
  location: string;
  createdAt: string;
  rawInput: string;
  source: 'text' | 'voice';
  tags: string[];
}

export interface RecycleBinItem extends ItemRecord {
  deletedAt: string;
  deleteReason: string;
}