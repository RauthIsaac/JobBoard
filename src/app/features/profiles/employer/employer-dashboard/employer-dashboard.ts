import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../auth/auth-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarEmp } from '../../../../shared/components/navbar-emp/navbar-emp';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-employer-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule, NavbarEmp, RouterOutlet],
  templateUrl: './employer-dashboard.html',
  styleUrls: ['./employer-dashboard.css']
})
export class EmployerDashboard implements OnInit {
  
  isSidebarOpen = signal<boolean>(true);

empData = signal<any>({});

  constructor(
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.loadEmployerProfile();

    // Initialize Intersection Observer for scroll animations
    const sections = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const fadeLines = entry.target.querySelectorAll<HTMLElement>('.fade-line');
            
            fadeLines.forEach((line, index) => {
              setTimeout(() => {
                line.classList.add('visible');
              }, index * 150); 
            });

            observer.unobserve(entry.target); 
          }
        });
      },
      {
        threshold: 0.2, 
      }
    );

    sections.forEach(section => observer.observe(section));



    // ✅ Dynamic stagger animation
    setTimeout(() => {
      const lines = document.querySelectorAll<HTMLElement>('.fade-line');
      lines.forEach((line, index) => {
        line.style.animationDelay = `${index * 0.15}s`;
        line.classList.add('visible');
      });
    }, 600);


    setTimeout(() => {
        const blocks = document.querySelectorAll<HTMLElement>('.fade-block');
        blocks.forEach((block, index) => {
          block.style.animationDelay = `${index * 0.25}s`;
          block.classList.add('visible');
        });
      }, 400);
  }

  loadEmployerProfile(): void {
    this.authService.getEmployerProfile().subscribe({
      next: (data) => {
        this.empData.set(data);
        console.log(this.empData());
      },
      error: (err) => {
        console.error('Error loading employer profile:', err);
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(isOpen => !isOpen);
  }
}