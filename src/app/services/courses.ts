import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Course {
  id: number;
  title: string;
  instructor: string;
  category: string;
  level: string;
  students: number;
  image: string;
  rating: number;
  description: string;
  duration: string;
  tags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CoursesService {
  private allCourses: Course[] = [
    {
      id: 1,
      title: 'Laboratorio de Prótesis Mioeléctrica',
      instructor: 'Ing. Frank Marcos',
      category: 'Ingeniería Biomédica',
      level: 'Intermedio',
      students: 2340,
      image: 'https://investigacion.pucp.edu.pe/grupos/girab/wp-content/uploads/sites/108/2019/03/Image-1.jpg',
      rating: 4.9,
      description: 'Aprende cómo funcionan las prótesis mioeléctricas controlando una de manera remota.',
      duration: '4 semanas',
      tags: ['prótesis', 'internet', 'impresión 3d', 'robótica', 'visión artificial']
    }
  ];

  private coursesSubject = new BehaviorSubject<Course[]>(this.allCourses);
  private searchQuerySubject = new BehaviorSubject<string>('');
  private selectedCategorySubject = new BehaviorSubject<string>('Todas');
  private selectedLevelSubject = new BehaviorSubject<string>('Todos');

  courses$ = this.coursesSubject.asObservable();
  searchQuery$ = this.searchQuerySubject.asObservable();

  constructor() { }

  getAllCourses(): Course[] {
    return this.allCourses;
  }

  getCourseById(id: number): Course | undefined {
    return this.allCourses.find(course => course.id === id);
  }

  setSearchQuery(query: string): void {
    this.searchQuerySubject.next(query);
    this.filterCourses(query);
  }

  getSearchQuery(): string {
    return this.searchQuerySubject.value;
  }

  setSelectedCategory(category: string): void {
    this.selectedCategorySubject.next(category);
  }

  getSelectedCategory(): string {
    return this.selectedCategorySubject.value;
  }

  setSelectedLevel(level: string): void {
    this.selectedLevelSubject.next(level);
  }

  getSelectedLevel(): string {
    return this.selectedLevelSubject.value;
  }

  filterCourses(query: string, category?: string, level?: string): void {
    let filtered = this.allCourses;

    // Filtrar por búsqueda
    if (query && query.trim() !== '') {
      const searchTerm = query.toLowerCase().trim();
      filtered = filtered.filter(course => {
        return (
          course.title.toLowerCase().includes(searchTerm) ||
          course.instructor.toLowerCase().includes(searchTerm) ||
          course.category.toLowerCase().includes(searchTerm) ||
          course.description.toLowerCase().includes(searchTerm) ||
          course.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      });
    }

    // Filtrar por categoría
    if (category && category !== 'Todas') {
      filtered = filtered.filter(course => course.category === category);
    }

    // Filtrar por nivel
    if (level && level !== 'Todos') {
      filtered = filtered.filter(course => course.level === level);
    }

    this.coursesSubject.next(filtered);
  }

  getCategories(): string[] {
    const categories = new Set(this.allCourses.map(c => c.category));
    return ['Todas', ...Array.from(categories)];
  }

  getLevels(): string[] {
    return ['Todos', 'Básico', 'Intermedio', 'Avanzado'];
  }

  resetFilters(): void {
    this.searchQuerySubject.next('');
    this.selectedCategorySubject.next('Todas');
    this.selectedLevelSubject.next('Todos');
    this.coursesSubject.next(this.allCourses);
  }
}