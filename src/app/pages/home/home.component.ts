import { Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError } from 'rxjs';
import { RoomService } from 'src/app/shared/room/room.service';
import { StorageService } from 'src/app/shared/storage/storage.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  defaultUsername = 'User' + Math.random().toFixed(4).toString().substring(2);
  loading = false;
  errorMessage = '';
  username = '';
  roomId = '';

  constructor(
    private roomService: RoomService,
    private storageService: StorageService,
    private router: Router,
    private route: ActivatedRoute,
    private zone: NgZone
  ) {
    route.paramMap.subscribe((params) => {
      if (params.has('id') && !this.roomId) this.roomId = params.get('id')!;
    });
    this.username = this.storageService.load('username', '')!;
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    this.storageService.save('username', this.username);

    let username = this.username;
    if (username == '') {
      username = this.defaultUsername;
    }

    this.errorMessage = '';
    this.loading = true;
    let obs;
    if (this.roomId == '') {
      obs = this.roomService.createRoom(username);
    } else {
      obs = this.roomService.joinRoom(username, this.roomId);
    }
    obs.pipe(
      catchError((err) => {
        this.loading = false;
        this.errorMessage = err.message;
        throw err;
      }),
    ).subscribe((roomId) => {
      this.loading = false;
      this.zone.run(() => this.router.navigate(['lobby', roomId]));
    });
  }
}
