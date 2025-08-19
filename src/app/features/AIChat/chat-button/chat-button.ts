import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ChatDialog } from '../chat-dialog/chat-dialog';

@Component({
  selector: 'app-chat-button',
  templateUrl: './chat-button.html',
  styleUrls: ['./chat-button.css']
})
export class ChatButton {
  isOpen = false;

  constructor(private dialog: MatDialog) {}

  openChat() {
    this.isOpen = true;

    const dialogRef = this.dialog.open(ChatDialog, {
      width: '450px',
      height: '500px',
      position: {
        bottom: '110px',
        right: '50px',
      },
      panelClass: 'chat-dialog-container'
    });

    dialogRef.afterClosed().subscribe(() => {
      this.isOpen = false; 
    });
  }
}
