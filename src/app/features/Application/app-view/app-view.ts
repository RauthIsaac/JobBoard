import { NgClass } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApplicationService } from '../application-service';
import { IappDetails } from '../../../shared/models/iapp-details';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    private snackBar: MatSnackBar,
    private router: Router){}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id && id > 0) {
        this.appId.set(id);
        console.log(this.appId());
        this.loadAppDetails();
      }
    });
  }

  loadAppDetails(){
    this.appSevice.getAppDetailsByAppbId(this.appId()).subscribe({
      next: (appDetails: any) => {
        console.log('App Details From SQL', appDetails);
        this.appDetails.set(appDetails);
        console.log('Job Details : ',this.appDetails());      
      },
      error: (err:any) => {
        console.error('Error Fetching App Details : ',err);
      }

    })
  }


  updateAppStatus(appId:number , appStatus:string){
    this.appSevice.updateApplicationStatus(appId,appStatus).subscribe({
      next: (response) => {
        console.log(response);
        this.snackBar.open('✅ Application Status is updated successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });

          this.appDetails.update(details => ({
            ...details,
            status: appStatus
          }));

          this.router.navigate(['/appViewEmp']);
      },
      error: (err) => {
        console.error('Error , Application status wasnot updated');
        this.snackBar.open('❌ Application Status was not updated!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
      }
    })
  }

  toggleCoverLetter() {
    this.isOpen = !this.isOpen;
  }

}
