import { Component, Input, OnInit } from '@angular/core';
import { Card } from 'src/app/shared/games/card';
import { CardStack } from 'src/app/shared/games/card-stack';

@Component({
  selector: 'app-card-stack',
  templateUrl: './card-stack.component.html',
  styleUrls: ['./card-stack.component.scss']
})
export class CardStackComponent implements OnInit {

  @Input()
  cardStack?: CardStack;

  constructor() { }

  ngOnInit(): void {
  }
}
