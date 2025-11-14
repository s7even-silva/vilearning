import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CoursesService, Course } from '../../services/courses';

interface Category {
  name: string;
  image: string;
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
    {
      name: 'Ingeniería Biomédica',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop',
      count: 1
    },
    {
      name: 'Robótica',
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop',
      count: 1
    },
    {
      name: 'Inteligencia Artificial',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop',
      count: 1
    },
    {
      name: 'Visión Artificial',
      image: 'https://images.unsplash.com/photo-1617802690658-1173a812650d?w=400&h=300&fit=crop',
      count: 1
    }
  ];

  featuredCourses: Course[] = [];

  stats = [
    { value: '1', label: 'Laboratorio Disponible' },
    { value: 'En tiempo real', label: 'Prótesis Controlable' },
    { value: 'MediaPipe', label: 'Tecnología de Google' },
    { value: '100% Gratis', label: 'Acceso Completo' }
  ];

  constructor(
    private coursesService: CoursesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener solo el curso de MyoLab
    this.featuredCourses = this.coursesService.getAllCourses().filter(course => course.id === 1);
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      // Guardar el término de búsqueda en el servicio
      this.coursesService.setSearchQuery(this.searchQuery);
      // Navegar a la página de cursos
      this.router.navigate(['/cursos'], {fragment: 'filters-section'});
    }
  }

  onCategoryClick(category: Category): void {
    // Establecer la categoría seleccionada en el servicio
    this.coursesService.setSelectedCategory(category.name);
    // Filtrar por categoría
    this.coursesService.filterCourses('', category.name);
    // Navegar a cursos con scroll a filtros
    this.router.navigate(['/cursos'], { fragment: 'filters-section' });
  }

  onCourseClick(course: Course): void {
    if (course.id === 1) {
      window.location.href = '/myolab';
    }
    // Aquí navegarías a la página de detalles del curso
    console.log('Curso seleccionado:', course.title);
    // this.router.navigate(['/cursos', course.id]);
  }

  navigateToCourses(): void {
    this.router.navigate(['/cursos']);
  }
}