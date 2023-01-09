import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomService } from 'src/app/shared/room/room.service';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss']
})
export class LobbyComponent implements OnInit {

  constructor(private roomService: RoomService, private router: Router, private route: ActivatedRoute) {
    this.route.paramMap.subscribe((params) => {
      const roomId = params.get('id');
      if (this.roomService.roomId != roomId) {
        this.roomService.disconnect();
        this.router.navigate(['join', roomId])
      }
    });
  }

  ngOnInit(): void {
  }

}
