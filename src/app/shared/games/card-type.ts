export interface CardType {
  id?: string;
  gameId?: string;
  name: string;
  types: {[key: string]: string};
  frontImage?: string;
  backImage?: string;
  size?: {width: number, height: number};
}
