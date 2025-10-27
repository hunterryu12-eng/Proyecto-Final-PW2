import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Agentes } from './agentes';

describe('Agentes', () => {
  let component: Agentes;
  let fixture: ComponentFixture<Agentes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Agentes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Agentes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
