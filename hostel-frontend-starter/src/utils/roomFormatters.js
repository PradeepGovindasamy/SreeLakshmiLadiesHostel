/** Whether the room has AC (uses backend ac_room field, not the display label). */
export function isAcRoom(room) {
  const value = room?.ac_room;
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;
  if (typeof value === 'string') {
    return ['true', '1', 'yes'].includes(value.toLowerCase());
  }
  return false;
}

/** Filter rooms by AC type using the ac_room boolean field. */
export function filterRoomsByAc(rooms, acFilter) {
  if (!acFilter || acFilter === 'all') return rooms;
  if (String(acFilter) === 'true') return rooms.filter(isAcRoom);
  return rooms.filter(room => !isAcRoom(room));
}

/** Sharing type only (AC shown separately). */
export function formatRoomType(room) {
  if (!room) return 'Not specified';

  return room.sharing_type_display
    ?? (room.sharing_type ? `${room.sharing_type}-Sharing` : 'Not specified');
}

/** AC / Non-AC label for display chips (always shown on room cards). */
export function formatRoomAcLabel(room) {
  return isAcRoom(room) ? 'AC' : 'Non-AC';
}
