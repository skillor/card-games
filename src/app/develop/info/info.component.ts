import { Component, OnInit } from '@angular/core';
import { DevelopService } from '../develop.service';
import { Subject, interval, takeUntil } from 'rxjs';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss'],
  host: { 'class': 'flex w-full' },
})
export class InfoComponent implements OnInit {
  private ngUnsubscribe = new Subject<void>()

  constructor(
    public developService: DevelopService,
  ) {
  }

  ngOnInit(): void {
    interval(2000).pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      try { this.developService.saveInfo() } catch {};
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
