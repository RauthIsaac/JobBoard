import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatDialog } from './chat-dialog';

describe('ChatDialog', () => {
  let component: ChatDialog;
  let fixture: ComponentFixture<ChatDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
