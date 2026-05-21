import React from 'react';
import {
  Box, Typography, Card, CardContent, IconButton, Tooltip, Button,
  CircularProgress, Alert, Stack, alpha, useTheme, useMediaQuery,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

// ─── Design tokens ───────────────────────────────────────────────────────────

export const dash = {
  bg: '#f8fafc',
  surface: '#ffffff',
  border: 'rgba(15, 23, 42, 0.07)',
  borderLight: 'rgba(15, 23, 42, 0.04)',
  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  shadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)',
  shadowHover: '0 2px 8px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.05)',
  page: {
    p: { xs: 2, sm: 2.5, md: 3, lg: 3.5 },
    maxWidth: 1280,
    mx: 'auto',
  },
  radius: 2.5,
};

export const STATUS_COLORS = {
  Vacant:               { dot: '#22c55e', bg: alpha('#22c55e', 0.08), text: '#15803d' },
  'Partially Occupied': { dot: '#f59e0b', bg: alpha('#f59e0b', 0.08), text: '#b45309' },
  Partial:              { dot: '#f59e0b', bg: alpha('#f59e0b', 0.08), text: '#b45309' },
  Occupied:             { dot: '#6366f1', bg: alpha('#6366f1', 0.08), text: '#4338ca' },
  Maintenance:          { dot: '#94a3b8', bg: alpha('#94a3b8', 0.1),  text: '#64748b' },
};

export function occupancyTone(pct) {
  if (pct >= 90) return '#ef4444';
  if (pct >= 70) return '#f59e0b';
  return '#22c55e';
}

// ─── Layout shells ───────────────────────────────────────────────────────────

export function PageShell({ children, sx }) {
  return (
    <Box sx={{ ...dash.page, width: '100%', boxSizing: 'border-box', ...sx }}>
      {children}
    </Box>
  );
}

export function SoftCard({ children, sx, onClick, hover = true, ...props }) {
  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        bgcolor: dash.surface,
        border: `1px solid ${dash.borderLight}`,
        borderRadius: dash.radius,
        boxShadow: dash.shadow,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        ...(hover && {
          '&:hover': {
            boxShadow: dash.shadowHover,
            borderColor: dash.border,
          },
        }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
}

// ─── Headers & states ────────────────────────────────────────────────────────

export function PageHeader({ title, subtitle, actions, onRefresh, loading }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: { xs: 1.5, sm: 2 },
        mb: { xs: 2.5, md: 3 },
      }}
    >
      <Box>
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: dash.text, letterSpacing: '-0.02em', fontSize: { xs: '1.25rem', md: '1.4rem' } }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: dash.textSecondary, mt: 0.5, maxWidth: 520 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        {actions}
        {onRefresh && (
          <Tooltip title="Refresh">
            <IconButton
              size="small"
              onClick={onRefresh}
              disabled={loading}
              sx={{
                color: dash.textSecondary,
                bgcolor: alpha('#0f172a', 0.03),
                '&:hover': { bgcolor: alpha('#0f172a', 0.06) },
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

export function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: dash.text, letterSpacing: '-0.01em' }}>
        {title}
      </Typography>
      {actionLabel && (
        <Button
          size="small"
          onClick={onAction}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            color: dash.textSecondary,
            minWidth: 'auto',
            px: 1.5,
            '&:hover': { bgcolor: alpha('#0f172a', 0.04), color: dash.text },
          }}
        >
          {actionLabel} →
        </Button>
      )}
    </Box>
  );
}

export function DashboardLoading({ message = 'Loading…' }) {
  return (
    <PageShell>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 2 }}>
        <CircularProgress size={32} thickness={4} sx={{ color: alpha('#0f172a', 0.2) }} />
        <Typography variant="body2" sx={{ color: dash.textSecondary }}>{message}</Typography>
      </Box>
    </PageShell>
  );
}

export function DashboardError({ message, onRetry }) {
  return (
    <PageShell>
      <Alert
        severity="error"
        sx={{ borderRadius: dash.radius, boxShadow: 'none', bgcolor: alpha('#ef4444', 0.04) }}
        action={onRetry && (
          <Button size="small" onClick={onRetry} sx={{ textTransform: 'none' }}>Retry</Button>
        )}
      >
        {message}
      </Alert>
    </PageShell>
  );
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export function MetricCard({ label, value, hint, icon, accent = '#6366f1', onClick }) {
  return (
    <SoftCard onClick={onClick} hover={!!onClick} sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.25 }, '&:last-child': { pb: { xs: 2, sm: 2.25 } } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: dash.textMuted, fontWeight: 500, letterSpacing: '0.02em', display: 'block' }}
            >
              {label}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: dash.text,
                mt: 0.5,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.35rem', sm: '1.5rem' },
                wordBreak: 'break-word',
              }}
            >
              {value}
            </Typography>
            {hint && (
              <Typography variant="caption" sx={{ color: dash.textSecondary, mt: 0.75, display: 'block' }}>
                {hint}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(accent, 0.08),
                color: accent,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </SoftCard>
  );
}

