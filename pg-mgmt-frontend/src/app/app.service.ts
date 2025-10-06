import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiConfig } from './core/config/api.config';

/** Example service showcasing how to reach the backend API root. */
@Injectable({
  providedIn: 'root',
})
export class AppService {
  private readonly baseUrl = `${ApiConfig.base}/api`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Demonstrates a simple text-based GET request to the backend.
   */
  getHello(): Observable<string> {
    return this.http.get(this.baseUrl + '/hello', { responseType: 'text' });
  }
}
