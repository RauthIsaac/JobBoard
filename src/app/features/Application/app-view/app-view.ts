import { NgClass } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApplicationService } from '../application-service';
import { SnackbarService } from '../../../shared/components/snackbar/snackbar-service';

@Component({
  selector: 'app-app-view',
  imports: [NgClass, RouterLink],
  templateUrl: './app-view.html',
  styleUrl: './app-view.css'
})
export class AppView implements OnInit{

  isOpen: boolean = false;

  appId = signal<number>(0);
  appDetails = signal<any>('');

  constructor(
    private route:ActivatedRoute, 
    private appSevice:ApplicationService,
    private snackbarService:SnackbarService,
    private router: Router){}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id && id > 0) {
        this.appId.set(id);
        this.loadAppDetails();
      }
    });
  }

  loadAppDetails() {
    this.appSevice.getAppDetailsByAppbId(this.appId()).subscribe({
      next: (appDetails: any) => {
        this.appDetails.set(appDetails);

        // ✅ Animation for fade-line (inside cards)
        setTimeout(() => {
          const lines = document.querySelectorAll<HTMLElement>('.fade-line');
          lines.forEach((line, index) => {
            line.style.animationDelay = `${index * 0.1}s`;
            line.classList.add('visible');
          });
        }, 200);

        // ✅ Animation for fade-block (whole cards one by one)
        setTimeout(() => {
          const blocks = document.querySelectorAll<HTMLElement>('.fade-block');
          blocks.forEach((block, index) => {
            block.style.animationDelay = `${index * 0.25}s`;
            block.classList.add('visible');
          });
        }, 400);
      },
      error: (err: any) => {
        console.error('Error Fetching App Details : ', err);
      }
    });
  }


  updateAppStatus(appId:number , appStatus:string){
    this.appSevice.updateApplicationStatus(appId,appStatus).subscribe({
      next: (response) => {
        console.log(response);
        this.showSuccess('Application Status is updated successfully!');

          this.appDetails.update(details => ({
            ...details,
            status: appStatus
          }));

          this.router.navigate(['/appViewEmp']);
      },
      error: (err) => {
        console.error('Error , Application status wasnot updated');
        this.showError('Application status wasnot updated' );
      }
    })
  }

  toggleCoverLetter() {
    this.isOpen = !this.isOpen;
  }


  //#region Snackbar Methods
  showSuccess(message: string = 'Operation successful!', duration: number = 4000, action: string = 'Undo'): void {
    console.log('Showing success snackbar');
    this.snackbarService.show({
      message,
      type: 'success',
      duration,
      action
    });
  }

  showInfo(message: string = 'Information message', duration: number = 5000): void {
    this.snackbarService.show({
      message,
      type: 'info',
      duration
    });
  }

  showError(message: string = 'Something went wrong!', duration: number = 5000): void {
    this.snackbarService.show({
      message,
      type: 'error',
      duration
    });
  }

  //#endregion  

  

}
