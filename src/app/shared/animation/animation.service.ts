import { Injectable } from '@angular/core';
import { delay, first, concatMap, Observable, of, timer, BehaviorSubject } from 'rxjs';
import { SettingsService } from '../settings/settings.service';
import { Animatable } from './animatable';
import { Animation } from './animation';

@Injectable()
export class AnimationService {
  pendingAnimations = new BehaviorSubject<number>(0);
  animationsDeactivated = false;
  animatables: {[id: string]: Animatable} = {};
  animationBuffer: Animation[] = [];

  constructor(
    private settingsService: SettingsService,
  ) {
    timer(0, 1).pipe(concatMap(() => this.handleAnimationBuffer())).subscribe();
    timer(0, 1).subscribe(() => this.handleAnimationStart());
  }

  canAnimate(animation: Animation): boolean {
    if (!(animation.targetId in this.animatables)) return false;
    if (!this.animatables[animation.targetId].isReady()) return false;
    if (animation.fromId !== null && !(animation.fromId in this.animatables)) return false;
    if (animation.toId !== null && !(animation.toId in this.animatables)) return false;
    return true;
  }

  currentPosition(animatable: Animatable | null, defaultValue: {x: number, y: number} = {x: 0, y: 0}): {x: number, y: number} {
    if (animatable === null) return defaultValue;
    return animatable.getBoundingClientRect();
  }

  animationKeyframes(animation: Animation): {transform: string}[] {
    const target = this.animatables[animation.targetId];
    let from: Animatable | null = null;
    let to: Animatable | null = null;
    if (animation.fromId !== null) {
      from = this.animatables[animation.fromId];
    }
    if (animation.toId !== null) {
      to = this.animatables[animation.toId];
    }

    const targetPos = this.currentPosition(target, this.currentPosition(target));
    const fromPos = this.currentPosition(from, {x: window.innerWidth / 2, y: window.innerHeight});
    const toPos = this.currentPosition(to, targetPos);

    const flip = from && to && from.isFlipped() != to.isFlipped();
    if (animation.type === 'shuffle') {
      return [
        {transform: `translate(${fromPos.x - targetPos.x}px, ${fromPos.y - targetPos.y}px)`},
        {transform: `translate(${fromPos.x - targetPos.x}px, ${fromPos.y - targetPos.y}px) rotate(30deg)`},
        {transform: `translate(${fromPos.x - targetPos.x}px, ${fromPos.y - targetPos.y}px) rotate(-30deg)`},
        {transform: `translate(${toPos.x - targetPos.x}px, ${toPos.y - targetPos.y}px)`},
      ];
    }
    // else 'fly'
    return [
      {transform: `translate(${fromPos.x - targetPos.x}px, ${fromPos.y - targetPos.y}px)`},
      {transform: `translate(${toPos.x - targetPos.x}px, ${toPos.y - targetPos.y}px)` + (flip ? ' rotateY(180deg)' : '')},
    ];
  }

  animate(animation: Animation): Observable<number> {
    const target = this.animatables[animation.targetId];

    target.setTransform('');

    const next = animation.next * +this.settingsService.getSetting('animation_speed').value;
    const keyframes = this.animationKeyframes(animation);
    const options = {
      duration: animation.duration * +this.settingsService.getSetting('animation_speed').value,
    };
    target.animateTransform(keyframes, options);
    of(1).pipe(
      delay(options.duration),
    ).subscribe(() => {
      target.setZIndex('');
      target.setTransform(keyframes[keyframes.length-1].transform);
      this.pendingAnimations.pipe(first()).subscribe((pending) => this.pendingAnimations.next(pending-1));
    });
    return of(1).pipe(
      delay(next),
    );
  }


  handleAnimationBuffer(): Observable<number> {
    if (this.animationBuffer.length === 0) {
      return of(0).pipe(delay(50));
    }
    if (!this.canAnimate(this.animationBuffer[0])) return of(0).pipe(delay(50));

    return this.animate(this.animationBuffer.shift()!).pipe(
      first(),
    );
  }

  animationStart(animation: Animation, i: number): void {
    const target = this.animatables[animation.targetId];
    if (target.getTransform() !== '') return;
    const keyframes = this.animationKeyframes(animation);
    target.setTransform(keyframes[0].transform);
    target.setZIndex((+target.getZIndex() + 100 - i).toString());
    target.setHidden(false);
  }

  handleAnimationStart(): void {
    const n = this.animationBuffer.length;
    for (let i=n-1; i>=0; i--) {
      if (!this.canAnimate(this.animationBuffer[i])) continue;
      this.animationStart(this.animationBuffer[i], i);
    }
    // for (let animatable of Object.values(this.animatables)) {
    //   animatable.setHidden(false);
    // }
  }

  clearAnimations() {
    this.animationBuffer = [];
    this.pendingAnimations.next(0);
  }

  registerAnimations(animations: Animation[]) {
    this.pendingAnimations.pipe(first()).subscribe((pending) => {
      this.pendingAnimations.next(pending + animations.length);
      for (let animation of animations) {
        this.animationBuffer.push(animation);
      }
    });
  }

  register(animatable: Animatable) {
    // if (!this.animationsDeactivated) animatable.setHidden(true);
    this.animatables[animatable.getId()] = animatable;

    for (let i=this.animationBuffer.length-1; i>=0; i--) {
      if (animatable.getId() === this.animationBuffer[i].targetId) {
        if (!this.canAnimate(this.animationBuffer[i])) continue;
        animatable.setHidden(true);
        break;
      }
    }
  }

  remove(animatable: Animatable) {
    delete this.animatables[animatable.getId()];
  }
}
