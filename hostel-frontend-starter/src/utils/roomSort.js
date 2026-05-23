/** Building order: Ground (G) → First (F) → Second (S) → Third (T), then others */

export function getRoomFloorGroup(room) {
  const name = (room?.room_name || '').trim().toUpperCase();
  const prefix = name.charAt(0);
  if (prefix === 'G') return { order: 0, group: 'G', title: 'Ground floor (G)' };
  if (prefix === 'F') return { order: 1, group: 'F', title: 'First floor (F)' };
  if (prefix === 'S') return { order: 2, group: 'S', title: 'Second floor (S)' };
  if (prefix === 'T') return { order: 3, group: 'T', title: 'Third floor (T)' };

  const floor = room?.floor_number;
  if (floor === 0) return { order: 0, group: 'G', title: 'Ground floor' };
  if (floor === 1) return { order: 1, group: 'F', title: 'First floor' };
  if (floor === 2) return { order: 2, group: 'S', title: 'Second floor' };
  if (floor === 3) return { order: 3, group: 'T', title: 'Third floor' };

  return { order: 9, group: 'OTHER', title: 'Other rooms' };
}

export function compareRoomsByBuildingHierarchy(a, b) {
  const ga = getRoomFloorGroup(a);
  const gb = getRoomFloorGroup(b);
  if (ga.order !== gb.order) return ga.order - gb.order;
  return (a.room_name || '').localeCompare(b.room_name || '', undefined, { numeric: true });
}

export function sortRoomsByBuildingHierarchy(rooms) {
  return [...rooms].sort(compareRoomsByBuildingHierarchy);
}

/** Group rooms into G / F / S / T sections for display */
export function groupRoomsByFloor(rooms) {
  const sorted = sortRoomsByBuildingHierarchy(rooms);
  const sections = [];
  const indexByGroup = {};

  sorted.forEach(room => {
    const { group, title, order } = getRoomFloorGroup(room);
    if (indexByGroup[group] == null) {
      indexByGroup[group] = sections.length;
      sections.push({ title, order, group, data: [] });
    }
    sections[indexByGroup[group]].data.push(room);
  });

  return sections.sort((a, b) => a.order - b.order);
}
