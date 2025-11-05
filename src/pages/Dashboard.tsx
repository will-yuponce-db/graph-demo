import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  Stack,
} from '@mui/material';
import { TrendingUp, People, ShoppingCart, AttachMoney } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color }) => (
  <Card elevation={3} sx={{ height: '100%' }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ mb: 1 }}>
            {value}
          </Typography>
          <Chip
            label={change}
            size="small"
            color={change.startsWith('+') ? 'success' : 'error'}
            sx={{ fontWeight: 600 }}
          />
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}20`,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box sx={{ fontSize: 32, color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
        Dashboard
      </Typography>

      <Stack spacing={3}>
        {/* Stat Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 3,
          }}
        >
          <StatCard
            title="Total Revenue"
            value="$54,239"
            change="+12.5%"
            icon={<AttachMoney />}
            color="#1976d2"
          />
          <StatCard
            title="Total Users"
            value="8,426"
            change="+8.2%"
            icon={<People />}
            color="#9c27b0"
          />
          <StatCard
            title="Orders"
            value="2,341"
            change="+15.3%"
            icon={<ShoppingCart />}
            color="#2e7d32"
          />
          <StatCard
            title="Growth"
            value="23.4%"
            change="+5.1%"
            icon={<TrendingUp />}
            color="#ed6c02"
          />
        </Box>

        {/* Chart and Activity Row */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 3,
          }}
        >
          {/* Chart Placeholder */}
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue Overview
              </Typography>
              <Paper
                sx={{
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'action.hover',
                  mt: 2,
                }}
              >
                <Typography color="text.secondary">
                  Chart placeholder - Integrate with your favorite charting library
                </Typography>
              </Paper>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                {[
                  { label: 'New Users', value: 73 },
                  { label: 'Sales', value: 89 },
                  { label: 'Engagement', value: 62 },
                  { label: 'Conversion', value: 95 },
                ].map((item) => (
                  <Box key={item.label}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2">{item.label}</Typography>
                      <Typography variant="body2" fontWeight="600">
                        {item.value}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={item.value}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Data Table Placeholder */}
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            <Paper
              sx={{
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.hover',
                mt: 2,
              }}
            >
              <Typography color="text.secondary">
                Table placeholder - Add your data table here
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

export default Dashboard;
