import React from 'react';
import { Paper, Typography, Box, Button, Stack, Divider, Tooltip } from '@mui/material';
import { AddCircleOutline as AddNodeIcon, Link as LinkIcon } from '@mui/icons-material';
import { keyframes } from '@mui/system';
import { gradients, vibrantColors } from '../theme/theme';

// Animation keyframes
const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
`;

const iconFloat = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
`;

interface NodePaletteProps {
  onStartCreateNode?: () => void;
  onStartCreateEdge: () => void;
  disabled?: boolean;
}

const NodePalette: React.FC<NodePaletteProps> = ({
  onStartCreateNode,
  onStartCreateEdge,
  disabled = false,
}) => {
  return (
    <Paper
      sx={{
        p: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(30, 41, 59, 1) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 1) 100%)',
        animation: `${slideIn} 0.4s ease-out`,
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          background: gradients.primary,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 700,
        }}
      >
        Create
      </Typography>

      <Stack spacing={1.5}>
        <Tooltip title="Create a new node with any type" placement="right">
          <span>
            <Button
              variant="contained"
              startIcon={<AddNodeIcon />}
              onClick={onStartCreateNode}
              disabled={disabled}
              fullWidth
              sx={{
                justifyContent: 'flex-start',
                background: gradients.primary,
                color: 'white',
                fontWeight: 700,
                py: 1.5,
                boxShadow: `0 4px 12px ${vibrantColors.electricBlue}30`,
                '&:hover': {
                  background: gradients.primary,
                  boxShadow: `0 8px 20px ${vibrantColors.electricBlue}40`,
                  transform: 'translateY(-2px)',
                  '& .MuiSvgIcon-root': {
                    animation: `${iconFloat} 0.6s ease-in-out infinite`,
                  },
                },
                '&:disabled': {
                  background: 'rgba(0, 102, 255, 0.3)',
                  color: 'rgba(255, 255, 255, 0.5)',
                },
              }}
            >
              Create Node
            </Button>
          </span>
        </Tooltip>
      </Stack>

      <Divider sx={{ my: 2.5, borderColor: 'rgba(0, 102, 255, 0.2)' }} />

      <Typography
        variant="h6"
        gutterBottom
        sx={{
          background: gradients.secondary,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 700,
        }}
      >
        Relationships
      </Typography>

      <Tooltip
        title="Open a form to create an edge by selecting source and target nodes"
        placement="right"
      >
        <span>
          <Button
            variant="outlined"
            startIcon={<LinkIcon />}
            onClick={onStartCreateEdge}
            disabled={disabled}
            fullWidth
            sx={{
              mb: 1,
              py: 1.5,
              borderWidth: 2,
              borderColor: vibrantColors.vibrantPurple,
              color: vibrantColors.vibrantPurple,
              fontWeight: 700,
              '&:hover': {
                borderWidth: 2,
                borderColor: vibrantColors.hotPink,
                background: `${vibrantColors.vibrantPurple}10`,
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 16px ${vibrantColors.vibrantPurple}30`,
                '& .MuiSvgIcon-root': {
                  animation: `${iconFloat} 0.6s ease-in-out infinite`,
                },
              },
              '&:disabled': {
                borderColor: 'rgba(192, 38, 211, 0.3)',
                color: 'rgba(192, 38, 211, 0.3)',
              },
            }}
          >
            Create Edge
          </Button>
        </span>
      </Tooltip>

      <Divider sx={{ my: 2.5, borderColor: 'rgba(192, 38, 211, 0.2)' }} />

      <Typography
        variant="h6"
        gutterBottom
        sx={{
          background: gradients.warning,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 700,
        }}
      >
        Instructions
      </Typography>

      <Stack spacing={1.5}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${vibrantColors.electricBlue}08 0%, ${vibrantColors.skyBlue}08 100%)`,
            borderLeft: `3px solid ${vibrantColors.electricBlue}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateX(4px)',
              boxShadow: `0 2px 8px ${vibrantColors.electricBlue}20`,
            },
          }}
        >
          <Typography variant="caption" display="block" gutterBottom fontWeight="bold">
            🎨 Create Node:
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Click "Create Node" button above. You can enter any type you want.
          </Typography>
        </Box>

        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${vibrantColors.vibrantPurple}08 0%, ${vibrantColors.hotPink}08 100%)`,
            borderLeft: `3px solid ${vibrantColors.vibrantPurple}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateX(4px)',
              boxShadow: `0 2px 8px ${vibrantColors.vibrantPurple}20`,
            },
          }}
        >
          <Typography variant="caption" display="block" gutterBottom fontWeight="bold">
            🔗 Create Edge:
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Click "Create Edge" and use the autocomplete form to select source and target nodes
          </Typography>
        </Box>

        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${vibrantColors.boldGreen}08 0%, ${vibrantColors.emerald}08 100%)`,
            borderLeft: `3px solid ${vibrantColors.boldGreen}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateX(4px)',
              boxShadow: `0 2px 8px ${vibrantColors.boldGreen}20`,
            },
          }}
        >
          <Typography variant="caption" display="block" gutterBottom fontWeight="bold">
            ✏️ Edit:
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Click on any node or edge to edit its properties
          </Typography>
        </Box>

        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${vibrantColors.strikingRed}08 0%, ${vibrantColors.crimson}08 100%)`,
            borderLeft: `3px solid ${vibrantColors.strikingRed}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateX(4px)',
              boxShadow: `0 2px 8px ${vibrantColors.strikingRed}20`,
            },
          }}
        >
          <Typography variant="caption" display="block" gutterBottom fontWeight="bold">
            🗑️ Delete:
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Select a node/edge and press Delete key
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 2.5 }} />

      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          background: gradients.success,
          color: 'white',
          boxShadow: `0 4px 16px ${vibrantColors.boldGreen}30`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            position: 'relative',
            fontWeight: 600,
            display: 'block',
          }}
        >
          💡 <strong>Tip:</strong> New nodes and edges are marked as "proposed" until you save them
          to the database
        </Typography>
      </Box>
    </Paper>
  );
};

export default NodePalette;
