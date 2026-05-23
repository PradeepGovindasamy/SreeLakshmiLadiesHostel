/** Display label combining sharing capacity with AC status. */
export function formatRoomType(room) {
  if (!room) return 'Not specified';

  const sharing = room.sharing_type_display
    ?? (room.sharing_type ? `${room.sharing_type}-Sharing` : 'Not specified');

  if (sharing === 'Not specified') return sharing;

  return room.ac_room ? `${sharing} · AC` : `${sharing} · Non-AC`;
}
