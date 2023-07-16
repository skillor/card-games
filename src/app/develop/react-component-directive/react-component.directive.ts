import { Directive, ElementRef, EventEmitter, inject, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';

import { ComponentProps, createElement, ElementType } from 'react';
import * as ReactDom from 'react-dom';

@Directive({
  selector: '[reactComponent]',
})
export class ReactComponentDirective<Comp extends ElementType> implements OnChanges, OnDestroy {
  @Input() reactComponent?: Comp;
  @Input() props?: ComponentProps<Comp>;
  change: EventEmitter<any> = new EventEmitter<any>();

  private root = inject(ElementRef).nativeElement;

  ngOnChanges(changes: SimpleChanges) {
    if (!this.reactComponent) return;
    ReactDom.unmountComponentAtNode(this.root);
    ReactDom.render(createElement(this.reactComponent, this.props), this.root);
  }

  ngOnDestroy() {
    ReactDom.unmountComponentAtNode(this.root);
  }
}
