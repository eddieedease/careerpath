import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { Explore } from './explore';

describe('Explore', () => {
  let component: Explore;
  let fixture: ComponentFixture<Explore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Explore],
      providers: [
        provideHttpClient(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Explore);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
