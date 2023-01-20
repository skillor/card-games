import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { AnimationService } from 'src/app/shared/animation/animation.service';
import { Animatable} from 'src/app/shared/animation/animatable';
import { Card } from 'src/app/shared/games/card';
import { GamesService } from 'src/app/shared/games/games.service';
import { SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements Animatable, AfterViewInit, OnChanges, OnDestroy {
  @Input()
  card?: Card;

  @Input()
  back = false;

  frontSrc?: SafeUrl;
  backSrc?: SafeUrl;

  getId(): string {
    return this.card!.id;
  }

  @ViewChild('element')
  private innerElementRef: ElementRef | undefined;

  constructor(
    private outerElementRef: ElementRef,
    private gamesService: GamesService,
    private animationService: AnimationService,
  ) { }

  isFlipped(): boolean {
    return this.back;
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

  ngAfterViewInit() {
    this.animationService.register(this);
  }

  ngOnDestroy() {
    this.animationService.remove(this);
  }

  ngOnChanges(change: SimpleChanges): void {
    if (this.card === undefined) {
      this.frontSrc = undefined;
      this.backSrc = undefined;
      return;
    }
    this.frontSrc = this.getImage(this.back);
    this.backSrc = this.getImage(!this.back);
  }

  getImage(back: boolean): SafeUrl {
    if (back)
      return this.gamesService.getCardBackImage(this.card!.cardType);
    return this.gamesService.getCardFrontImage(this.card!.cardType);
  }
}
