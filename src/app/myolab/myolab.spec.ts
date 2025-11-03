import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Myolab } from './myolab';

describe('Myolab', () => {
  let component: Myolab;
  let fixture: ComponentFixture<Myolab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Myolab]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Myolab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
