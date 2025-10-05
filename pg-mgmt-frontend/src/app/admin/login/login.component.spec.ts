// eslint-disable-next-line deprecation/deprecation
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
// eslint-disable-next-line deprecation/deprecation
import { RouterTestingModule } from '@angular/router/testing';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { BehaviorSubject } from 'rxjs';

import { AdminAuthService } from '../../core/services/admin-auth.service';
import { AdminLoginComponent } from './login.component';

describe('AdminLoginComponent', () => {
  let component: AdminLoginComponent;
  let fixture: ComponentFixture<AdminLoginComponent>;

  const authState$ = new BehaviorSubject<SocialUser | null>(null);
  const socialAuthServiceStub = {
    authState: authState$.asObservable(),
    signOut: jasmine.createSpy('signOut'),
  } as Partial<SocialAuthService>;

  const adminAuthServiceStub: Partial<AdminAuthService> = {
    getToken: jasmine.createSpy('getToken').and.returnValue(null),
    logout: jasmine.createSpy('logout'),
    setCurrentAdmin: jasmine
      .createSpy('setCurrentAdmin')
      .and.callFake((admin) => admin),
  };

  const routerStub = {
    navigate: jasmine
      .createSpy('navigate')
      .and.returnValue(Promise.resolve(true)),
  } as Partial<Router>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // eslint-disable-next-line deprecation/deprecation
      imports: [
        AdminLoginComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: SocialAuthService, useValue: socialAuthServiceStub },
        { provide: AdminAuthService, useValue: adminAuthServiceStub },
        { provide: Router, useValue: routerStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
