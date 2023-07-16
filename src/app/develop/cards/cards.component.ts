import { Component, OnInit } from '@angular/core';
import { DevelopService } from '../develop.service';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss'],
  host: { 'class': 'flex w-full' },
})
export class CardsComponent implements OnInit {
  constructor(
    public developService: DevelopService,
  ) { }

  ngOnInit(): void {
  }
}
