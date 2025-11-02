import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Course {
  id: number;
  title: string;
  instructor: string;
  category: string;
  level: string;
  students: number;
  image: string;
  rating: number;
}

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
export class Home {
  searchQuery: string = '';
  
  categories: Category[] = [
    { name: 'Ingeniería', icon: '⚙️', count: 234 },
    { name: 'Ciencias', icon: '🔬', count: 189 },
    { name: 'Matemáticas', icon: '📐', count: 156 },
    { name: 'Programación', icon: '💻', count: 312 },
    { name: 'Negocios', icon: '💼', count: 145 },
    { name: 'Artes', icon: '🎨', count: 98 }
  ];

  featuredCourses: Course[] = [
    {
      id: 1,
      title: 'Introducción a la Inteligencia Artificial',
      instructor: 'Dr. María González',
      category: 'Programación',
      level: 'Intermedio',
      students: 1250,
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop',
      rating: 4.8
    },
    {
      id: 2,
      title: 'Algoritmos y Estructuras de Datos',
      instructor: 'Prof. Carlos Ruiz',
      category: 'Programación',
      level: 'Avanzado',
      students: 890,
      image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=250&fit=crop',
      rating: 4.9
    },
    {
      id: 3,
      title: 'Física Cuántica: Fundamentos',
      instructor: 'Dra. Ana Martínez',
      category: 'Ciencias',
      level: 'Avanzado',
      students: 654,
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop',
      rating: 4.7
    },
    {
      id: 4,
      title: 'Cálculo Multivariable',
      instructor: 'Prof. Jorge López',
      category: 'Matemáticas',
      level: 'Intermedio',
      students: 1100,
      image: 'https://images.unsplash.com/photo-1635372722656-389f87a941b7?w=400&h=250&fit=crop',
      rating: 4.6
    },
    {
      id: 5,
      title: 'Desarrollo Web Full Stack',
      instructor: 'Ing. Laura Sánchez',
      category: 'Programación',
      level: 'Intermedio',
      students: 2340,
      image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop',
      rating: 4.9
    },
    {
      id: 6,
      title: 'Química Orgánica Avanzada',
      instructor: 'Dr. Roberto Díaz',
      category: 'Ciencias',
      level: 'Avanzado',
      students: 567,
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=250&fit=crop',
      rating: 4.5
    }
  ];

  stats = [
    { value: '2,400+', label: 'Cursos Disponibles' },
    { value: '50,000+', label: 'Estudiantes Activos' },
    { value: '500+', label: 'Instructores Expertos' },
    { value: '95%', label: 'Tasa de Satisfacción' }
  ];

  onSearch(): void {
    console.log('Buscando:', this.searchQuery);
    // Aquí implementarías la lógica de búsqueda
  }

  onCategoryClick(category: Category): void {
    console.log('Categoría seleccionada:', category.name);
    // Aquí navegarías a la página de cursos filtrados por categoría
  }

  onCourseClick(course: Course): void {
    console.log('Curso seleccionado:', course.title);
    // Aquí navegarías a la página de detalles del curso
  }
}