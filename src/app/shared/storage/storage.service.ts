import { Injectable } from '@angular/core';

@Injectable()
export class StorageService {

  constructor() { }

  save(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  load(key: string, defaultValue: string | null = null): string | null {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return item;
  }
}