export function MetricGrid({ children, columns = { xs: 12, sm: 6, md: 4, lg: 2 } }) {
  const items = React.Children.toArray(children);
  const cols = {
    xs: columns.xs === 12 ? 1 : columns.xs ? Math.floor(12 / columns.xs) : 1,
    sm: columns.sm ? Math.floor(12 / columns.sm) : 2,
    md: columns.md ? Math.floor(12 / columns.md) : 3,
    lg: columns.lg ? Math.floor(12 / columns.lg) : 6,
  };
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: `repeat(${cols.xs}, 1fr)`,
          sm: `repeat(${Math.min(cols.sm, 2)}, 1fr)`,
          md: `repeat(${Math.min(cols.md, 3)}, 1fr)`,
          lg: `repeat(${Math.min(cols.lg, 6)}, 1fr)`,
        },
        gap: { xs: 1.5, sm: 2 },
        mb: { xs: 2.5, md: 3 },
      }}
    >
      {items}
    </Box>
  );
}

// ─── Occupancy visuals ─────────────────────────────────────────────────────

export function OccupancyBar({ value, max, showLabel = true, height = 6, animate = false }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = occupancyTone(pct);

  return (
    <Box>
      {showLabel && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
          <Typography variant="caption" sx={{ color: dash.textSecondary, fontWeight: 500 }}>
            Occupancy
          </Typography>
          <Typography variant="caption" sx={{ color: dash.textSecondary }}>
            <Box component="span" sx={{ fontWeight: 600, color: dash.text }}>{value}</Box>
            {' / '}{max}
            <Box component="span" sx={{ ml: 0.75, fontWeight: 500, color }}>({pct}%)</Box>
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          position: 'relative',
          height,
          borderRadius: 99,
          bgcolor: alpha('#0f172a', 0.05),
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: animate ? '40%' : `${Math.min(pct, 100)}%`,
            borderRadius: 99,
            bgcolor: color,
            opacity: animate ? 0.5 : 1,
            transition: 'width 0.5s ease',
            ...(animate && { animation: 'pulse-bar 1.4s ease-in-out infinite' }),
            '@keyframes pulse-bar': {
              '0%, 100%': { opacity: 0.35 },
              '50%': { opacity: 0.65 },
            },
          }}
        />
      </Box>
    </Box>
  );
}

export function BedDots({ occupied, total, size = 8, gap = 0.5 }) {
  const dots = [];
  for (let i = 0; i < total; i++) {
    const filled = i < occupied;
    dots.push(
      <Box
        key={i}
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          flexShrink: 0,
          bgcolor: filled ? alpha('#6366f1', 0.75) : alpha('#0f172a', 0.06),
          border: filled ? 'none' : `1px solid ${alpha('#0f172a', 0.08)}`,
        }}
      />
    );
  }
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap, alignItems: 'center' }}>
      {dots}
    </Box>
  );
}

export function StatusBadge({ status }) {
  const key = status === 'Partially Occupied' ? 'Partial' : status;
  const meta = STATUS_COLORS[key] || STATUS_COLORS.Maintenance;
  const label = status === 'Partially Occupied' ? 'Partial' : status;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.6,
        px: 1,
        py: 0.35,
        borderRadius: 1.5,
        bgcolor: meta.bg,
        flexShrink: 0,
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: meta.dot }} />
      <Typography variant="caption" sx={{ color: meta.text, fontWeight: 500, fontSize: 11, lineHeight: 1 }}>
        {label}
      </Typography>
    </Box>
  );
}

export function OccupancySummary({ title, value, max, pct }) {
  const color = occupancyTone(pct);
  return (
    <Box sx={{ flex: 1, minWidth: { xs: '45%', sm: 120 } }}>
      <Typography variant="caption" sx={{ color: dash.textMuted, fontWeight: 500, display: 'block' }}>
        {title}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 600, color: dash.text, mt: 0.25, letterSpacing: '-0.02em' }}>
        {value}
      </Typography>
      {max != null && (
        <Typography variant="caption" sx={{ color: dash.textSecondary }}>
          of {max} · <Box component="span" sx={{ color, fontWeight: 500 }}>{pct}%</Box>
        </Typography>
      )}
    </Box>
  );
}

export function SectionPanel({ title, actionLabel, onAction, children, sx, noPadding }) {
  return (
    <SoftCard hover={false} sx={{ height: '100%', ...sx }}>
      <CardContent sx={{ p: noPadding ? 0 : { xs: 2, sm: 2.5 }, '&:last-child': { pb: noPadding ? 0 : { xs: 2, sm: 2.5 } } }}>
        {(title || actionLabel) && (
          <SectionHeader title={title} actionLabel={actionLabel} onAction={onAction} />
        )}
        {children}
      </CardContent>
    </SoftCard>
  );
}

/** Hook: true on tablet portrait and below */
export function useCompactLayout() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
}

/** Responsive table wrapper */
export function ResponsiveTableWrap({ children }) {
  return (
    <Box sx={{ overflowX: 'auto', mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 } }}>
      {children}
    </Box>
  );
}
