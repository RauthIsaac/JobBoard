import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AskQuestionDto {
  question: string;
  userId: string;
}

export interface AskResponse {
  answer: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatServices {

  private askBaseURL = 'http://localhost:5007/api/AIEmbeddings/ask';

  constructor(private http: HttpClient) { }

  askAI(question: string, userId: string): Observable<AskResponse> {
    const body: AskQuestionDto = {
      question: question,
      userId: userId
    };
    
    return this.http.post<AskResponse>(this.askBaseURL, body);
  }
}