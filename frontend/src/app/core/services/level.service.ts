import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Level, MyLevelInfo } from '../types';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class LevelService {
  private readonly api = inject(ApiService);

  list(): Observable<{ levels: Level[] }> {
    return this.api.get('/levels');
  }

  me(): Observable<MyLevelInfo> {
    return this.api.get('/levels/me');
  }
}
