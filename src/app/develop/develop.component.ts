import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { GameLoaderService } from '../shared/games/games-loader.service';
import { FileService } from '../shared/file/file.service';
import { Subject, Subscription, lastValueFrom, switchMap, takeUntil } from 'rxjs';
import { NavigationEnd, Event, NavigationError, NavigationStart, Router } from '@angular/router';
import { DevelopService } from './develop.service';


@Component({
  selector: 'app-develop',
  templateUrl: './develop.component.html',
  styleUrls: ['./develop.component.scss'],
})
export class DevelopComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject<void>();
  getGames$ = this.gameService.getGames();
  loading$: Subscription = new Subscription();
  progress?: number;
  navbarRoutes = [
    { link: 'info', title: 'Info' },
    { link: 'actions', title: 'Actions' },
    { link: 'cards', title: 'Cards' },
    { link: 'assets', title: 'Assets' },
    { link: 'debug', title: 'Debug' },
  ]

  constructor(
    public developService: DevelopService,
    private gameService: GameLoaderService,
    private fileService: FileService,
    private router: Router,
  ) {
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      this.developService.saveToLocal();
    }
  }

  async ngOnInit() {
    this.router.events.pipe(takeUntil(this.ngUnsubscribe)).subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        // Show loading indicator
      }

      if (event instanceof NavigationEnd) {
        // Hide loading indicator
        (<any>document.activeElement)?.blur();
      }

      if (event instanceof NavigationError) {
        // Hide loading indicator
        console.error(event.error);
      }
    });

    const temp = localStorage.getItem('temp-zip');
    if (temp) {
      await lastValueFrom(this.gameService.loadGameBlob(await (await fetch(temp)).blob()));
      await this.developService.loadGame();
    } else await this.developService.newGame();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  async newGame(): Promise<void> {
    await this.developService.newGame();
    (<any>document.activeElement)?.blur();
  }

  async loadGame(): Promise<void> {
    await this.developService.loadGame();
    (<any>document.activeElement)?.blur();
  }

  loadPre(id: string): void {
    this.loading$.unsubscribe();
    this.progress = 0;
    this.loading$ = this.gameService.loadGameZip(id).subscribe({
      next: async (p) => {
        if (!p.result) this.progress = (p.progress * 100);
        else await this.loadGame();
      },
      complete: () => this.progress = undefined
    });
  }

  loadFile(): void {
    this.loading$.unsubscribe();
    this.loading$ = this.fileService.loadRawFile('.zip').pipe(
      switchMap((file) => this.gameService.loadGameBlob(file)),
    ).subscribe(async () => await this.loadGame());
  }
}
