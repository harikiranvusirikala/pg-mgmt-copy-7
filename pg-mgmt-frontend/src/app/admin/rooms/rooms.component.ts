/* eslint-disable @angular-eslint/prefer-standalone */
import { Component, OnInit } from '@angular/core';
import { RoomService, Room } from '../../core/services/room.service';

interface FloorGroup {
  floorLabel: string;
  rooms: Room[];
}

@Component({
  selector: 'app-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.css'],
  standalone: false,
})
/**
 * Displays rooms grouped by floor with filtering and occupancy insights.
 */
export class RoomsComponent implements OnInit {
  readonly ALL_FLOORS_OPTION = 'ALL';
  roomsByFloor: FloorGroup[] = [];
  selectedFloorLabel = this.ALL_FLOORS_OPTION;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(private readonly roomService: RoomService) {}

  ngOnInit(): void {
    this.loadRooms();
  }

  /**
   * Fetches rooms from the API and organizes them into floor groupings.
   */
  private loadRooms(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.roomService.getRooms().subscribe({
      next: (rooms) => {
        this.roomsByFloor = this.buildFloorGroups(rooms);
        this.ensureValidFloorSelection();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('🚪 Failed to load rooms:', error);
        this.errorMessage =
          'Unable to load rooms at the moment. Please try again later.';
        this.isLoading = false;
      },
    });
  }

  /**
   * Returns rooms filtered by the current floor selection.
   */
  get filteredFloors(): FloorGroup[] {
    if (this.selectedFloorLabel === this.ALL_FLOORS_OPTION) {
      return this.roomsByFloor;
    }
    return this.roomsByFloor.filter(
      (floor) => floor.floorLabel === this.selectedFloorLabel,
    );
  }

  /**
   * Updates the active floor filter.
   */
  onFloorFilterChange(floorLabel: string): void {
    this.selectedFloorLabel = floorLabel ?? this.ALL_FLOORS_OPTION;
  }

  /**
   * Groups rooms by floor and sorts both floors and rooms naturally.
   */
  private buildFloorGroups(rooms: Room[]): FloorGroup[] {
    const floorMap = new Map<string, Room[]>();

    rooms
      .filter((room) => !!room)
      .forEach((room) => {
        const floorKey = (room.floorNo ?? '').trim();
        const existingRooms = floorMap.get(floorKey) ?? [];
        existingRooms.push(room);
        floorMap.set(floorKey, existingRooms);
      });

    const groups: Array<FloorGroup & { sortValue: number }> = Array.from(
      floorMap.entries(),
    ).map(([floor, floorRooms]) => ({
      floorLabel: this.getFloorLabel(floor),
      rooms: [...floorRooms].sort((a, b) =>
        this.compareRoomNumbers(a.roomNo, b.roomNo),
      ),
      sortValue: this.getFloorSortValue(floor),
    }));

    groups.sort((a, b) => {
      if (a.sortValue === b.sortValue) {
        return a.floorLabel.localeCompare(b.floorLabel, undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      }
      return a.sortValue - b.sortValue;
    });

    return groups.map(({ sortValue, ...group }) => group);
  }

  /**
   * Formats the raw floor value for display.
   */
  private getFloorLabel(floor: string): string {
    if (!floor) {
      return 'Unknown';
    }

    const trimmed = floor.trim();
    const floorNumber = this.findFloorNumber(trimmed);
    if (floorNumber === null) {
      return trimmed;
    }

    return String(floorNumber);
  }

  /**
   * Determines a numeric sort key for a floor label when possible.
   */
  private getFloorSortValue(floor: string): number {
    const floorNumber = this.findFloorNumber(floor);
    return floorNumber ?? Number.POSITIVE_INFINITY;
  }

  /**
   * Calculates an alpha value for the occupancy gradient indicator.
   */
  getOccupancyAlpha(room: Room): string {
    if (!room) {
      return '0';
    }

    const capacity = Math.max(room.capacity ?? 0, 0);
    if (capacity === 0) {
      return '0';
    }

    const occupied = Math.min(Math.max(room.allocatedCount ?? 0, 0), capacity);
    const ratio = occupied / capacity;

    const maxOpacity = 1; // medium opacity when fully occupied
    const alpha = Math.min(Math.max(ratio * maxOpacity, 0), maxOpacity);
    return alpha.toFixed(2);
  }

  /**
   * Compares room numbers using locale-aware numeric ordering.
   */
  private compareRoomNumbers(a: string, b: string): number {
    return (a ?? '').localeCompare(b ?? '', undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  /**
   * Attempts to extract a floor number from a string.
   */
  private findFloorNumber(value: string): number | null {
    const match = /\d+/.exec(value);
    if (!match) {
      return null;
    }

    const parsed = Number(match[0]);
    return Number.isNaN(parsed) ? null : parsed;
  }

  /**
   * Ensures the selected floor remains valid after data refresh.
   */
  private ensureValidFloorSelection(): void {
    if (
      this.selectedFloorLabel !== this.ALL_FLOORS_OPTION &&
      !this.roomsByFloor.some(
        (floor) => floor.floorLabel === this.selectedFloorLabel,
      )
    ) {
      this.selectedFloorLabel = this.ALL_FLOORS_OPTION;
    }
  }
}
