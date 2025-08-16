import { Component } from '@angular/core';
import { MaterialModule } from "../../../shared/material.module";
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-chat-dialog',
  templateUrl: './chat-dialog.html',
  styleUrls: ['./chat-dialog.css'],
  imports: [MaterialModule, FormsModule]
})
export class ChatDialog {
  message: string = '';

  sendMessage() {
    if (this.message.trim()) {
      console.log('User message:', this.message);
      this.message = '';
    }
  }
}
