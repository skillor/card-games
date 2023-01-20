import { Component, ElementRef, Input, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { Animatable } from 'src/app/shared/animation/animatable';
import { AnimationService } from 'src/app/shared/animation/animation.service';
import { Card } from 'src/app/shared/games/card';
import { CardStack } from 'src/app/shared/games/card-stack';
import { GamesService } from 'src/app/shared/games/games.service';

@Component({
  selector: 'app-card-stack',
  templateUrl: './card-stack.component.html',
  styleUrls: ['./card-stack.component.scss']
})
export class CardStackComponent implements Animatable, AfterViewInit, OnDestroy {

  @Input()
  cardStack?: CardStack;

  @ViewChild('element')
  private innerElementRef: ElementRef | undefined;

  constructor(
    private outerElementRef: ElementRef,
    private gamesService: GamesService,
    private animationService: AnimationService,
  ) { }

  isFlipped(): boolean {
    return this.cardStack?.type.visibility === 'stack-hidden';
  }

  isReady(): boolean {
    return this.innerElementRef !== undefined;
  }

  getHidden(): boolean {
    return this.outerElementRef.nativeElement.style.visibility == 'hidden';
  }

  setHidden(hidden: boolean): void {
    this.outerElementRef.nativeElement.style.visibility = hidden ? 'hidden' : '';
  }

  getZIndex(): string {
    return this.outerElementRef.nativeElement.style.zIndex;
  }

  setZIndex(zIndex: string): void {
    this.outerElementRef.nativeElement.style.zIndex = zIndex;
  }

  getTransform(): string {
    return this.innerElementRef!.nativeElement.style.transform;
  }

  setTransform(transform: string): void {
    this.innerElementRef!.nativeElement.style.transform = transform;
  }

  animateTransform(keyframes: { transform: string; }[], options: any): void {
    this.innerElementRef!.nativeElement.animate(keyframes, options);
  }

  getBoundingClientRect(): { x: number; y: number; width: number; height: number; } {
    return this.innerElementRef!.nativeElement.getBoundingClientRect();
  }

  getId(): string {
    return this.cardStack!.id;
  }

  ngAfterViewInit() {
    this.animationService.register(this);
  }

  ngOnDestroy() {
    this.animationService.remove(this);
  }

  getEmptyImage(): string | undefined {
    if (!this.cardStack || !this.cardStack.type || !this.cardStack.type.emptyImage) return undefined;
    return this.gamesService.getGameResource(this.cardStack.gameId, this.cardStack.type.emptyImage);
  }
}
