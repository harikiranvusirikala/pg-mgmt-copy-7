import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';

import { RoomsComponent } from './rooms.component';
import { MaterialModule } from '../../material.module';
import { RoomService } from '../../core/services/room.service';

describe('RoomsComponent', () => {
  let component: RoomsComponent;
  let fixture: ComponentFixture<RoomsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RoomsComponent],
      imports: [CommonModule, MaterialModule],
      providers: [
        {
          provide: RoomService,
          useValue: {
            getRooms: () => of([]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
