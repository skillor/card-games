export interface Animation {
  fromId: string | null;
  targetId: string;
  toId: string | null;
  type: 'shuffle' | 'fly';
  duration: number;
  next: number;
}
