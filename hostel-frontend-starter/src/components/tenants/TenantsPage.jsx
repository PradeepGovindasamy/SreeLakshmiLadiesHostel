import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import ActiveTenantsSection from './ActiveTenantsSection';
import VacatedTenantsSection from './VacatedTenantsSection';

/**
 * Main Tenants Management Page
 * Displays Active and Vacated tenants in separate sections on the same page (NO tabs)
 * 
 * Structure:
 * - Active Tenants Section (always loaded, editable, actionable)
 * - Divider
 * - Vacated Tenants Section (lazy loaded, read-only, paginated)
 * 
 * Both sections share and respect the same filter infrastructure:
 * - Property/Branch filter
 * - Room filter
 * - Search (Name/Email/Phone)
 */
function TenantsPage() {
  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tenant Management
      </Typography>
      
      {/* Active Tenants Section - loaded immediately, fully functional */}
      <ActiveTenantsSection />
      
      {/* Visual separator between active and vacated sections */}
      <Divider sx={{ my: 6 }} />
      
      {/* Vacated Tenants Section - lazy loaded, read-only historical records */}
      <VacatedTenantsSection />
    </Box>
  );
}

export default TenantsPage;
