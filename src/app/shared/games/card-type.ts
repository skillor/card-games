export interface CardType {
  id?: string;
  gameId?: string;
  name: string;
  types: {[key: string]: string};
  // image?: MediaImage;
}
