import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Layout } from './components/layout/layout';
import { Courses } from './components/courses/courses';
import { Myolab } from './myolab/myolab';

export const routes: Routes = [
    {
        path: '',
        component: Layout,
        children: [
            {path: '', component: Home},
            {path: 'cursos', component: Courses},
            // añadir las demás rutas cuando las cree
            // laboratorios, acerca-de, contacto
        ]
    },
    {path: 'myolab', component: Myolab},
    {path: '**', redirectTo: ''}
];
