/** User-facing labels — backend role/API still uses "tenant" */
export const RESIDENT = {
  singular: 'Resident',
  plural: 'Residents',
  management: 'Resident Management',
  details: 'Resident Details',
  add: 'Add Resident',
  edit: 'Edit Resident',
  activeSection: 'Active Residents',
  vacatedSection: 'Vacated Residents',
  role: 'Resident',
  noRoom: 'No room assigned',
  notFound: 'Resident not found',
  searchPlaceholder: 'Search name, room, phone...',
};

export const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  warden: 'Warden',
  tenant: 'Resident',
};

export function roleLabel(role) {
  return ROLE_LABELS[(role || '').toLowerCase()] || role || '';
}
