import { Component, signal, OnInit, ChangeDetectorRef, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { MaterialModule } from "../../../shared/material.module";
import { FormsModule } from '@angular/forms';
import { ChatServices } from '../chat-services';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth-service';

export interface ChatMessage {
  content: string;
  isBot: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-chat-dialog',
  templateUrl: './chat-dialog.html',
  styleUrls: ['./chat-dialog.css'],
  imports: [MaterialModule, FormsModule, CommonModule],
  standalone: true
})
export class ChatDialog implements OnInit, AfterViewChecked {

  @ViewChild('chatBody', { static: false }) chatBody!: ElementRef;
  @ViewChild('messageInput', { static: false }) messageInput!: ElementRef;

  userId = signal<string>('');
  
  message: string = '';
  messages: ChatMessage[] = [
    {
      content: 'Hello! I\'m your AI Job Assistant. I can help you find jobs, provide career advice, and answer questions about opportunities. What can I help you with today?',
      isBot: true,
      timestamp: new Date()
    }
  ];
  
  isLoading: boolean = false;

  constructor(
    private chatService: ChatServices, 
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const currentUserId = this.authService.getUserId();
    
    if (currentUserId) {
      this.userId.set(currentUserId);
      console.log('Current User ID:', this.userId());
    } else {
      console.warn('No user ID found from AuthService');
      this.userId.set('guest-' + Date.now());
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  // TrackBy function for better performance
  trackByIndex(index: number, item: ChatMessage): number {
    return index;
  }

  // Send message function
  sendMessage() {
    if (!this.userId() || this.userId() === '') {
      console.error('No user ID available');
      this.addBotMessage('Please login to continue chatting.');
      return;
    }

    if (this.message.trim() && !this.isLoading) {
      const userMessage = this.message.trim();
      
      // Add user message
      this.addUserMessage(userMessage);
      
      // Clear input and focus
      this.message = '';
      this.isLoading = true;
      
      // Focus input after short delay
      setTimeout(() => {
        if (this.messageInput) {
          this.messageInput.nativeElement.focus();
        }
      }, 100);

      console.log('Sending message:', userMessage, 'for user:', this.userId());

      // Call API
      this.chatService.askAI(userMessage, this.userId()).subscribe({
        next: (response) => {
          console.log('AI Response received:', response);
          
          // Add bot response with slight delay for better UX
          setTimeout(() => {
            this.addBotMessage(response.answer);
            this.isLoading = false;
            this.cdr.detectChanges();
          }, 500);
        },
        error: (error) => {
          console.error('Error asking AI:', error);
          
          let errorMessage = 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.';
          
          if (error.status === 400) {
            errorMessage = 'I didn\'t quite understand your question. Could you please rephrase it?';
          } else if (error.status === 401) {
            errorMessage = 'It looks like your session has expired. Please login again.';
          } else if (error.status === 500) {
            errorMessage = 'I\'m experiencing some technical difficulties. Please try again in a few minutes.';
          }
          
          setTimeout(() => {
            this.addBotMessage(errorMessage);
            this.isLoading = false;
            this.cdr.detectChanges();
          }, 500);
        }
      });
    }
  }



  // Helper method to add user message
  private addUserMessage(content: string): void {
    this.messages = [...this.messages, {
      content: content,
      isBot: false,
      timestamp: new Date()
    }];
    console.log('Added user message. Total messages:', this.messages.length);
    this.cdr.detectChanges();
  }

  // Helper method to add bot message
  private addBotMessage(content: string): void {
    this.messages = [...this.messages, {
      content: content,
      isBot: true,
      timestamp: new Date()
    }];
    console.log('Added bot message. Total messages:', this.messages.length);
    this.cdr.detectChanges();
  }

  // Format message content (for bot messages with potential HTML/markdown)
  formatMessage(content: string): string {
    // Basic formatting - you can extend this
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/\n/g, '<br>') // Line breaks
      .replace(/`(.*?)`/g, '<code>$1</code>'); // Inline code
  }

  // Handle Enter key
  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Scroll to bottom of chat
  private scrollToBottom(): void {
    try {
      if (this.chatBody) {
        const element = this.chatBody.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch(err) {
      console.log('Error scrolling to bottom:', err);
    }
  }

  // Check if user is authenticated
  get isUserAuthenticated(): boolean {
    return this.userId() !== '' && !this.userId().startsWith('guest');
  }

  // Get greeting based on time
  get timeBasedGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }
}