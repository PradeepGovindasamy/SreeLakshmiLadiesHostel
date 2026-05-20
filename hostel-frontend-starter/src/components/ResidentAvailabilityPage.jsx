import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CardHeader,
  Switch, FormControlLabel, Chip, Divider, Alert, CircularProgress,
  Tooltip, IconButton, Button, Snackbar,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  FreeBreakfast as BreakfastIcon,
  LunchDining as LunchIcon,
  DinnerDining as DinnerIcon,
  Cookie as SnacksIcon,
  AccessTime as ClockIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { enhancedAPI } from '../api';

const MEAL_CONFIG = {
  breakfast: { label: 'Breakfast', icon: <BreakfastIcon />, color: '#FF9800' },
  lunch:     { label: 'Lunch',     icon: <LunchIcon />,     color: '#4CAF50' },
  snacks:    { label: 'Snacks',    icon: <SnacksIcon />,    color: '#9C27B0' },
  dinner:    { label: 'Dinner',    icon: <DinnerIcon />,    color: '#2196F3' },
};

const DAY_NAMES = ['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
}

function getDayLabel(index) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  const d = new Date();
  d.setDate(d.getDate() + index);
  return d.toLocaleDateString('en-IN', { weekday: 'short' });
}

export default function ResidentAvailabilityPage() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const showSnack = (message, severity = 'success') =>
    setSnack({ open: true, message, severity });

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await enhancedAPI.mealAvailability.myAvailability();
      setDays(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load availability data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  const handleToggle = async (dayIndex, mealType) => {
    const day = days[dayIndex];
    const meal = day.meals[mealType];

    if (!meal.can_modify) {
      showSnack(`Cutoff passed for ${mealType}. ${meal.cutoff}`, 'warning');
      return;
    }

    const newValue = !meal.is_available;

    // Optimistic update
    setDays(prev => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        meals: {
          ...updated[dayIndex].meals,
          [mealType]: { ...updated[dayIndex].meals[mealType], is_available: newValue },
        },
      };
      return updated;
    });

    setSaving(true);
    try {
      await enhancedAPI.mealAvailability.bulkUpdate([
        { date: day.date, meal_type: mealType, is_available: newValue },
      ]);
      showSnack(
        newValue
          ? `You are now marked available for ${MEAL_CONFIG[mealType].label}`
          : `You have opted out of ${MEAL_CONFIG[mealType].label}`,
        newValue ? 'success' : 'info'
      );
    } catch (err) {
      // Revert on failure
      setDays(prev => {
        const updated = [...prev];
        updated[dayIndex] = {
          ...updated[dayIndex],
          meals: {
            ...updated[dayIndex].meals,
            [mealType]: { ...updated[dayIndex].meals[mealType], is_available: !newValue },
          },
        };
        return updated;
      });
      showSnack(err.response?.data?.error || err.response?.data?.[0]?.error || 'Failed to update.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <RestaurantIcon color="primary" />
          <Typography variant="h5" fontWeight={600}>Meal Availability</Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchAvailability} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Cutoff rules:</strong> Opt out of Breakfast/Lunch by <strong>8:00 PM the previous evening</strong>.
        Opt out of Snacks/Dinner by <strong>2:00 PM the same day</strong>.
        Default is <strong>Available</strong> if nothing is marked.
      </Alert>

      <Grid container spacing={2}>
        {days.map((day, dayIndex) => (
          <Grid item xs={12} sm={6} md={4} key={day.date}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardHeader
                title={
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {getDayLabel(dayIndex)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(day.date)}
                    </Typography>
                  </Box>
                }
                sx={{ pb: 0 }}
              />
              <CardContent sx={{ pt: 1 }}>
                {Object.entries(MEAL_CONFIG).map(([mealType, config]) => {
                  const meal = day.meals[mealType];
                  if (!meal) return null;
                  return (
                    <Box key={mealType}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" py={0.5}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box sx={{ color: config.color, display: 'flex' }}>{config.icon}</Box>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>{config.label}</Typography>
                            {!meal.can_modify && (
                              <Box display="flex" alignItems="center" gap={0.3}>
                                <ClockIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
                                <Typography variant="caption" color="text.disabled">
                                  Cutoff passed
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          {meal.is_available ? (
                            <Chip
                              size="small"
                              icon={<CheckIcon />}
                              label="Eating"
                              color="success"
                              variant="outlined"
                              sx={{ fontSize: 11 }}
                            />
                          ) : (
                            <Chip
                              size="small"
                              icon={<CancelIcon />}
                              label="Skipping"
                              color="default"
                              variant="outlined"
                              sx={{ fontSize: 11 }}
                            />
                          )}
                          <Switch
                            size="small"
                            checked={meal.is_available}
                            onChange={() => handleToggle(dayIndex, mealType)}
                            disabled={!meal.can_modify || saving}
                            color="success"
                          />
                        </Box>
                      </Box>
                      <Divider sx={{ my: 0.3 }} />
                    </Box>
                  );
                })}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
