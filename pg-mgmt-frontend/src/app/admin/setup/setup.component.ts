/* eslint-disable @angular-eslint/prefer-standalone */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { Room, RoomService } from '../../core/services/room.service';

type NumericInput = string | number | null;

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.css',
  standalone: false,
})
/**
 * Provides administrative workflows to edit room capacity, add rooms, and remove unused rooms.
 */
export class SetupComponent implements OnInit, OnDestroy {
  rooms: Room[] = [];
  selectedRoom: Room | null = null;
  selectedRoomId: string | null = null;
  capacityValue: number | null = null;
  commentsValue = '';
  isLoadingRooms = false;
  isSaving = false;
  isAddingRooms = false;
  isDeletingRoom = false;

  newFloorNo: number | null = null;
  newRoomNumbers = '';
  newCapacity: number | null = null;
  addRoomsError: string | null = null;
  deleteFloor: string | null = null;
  deleteRoomId: string | null = null;
  deleteRoomsError: string | null = null;
  capacityError: string | null = null;

  private readonly roomNoPattern = /^[A-Za-z0-9-]+$/;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly roomService: RoomService,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadRooms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Supplies a stable tracking key for ngFor iterations.
   */
  trackByRoomId(_: number, room: Room): string | undefined {
    return room.id;
  }

  /**
   * Determines whether the update button should be disabled.
   */
  get isSaveDisabled(): boolean {
    if (!this.selectedRoom || this.capacityValue == null) {
      return true;
    }

    if (this.capacityValue < 1) {
      return true;
    }

    if (this.capacityError) {
      return true;
    }

    if (this.isSaving) {
      return true;
    }

    return !this.hasChanges();
  }

  /**
   * Indicates when the bulk room creation form can be submitted.
   */
  get canSubmitNewRooms(): boolean {
    if (this.isAddingRooms) {
      return false;
    }

    if (this.newFloorNo == null || Number.isNaN(this.newFloorNo)) {
      return false;
    }

    if (this.newCapacity == null || this.newCapacity < 1) {
      return false;
    }

    const roomNumbers = this.parseRoomNumbers(this.newRoomNumbers);
    if (!roomNumbers.length) {
      return false;
    }

    return !this.addRoomsError;
  }

  /**
   * Distinct floor options derived from the current room list.
   */
  get floorOptions(): string[] {
    const floors = new Set<string>();
    for (const room of this.rooms) {
      if (room.floorNo && room.floorNo.trim().length > 0) {
        floors.add(room.floorNo);
      }
    }
    return Array.from(floors).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  }

  /**
   * Room choices filtered by the floor selected in the delete workflow.
   */
  get deleteRoomOptions(): Room[] {
    if (!this.deleteFloor) {
      return [];
    }

    return this.rooms
      .filter((room) => room.floorNo === this.deleteFloor)
      .sort((a, b) => a.roomNo.localeCompare(b.roomNo));
  }

  /**
   * Indicates whether the delete room action is currently blocked.
   */
  get isDeleteDisabled(): boolean {
    if (this.isDeletingRoom) {
      return true;
    }

    if (!this.deleteFloor || !this.deleteRoomId) {
      return true;
    }

    return false;
  }

  /**
   * Persists room capacity and comments updates.
   */
  onSave(): void {
    if (
      !this.selectedRoom ||
      this.capacityValue == null ||
      this.capacityValue < 1
    ) {
      return;
    }

    this.validateCapacity();
    if (this.capacityError) {
      return;
    }

    const capacity = Math.trunc(this.capacityValue);
    const comments = this.normalizeComment(this.commentsValue);

    this.isSaving = true;

    this.roomService
      .updateRoom(this.selectedRoom.id!, {
        capacity,
        comments,
      })
      .pipe(
        finalize(() => {
          this.isSaving = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (updatedRoom) => {
          this.selectedRoom = updatedRoom;
          this.rooms = this.rooms.map((room) =>
            room.id === updatedRoom.id ? { ...room, ...updatedRoom } : room,
          );
          this.applySelectedRoom(updatedRoom);
          this.snackBar.open(
            '✅ Room details updated successfully.',
            'Dismiss',
            {
              duration: 3000,
            },
          );
        },
        error: (error) => {
          console.error('❌ Failed to update room details', error);
          this.snackBar.open(
            '❌ Failed to update room. Please try again.',
            'Dismiss',
            {
              duration: 4000,
            },
          );
        },
      });
  }

  /**
   * Parses and validates manual capacity input.
   */
  onCapacityChange(value: NumericInput): void {
    if (value === null || value === '') {
      this.capacityValue = null;
      this.capacityError = null;
      return;
    }

    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(parsed)) {
      this.capacityValue = null;
      this.capacityError = null;
      return;
    }

    this.capacityValue = parsed;
    this.validateCapacity();
  }

