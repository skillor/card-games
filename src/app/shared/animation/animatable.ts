import { ElementRef } from "@angular/core";

export interface Animatable {
  getId(): string;
  // elementRef: ElementRef | undefined;
  isReady(): boolean;
  isFlipped(): boolean;
  getHidden(): boolean;
  setHidden(hidden: boolean): void;
  getZIndex(): string;
  setZIndex(zIndex: string): void;
  getTransform(): string;
  setTransform(transform: string): void;
  animateTransform(keyframes: {transform: string}[], options: any): void;
  getBoundingClientRect(): {x: number, y: number, width: number, height: number};
}
