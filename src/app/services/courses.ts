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
      category: 'Ciencias',
      level: 'Intermedio',
      students: 2340,
      image: 'https://investigacion.pucp.edu.pe/grupos/girab/wp-content/uploads/sites/108/2019/03/Image-1.jpg',
      rating: 4.9,
      description: 'Aprende cómo funcionan las prótesis mioeléctricas controlando una de manera remota.',
      duration: '4 semanas',
      tags: ['prótesis', 'internet', 'impresión 3d']
    },
    {
      id: 2,
      title: 'Algoritmos y Estructuras de Datos',
      instructor: 'Prof. Carlos Ruiz',
      category: 'Programación',
      level: 'Avanzado',
      students: 890,
      image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=250&fit=crop',
      rating: 4.9,
      description: 'Domina las estructuras de datos fundamentales y algoritmos eficientes.',
      duration: '10 semanas',
      tags: ['algoritmos', 'estructuras de datos', 'programación', 'complejidad']
    },
    {
      id: 3,
      title: 'Física Cuántica: Fundamentos',
      instructor: 'Dra. Ana Martínez',
      category: 'Ciencias',
      level: 'Avanzado',
      students: 654,
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop',
      rating: 4.7,
      description: 'Explora los principios fundamentales de la mecánica cuántica.',
      duration: '14 semanas',
      tags: ['física', 'cuántica', 'mecánica', 'ciencias']
    },
    {
      id: 4,
      title: 'Cálculo Multivariable',
      instructor: 'Prof. Jorge López',
      category: 'Matemáticas',
      level: 'Intermedio',
      students: 1100,
      image: 'https://images.unsplash.com/photo-1635372722656-389f87a941b7?w=400&h=250&fit=crop',
      rating: 4.6,
      description: 'Estudia funciones de varias variables, derivadas parciales e integrales múltiples.',
      duration: '8 semanas',
      tags: ['cálculo', 'matemáticas', 'derivadas', 'integrales']
    },
    {
      id: 5,
      title: 'Desarrollo Web Full Stack',
      instructor: 'Ing. Laura Sánchez',
      category: 'Programación',
      level: 'Intermedio',
      students: 2340,
      image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop',
      rating: 4.9,
      description: 'Aprende a crear aplicaciones web completas desde el frontend hasta el backend.',
      duration: '16 semanas',
      tags: ['web', 'full stack', 'frontend', 'backend', 'javascript']
    },
    {
      id: 6,
      title: 'Química Orgánica Avanzada',
      instructor: 'Dr. Roberto Díaz',
      category: 'Ciencias',
      level: 'Avanzado',
      students: 567,
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=250&fit=crop',
      rating: 4.5,
      description: 'Profundiza en reacciones orgánicas, síntesis y mecanismos de reacción.',
      duration: '12 semanas',
      tags: ['química', 'orgánica', 'reacciones', 'síntesis']
    },
    {
      id: 7,
      title: 'Bases de Datos Relacionales',
      instructor: 'Ing. Patricia Morales',
      category: 'Programación',
      level: 'Intermedio',
      students: 1450,
      image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=250&fit=crop',
      rating: 4.7,
      description: 'Aprende SQL, diseño de bases de datos y optimización de consultas.',
      duration: '10 semanas',
      tags: ['sql', 'bases de datos', 'mysql', 'postgresql']
    },
    {
      id: 8,
      title: 'Estadística y Probabilidad',
      instructor: 'Dr. Fernando Castro',
      category: 'Matemáticas',
      level: 'Básico',
      students: 1890,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
      rating: 4.8,
      description: 'Fundamentos de estadística descriptiva, inferencial y teoría de probabilidad.',
      duration: '8 semanas',
      tags: ['estadística', 'probabilidad', 'matemáticas', 'análisis']
    },
    {
      id: 9,
      title: 'Arquitectura de Software',
      instructor: 'Ing. Miguel Herrera',
      category: 'Programación',
      level: 'Avanzado',
      students: 780,
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop',
      rating: 4.6,
      description: 'Diseña sistemas escalables y mantenibles con patrones de arquitectura modernos.',
      duration: '12 semanas',
      tags: ['arquitectura', 'software', 'patrones', 'diseño']
    },
    {
      id: 10,
      title: 'Biología Molecular',
      instructor: 'Dra. Carmen Vega',
      category: 'Ciencias',
      level: 'Intermedio',
      students: 920,
      image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=250&fit=crop',
      rating: 4.7,
      description: 'Estudia la estructura y función de macromoléculas biológicas.',
      duration: '10 semanas',
      tags: ['biología', 'molecular', 'adn', 'proteínas']
    },
    {
      id: 11,
      title: 'Álgebra Lineal',
      instructor: 'Prof. Ricardo Mendoza',
      category: 'Matemáticas',
      level: 'Intermedio',
      students: 1560,
      image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=250&fit=crop',
      rating: 4.9,
      description: 'Vectores, matrices, espacios vectoriales y transformaciones lineales.',
      duration: '10 semanas',
      tags: ['álgebra', 'lineal', 'matrices', 'vectores']
    },
    {
      id: 12,
      title: 'Ciberseguridad Fundamentals',
      instructor: 'Ing. Andrea Silva',
      category: 'Programación',
      level: 'Intermedio',
      students: 1340,
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop',
      rating: 4.8,
      description: 'Aprende a proteger sistemas y redes contra amenazas cibernéticas.',
      duration: '12 semanas',
      tags: ['seguridad', 'ciberseguridad', 'hacking', 'redes']
    },
    {
      id: 13,
      title: 'Introducción a la Inteligencia Artificial',
      instructor: 'Dr. María González',
      category: 'Programación',
      level: 'Intermedio',
      students: 1250,
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop',
      rating: 4.8,
      description: 'Aprende los fundamentos de la IA, machine learning y redes neuronales.',
      duration: '12 semanas',
      tags: ['inteligencia artificial', 'machine learning', 'python', 'redes neuronales']
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