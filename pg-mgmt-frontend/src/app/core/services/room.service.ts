import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiConfig } from '../config/api.config';

export interface Room {
  id?: string;
  roomNo: string;
  capacity: number;
  floorNo: string;
  comments?: string;
  allocatedCount: number;
}

export interface RoomUpdatePayload {
  capacity?: number;
  comments?: string | null;
}

export interface CreateRoomPayload {
  roomNo: string;
  capacity: number;
  floorNo: string;
  comments?: string | null;
  allocatedCount?: number;
}

@Injectable({ providedIn: 'root' })
/** Provides CRUD helpers for room management flows. */
export class RoomService {
  private readonly apiUrl = ApiConfig.rooms;

  constructor(private readonly http: HttpClient) {}

  getRooms(): Observable<Room[]> {
    return this.http
      .get<Room[]>(this.apiUrl)
      .pipe(
        map((rooms) => (rooms ?? []).map((room) => this.normalizeRoom(room))),
      );
  }

  updateRoom(roomId: string, payload: RoomUpdatePayload): Observable<Room> {
    return this.http
      .patch<Room>(`${this.apiUrl}/${roomId}`, payload)
      .pipe(map((room) => this.normalizeRoom(room)));
  }

  createRooms(payloads: CreateRoomPayload[]): Observable<Room[]> {
    if (!payloads.length) {
      return of([]);
    }

    const requests = payloads.map((payload) =>
      this.http
        .post<Room>(this.apiUrl, {
          ...payload,
          allocatedCount: payload.allocatedCount ?? 0,
        })
        .pipe(map((room) => this.normalizeRoom(room))),
    );

    return forkJoin(requests);
  }

  deleteRoom(roomId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${roomId}`);
  }

  private normalizeRoom(room: Room | null | undefined): Room {
    return {
      id: room?.id,
      roomNo: room?.roomNo ?? '',
      capacity: room?.capacity ?? 0,
      floorNo: room?.floorNo ?? '',
      comments: room?.comments ?? undefined,
      allocatedCount: room?.allocatedCount ?? 0,
    };
  }
}
