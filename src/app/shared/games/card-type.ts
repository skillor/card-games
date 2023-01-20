import { SafeUrl } from "@angular/platform-browser";

export interface CardType {
  id?: string;
  gameId?: string;
  name: string;
  types: {[key: string]: string};
  frontImage?: string;
  backImage?: string;
}
