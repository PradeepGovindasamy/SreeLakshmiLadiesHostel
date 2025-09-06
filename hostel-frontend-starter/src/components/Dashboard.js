// src/components/Dashboard.js
import React from 'react';
import ConditionalDashboard from './ConditionalDashboard';

/**
 * Main Dashboard component that automatically routes to role-based dashboard
 * This is kept for backward compatibility and simplicity
 */
const Dashboard = () => {
  return <ConditionalDashboard />;
};

export default Dashboard;