  /**
   * Synchronizes comments text area changes with internal state.
   */
  onCommentsChange(value: string | null): void {
    this.commentsValue = value ?? '';
  }

  /**
   * Validates and submits the bulk room creation workflow.
   */
  onAddRooms(): void {
    this.addRoomsError = null;

    if (this.newFloorNo == null || Number.isNaN(this.newFloorNo)) {
      this.addRoomsError = 'Provide a valid floor number.';
      return;
    }

    if (this.newCapacity == null || this.newCapacity < 1) {
      this.addRoomsError = 'Capacity must be at least 1.';
      return;
    }

    const roomNumbers = this.parseRoomNumbers(this.newRoomNumbers);
    if (!roomNumbers.length) {
      this.addRoomsError = 'Enter at least one room number.';
      return;
    }

    const invalidRooms = roomNumbers.filter(
      (roomNo) => !this.roomNoPattern.test(roomNo),
    );
    if (invalidRooms.length) {
      this.addRoomsError = `Invalid room number format: ${invalidRooms.join(', ')}`;
      return;
    }

    const capacity = Math.trunc(this.newCapacity);
    const floorNo = this.newFloorNo.toString();

    this.isAddingRooms = true;

    this.roomService
      .createRooms(
        roomNumbers.map((roomNo) => ({
          roomNo,
          capacity,
          floorNo,
          comments: null,
        })),
      )
      .pipe(
        finalize(() => {
          this.isAddingRooms = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (createdRooms) => {
          if (createdRooms.length) {
            this.rooms = [...this.rooms, ...createdRooms].sort((a, b) =>
              a.roomNo.localeCompare(b.roomNo),
            );
            this.snackBar.open(
              createdRooms.length === 1
                ? `🏠 Room ${createdRooms[0].roomNo} added.`
                : `🏠 ${createdRooms.length} rooms added successfully.`,
              'Dismiss',
              {
                duration: 3000,
              },
            );
          } else {
            this.snackBar.open('ℹ️ No rooms were created.', 'Dismiss', {
              duration: 3000,
            });
          }

          this.resetAddRoomsForm();
        },
        error: (error) => {
          console.error('❌ Failed to create rooms', error);
          this.addRoomsError = 'Failed to create rooms. Please try again.';
          this.snackBar.open(
            '❌ Unable to create rooms. Please try again.',
            'Dismiss',
            {
              duration: 4000,
            },
          );
        },
      });
  }

  /**
   * Clears validation error messaging when form fields change.
   */
  onAddRoomsFieldChange(): void {
    if (this.addRoomsError) {
      this.addRoomsError = null;
    }
  }

  /**
   * Normalizes floor number input for the add rooms form.
   */
  onNewFloorChange(value: NumericInput): void {
    this.onAddRoomsFieldChange();
    if (value === null || value === '') {
      this.newFloorNo = null;
      return;
    }

    const parsed = typeof value === 'number' ? value : Number(value);
    this.newFloorNo = Number.isNaN(parsed) ? null : parsed;
  }

  /**
   * Normalizes capacity input for the add rooms form.
   */
  onNewCapacityChange(value: NumericInput): void {
    this.onAddRoomsFieldChange();
    if (value === null || value === '') {
      this.newCapacity = null;
      return;
    }

    const parsed = typeof value === 'number' ? value : Number(value);
    this.newCapacity = Number.isNaN(parsed) ? null : parsed;
  }

  /**
   * Normalizes room number list input for the add rooms form.
   */
  onNewRoomNumbersChange(value: string | null): void {
    this.onAddRoomsFieldChange();
    this.newRoomNumbers = value ?? '';
  }

  /**
   * Handles floor selection changes for the delete workflow.
   */
  onDeleteFloorChange(floorNo: string | null): void {
    if (this.deleteRoomsError) {
      this.deleteRoomsError = null;
    }

    this.deleteFloor = floorNo;
    this.deleteRoomId = null;
  }

  /**
   * Stores the selected room for deletion.
   */
  onDeleteRoomSelected(roomId: string | null): void {
    if (this.deleteRoomsError) {
      this.deleteRoomsError = null;
    }

    this.deleteRoomId = roomId;
  }

  /**
   * Deletes the chosen room after validating dependencies.
   */
  onDeleteRoom(): void {
    this.deleteRoomsError = null;

    if (!this.deleteRoomId) {
      this.deleteRoomsError = 'Select a room to delete.';
      return;
    }

    const room = this.rooms.find((item) => item.id === this.deleteRoomId);
    if (!room) {
      this.deleteRoomsError = 'Selected room could not be found.';
      return;
    }

    if (room.allocatedCount > 0) {
      this.deleteRoomsError = `Room ${room.roomNo} has ${room.allocatedCount} tenant(s). Move them before deleting.`;
      this.snackBar.open(
        '⚠️ Move the tenants assigned to this room before deleting it.',
        'Dismiss',
        {
          duration: 4000,
        },
      );
      return;
    }

    this.isDeletingRoom = true;

    this.roomService
      .deleteRoom(room.id!)
      .pipe(
        finalize(() => {
          this.isDeletingRoom = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => {
          this.rooms = this.rooms.filter((item) => item.id !== room.id);

          if (this.selectedRoom?.id === room.id) {
            this.onRoomSelected(null);
          }

          if (this.deleteRoomId === room.id) {
            this.deleteRoomId = null;
          }

          if (!this.deleteRoomOptions.length) {
            this.deleteFloor = null;
          }

          this.snackBar.open(
            `🗑️ Room ${room.roomNo} deleted successfully.`,
            'Dismiss',
            {
              duration: 3000,
            },
          );
        },
        error: (error) => {
          console.error('🗑️ Failed to delete room', error);
          this.deleteRoomsError = 'Unable to delete room. Please try again.';
          this.snackBar.open(
            '❌ Failed to delete room. Please try again.',
            'Dismiss',
            {
              duration: 4000,
            },
          );
        },
      });
  }

  /**
   * Loads the latest room data and reconciles view selections.
   */
  private loadRooms(): void {
    this.isLoadingRooms = true;
    this.roomService
      .getRooms()
      .pipe(
        finalize(() => (this.isLoadingRooms = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (rooms) => {
          this.rooms = [...rooms].sort((a, b) =>
            a.roomNo.localeCompare(b.roomNo),
          );

          if (this.selectedRoomId) {
            const match = this.rooms.find(
              (room) => room.id === this.selectedRoomId,
            );
            if (match) {
              this.selectedRoom = match;
              this.applySelectedRoom(match);
            } else {
              this.onRoomSelected(null);
            }
          }

          if (this.deleteRoomId) {
            const deleteMatch = this.rooms.find(
              (room) => room.id === this.deleteRoomId,
            );
            if (!deleteMatch) {
              this.deleteRoomId = null;
            }
          }

          if (
            this.deleteFloor &&
            !this.floorOptions.includes(this.deleteFloor)
          ) {
            this.deleteFloor = null;
          }
        },
        error: (error) => {
          console.error('🚧 Failed to load rooms list', error);
          this.snackBar.open(
            '🚧 Unable to load rooms. Please refresh and try again.',
            'Dismiss',
            {
              duration: 4000,
            },
          );
        },
      });
  }

  /**
   * Associates the selected room identifier with the view state.
   */
  onRoomSelected(roomId: string | null): void {
    this.selectedRoomId = roomId;

    if (!roomId) {
      this.selectedRoom = null;
      this.applySelectedRoom(null);
      return;
    }

    const matchingRoom = this.rooms.find((room) => room.id === roomId);
    if (matchingRoom) {
      this.selectedRoom = matchingRoom;
      this.applySelectedRoom(matchingRoom);
    } else {
      this.selectedRoom = null;
      this.applySelectedRoom(null);
    }
  }

  /**
   * Applies the currently selected room to the edit form.
   */
  private applySelectedRoom(room: Room | null): void {
    if (room) {
      this.capacityValue = room.capacity;
      this.commentsValue = room.comments ?? '';
    } else {
      this.capacityValue = null;
      this.commentsValue = '';
    }

    this.validateCapacity();
  }

  /**
   * Determines if the edit form differs from the persisted room values.
   */
  private hasChanges(): boolean {
    if (!this.selectedRoom) {
      return false;
    }

    const normalizedComments = this.normalizeComment(this.commentsValue) ?? '';
    const originalComments =
      this.normalizeComment(this.selectedRoom.comments ?? '') ?? '';

    return (
      this.capacityValue !== this.selectedRoom.capacity ||
      normalizedComments !== originalComments
    );
  }

  /**
   * Normalizes comments strings by trimming whitespace.
   */
  private normalizeComment(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  /**
   * Validates that the requested capacity is not below current usage.
   */
  private validateCapacity(): void {
    if (!this.selectedRoom || this.capacityValue == null) {
      this.capacityError = null;
      return;
    }

    const capacity = Math.trunc(this.capacityValue);

    if (capacity < this.selectedRoom.allocatedCount) {
      this.capacityError = `Capacity cannot be less than allocated count (${this.selectedRoom.allocatedCount}).`;
      return;
    }

    this.capacityError = null;
  }

  /**
   * Resets the add rooms form state.
   */
  resetAddRoomsForm(): void {
    this.newFloorNo = null;
    this.newRoomNumbers = '';
    this.newCapacity = null;
    this.addRoomsError = null;
  }

  /**
   * Parses comma-delimited room numbers into an array.
   */
  private parseRoomNumbers(value: string): string[] {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }

  /**
   * Resets the delete room workflow to its defaults.
   */
  resetDeleteForm(): void {
    this.deleteFloor = null;
    this.deleteRoomId = null;
    this.deleteRoomsError = null;
  }
}
