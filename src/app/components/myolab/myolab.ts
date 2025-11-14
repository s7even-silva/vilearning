import { Component, AfterViewInit, OnDestroy, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { LabWorkspace } from './lab-workspace/lab-workspace';
import { Quiz } from './quiz/quiz';
import { Results } from './results/results';

type LabState = 'welcome' | 'lab' | 'quiz' | 'results';

interface TocItem {
  id: string;
  title: string;
  subItems?: { id: string; title: string }[];
}

@Component({
  selector: 'app-myolab',
  standalone: true,
  imports: [CommonModule, LabWorkspace, Quiz, Results],
  templateUrl: './myolab.html',
  styleUrls: ['./myolab.scss']
})
export class Myolab implements AfterViewInit, OnDestroy {
  currentState: LabState = 'welcome';
  finalScore: number = 0;
  totalQuestions: number = 20;

  // Scroll spy properties
  activeSection: string = 'introduccion';
  showBackToTop: boolean = false;
  readingProgress: number = 0;

  // Table of contents
  tocItems: TocItem[] = [
    { id: 'introduccion', title: 'Introducción' },
    { id: 'objetivos', title: 'Objetivos del Laboratorio' },
    {
      id: 'procedimiento',
      title: 'Procedimiento Experimental',
      subItems: [
        { id: 'paso-1', title: 'Paso 1: Detección de la Mano' },
        { id: 'paso-2', title: 'Paso 2: Reconocimiento de Gestos' },
        { id: 'paso-3', title: 'Paso 3: Control de la Prótesis' }
      ]
    },
    { id: 'actividad', title: 'Actividad de Evaluación' },
    { id: 'retroalimentacion', title: 'Retroalimentación Automática' },
    { id: 'cierre', title: 'Cierre y Reflexión' },
    { id: 'mejora-visual', title: 'Mejora Visual' }
  ];

  private intersectionObserver?: IntersectionObserver;
  private isBrowser: boolean;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser && this.currentState === 'welcome') {
      this.initScrollSpy();
      this.initAnimations();
    }
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (!this.isBrowser || this.currentState !== 'welcome') return;

    // Show/hide back to top button
    this.showBackToTop = window.pageYOffset > 300;

    // Update reading progress
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    this.readingProgress = (winScroll / height) * 100;
  }

  private initScrollSpy(): void {
    const options = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.activeSection = entry.target.id;
        }
      });
    }, options);

    // Observe all sections
    const sections = document.querySelectorAll('.guide-section');
    sections.forEach(section => this.intersectionObserver?.observe(section));
  }

  private initAnimations(): void {
    const animatedElements = document.querySelectorAll('.fade-in-up, .fade-in');

    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          animationObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => animationObserver.observe(el));
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  startLab(): void {
    this.currentState = 'lab';
    window.scrollTo({ top: 0 });
  }

  onLabFinish(): void {
    this.currentState = 'quiz';
  }

  onQuizComplete(score: number): void {
    this.finalScore = score;
    this.currentState = 'results';
  }

  goToCourses(): void {
    this.router.navigate(['/courses']);
  }
}
