import type { InkColor } from '../constants/lorcana.js';

export interface Deck {
  id: string;
  userId: string;
  name: string;
  colors: InkColor[];
  link: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeckRequest {
  name: string;
  colors: InkColor[];
  link?: string;
  isDefault?: boolean;
}

export interface UpdateDeckRequest extends Partial<CreateDeckRequest> {}
