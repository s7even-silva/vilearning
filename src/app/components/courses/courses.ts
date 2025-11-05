import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CoursesService, Course } from '../../services/courses';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './courses.html',
  styleUrls: ['./courses.scss']
})
export class Courses implements OnInit, OnDestroy {

  courses: Course[] = [];
  searchQuery: string = '';
  selectedCategory: string = 'Todas';
  selectedLevel: string = 'Todos';
  
  categories: string[] = [];
  levels: string[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(private coursesService: CoursesService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // For auto scrolling cuando viene un fragment (ej: desde búsqueda en home)
    this.route.fragment.pipe(takeUntil(this.destroy$)).subscribe(fragment => {
      if (fragment) {
        // Esperar a que el DOM esté completamente renderizado
        setTimeout(() => {
          const element = document.getElementsByClassName(fragment)[0];
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
    });

    

    // Obtener categorías y niveles
    this.categories = this.coursesService.getCategories();
    this.levels = this.coursesService.getLevels();

    // Suscribirse a los cursos filtrados
    this.coursesService.courses$
      .pipe(takeUntil(this.destroy$))
      .subscribe(courses => {
        this.courses = courses;
      });

    // Obtener el término de búsqueda del servicio (si viene desde Home)
    this.searchQuery = this.coursesService.getSearchQuery();

    // Obtener la categoría y nivel seleccionados del servicio (si vienen desde Home)
    this.selectedCategory = this.coursesService.getSelectedCategory();
    this.selectedLevel = this.coursesService.getSelectedLevel();

    // Si hay filtros previos, aplicarlos; si no, mostrar todos los cursos
    if (this.searchQuery || this.selectedCategory !== 'Todas' || this.selectedLevel !== 'Todos') {
      this.coursesService.filterCourses(this.searchQuery, this.selectedCategory, this.selectedLevel);
    } else {
      this.coursesService.filterCourses('');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onLevelChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    // Guardar los filtros en el servicio
    this.coursesService.setSearchQuery(this.searchQuery);
    this.coursesService.setSelectedCategory(this.selectedCategory);
    this.coursesService.setSelectedLevel(this.selectedLevel);

    // Aplicar los filtros
    this.coursesService.filterCourses(
      this.searchQuery,
      this.selectedCategory,
      this.selectedLevel
    );
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'Todas';
    this.selectedLevel = 'Todos';
    this.coursesService.resetFilters();
  }

  onCourseClick(course: Course): void {
    if (course.id === 1) {
      window.location.href = '/myolab';
    }
    console.log('Curso seleccionado:', course.title);
    // Aquí navegarías a la página de detalles del curso
    // this.router.navigate(['/cursos', course.id]);
  }
}