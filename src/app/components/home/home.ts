import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CoursesService, Course } from '../../services/courses';

interface Category {
  name: string;
  icon: string;
  count: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class Home implements OnInit {
  searchQuery: string = '';
  
  categories: Category[] = [
    { name: 'Ingeniería', icon: '⚙️', count: 234 },
    { name: 'Ciencias', icon: '🔬', count: 189 },
    { name: 'Matemáticas', icon: '📐', count: 156 },
    { name: 'Programación', icon: '💻', count: 312 },
    { name: 'Negocios', icon: '💼', count: 145 },
    { name: 'Artes', icon: '🎨', count: 98 }
  ];

  featuredCourses: Course[] = [];

  stats = [
    { value: '2,400+', label: 'Cursos Disponibles' },
    { value: '50,000+', label: 'Estudiantes Activos' },
    { value: '500+', label: 'Instructores Expertos' },
    { value: '95%', label: 'Tasa de Satisfacción' }
  ];

  constructor(
    private coursesService: CoursesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener cursos destacados (los primeros 6)
    this.featuredCourses = this.coursesService.getAllCourses().slice(0, 6);
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      // Guardar el término de búsqueda en el servicio
      this.coursesService.setSearchQuery(this.searchQuery);
      // Navegar a la página de cursos
      this.router.navigate(['/cursos']);
    }
  }

  onCategoryClick(category: Category): void {
    // Filtrar por categoría y navegar a cursos
    this.coursesService.filterCourses('', category.name);
    this.router.navigate(['/cursos']);
  }

  onCourseClick(course: Course): void {
    if (course.id === 1) {
          this.router.navigate(['/myolab']);
    }
    // Aquí navegarías a la página de detalles del curso
    console.log('Curso seleccionado:', course.title);
    // this.router.navigate(['/cursos', course.id]);
  }

  navigateToCourses(): void {
    this.router.navigate(['/cursos']);
  }
}