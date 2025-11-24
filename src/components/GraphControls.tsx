import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Chip,
  Stack,
  Slider,
  useTheme,
  keyframes,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import {
  getUniqueNodeTypes,
  getUniqueRelationshipTypes,
  getColorForType,
  type GraphData,
} from '../types/graph';
import { gradients, vibrantColors } from '../theme/theme';

// Animation keyframes
const slideIn = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
`;

const countUp = keyframes`
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

interface GraphControlsProps {
  showProposed: boolean;
  onToggleProposed: (show: boolean) => void;
  selectedNodeTypes: string[];
  onNodeTypeChange: (types: string[]) => void;
  selectedRelationshipTypes: string[];
  onRelationshipTypeChange: (types: string[]) => void;
  showNodeLabels: boolean;
  onToggleNodeLabels: (show: boolean) => void;
  showEdgeLabels: boolean;
  onToggleEdgeLabels: (show: boolean) => void;
  edgeLength: number;
  onEdgeLengthChange: (length: number) => void;
  nodeSize: number;
  onNodeSizeChange: (size: number) => void;
  onResetView: () => void;
  graphData: GraphData; // Add graphData to extract types dynamically
  stats: {
    totalNodes: number;
    totalEdges: number;
    newNodes: number;
    newEdges: number;
  };
}

const GraphControls: React.FC<GraphControlsProps> = ({
  showProposed,
  onToggleProposed,
  selectedNodeTypes,
  onNodeTypeChange,
  selectedRelationshipTypes,
  onRelationshipTypeChange,
  showNodeLabels,
  onToggleNodeLabels,
  showEdgeLabels,
  onToggleEdgeLabels,
  edgeLength,
  onEdgeLengthChange,
  nodeSize,
  onNodeSizeChange,
  onResetView,
  graphData,
  stats,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Extract unique types from the actual data
  const nodeTypes = useMemo(() => getUniqueNodeTypes(graphData), [graphData]);
  const relationshipTypes = useMemo(() => getUniqueRelationshipTypes(graphData), [graphData]);

  // Generate color map for legend
  const nodeTypeColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    nodeTypes.forEach((type) => {
      colorMap.set(type, getColorForType(type, isDarkMode));
    });
    return colorMap;
  }, [nodeTypes, isDarkMode]);

  const handleNodeTypeToggle = (type: string) => {
    if (selectedNodeTypes.includes(type)) {
      onNodeTypeChange(selectedNodeTypes.filter((t) => t !== type));
    } else {
      onNodeTypeChange([...selectedNodeTypes, type]);
    }
  };

  const handleRelationshipTypeToggle = (type: string) => {
    if (selectedRelationshipTypes.includes(type)) {
      onRelationshipTypeChange(selectedRelationshipTypes.filter((t) => t !== type));
    } else {
      onRelationshipTypeChange([...selectedRelationshipTypes, type]);
    }
  };

  const handleSelectAllNodes = () => {
    if (selectedNodeTypes.length === nodeTypes.length) {
      onNodeTypeChange([]);
    } else {
      onNodeTypeChange(nodeTypes);
    }
  };

  const handleSelectAllRelationships = () => {
    if (selectedRelationshipTypes.length === relationshipTypes.length) {
      onRelationshipTypeChange([]);
    } else {
      onRelationshipTypeChange(relationshipTypes);
    }
  };

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
      {/* Graph Statistics */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          background: gradients.primary,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 700,
          mb: 2,
        }}
      >
        Graph Statistics
      </Typography>
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: gradients.primary,
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: `0 4px 12px ${vibrantColors.electricBlue}30`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateX(4px)',
              boxShadow: `0 6px 16px ${vibrantColors.electricBlue}40`,
            },
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            Total Nodes:
          </Typography>
          <Chip
            label={stats.totalNodes}
            size="small"
            sx={{
              background: 'white',
              color: vibrantColors.electricBlue,
              fontWeight: 700,
              animation: `${countUp} 0.5s ease-out`,
            }}
          />
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: gradients.secondary,
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: `0 4px 12px ${vibrantColors.vibrantPurple}30`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateX(4px)',
              boxShadow: `0 6px 16px ${vibrantColors.vibrantPurple}40`,
            },
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            Total Edges:
          </Typography>
          <Chip
            label={stats.totalEdges}
            size="small"
            sx={{
              background: 'white',
              color: vibrantColors.vibrantPurple,
              fontWeight: 700,
              animation: `${countUp} 0.5s ease-out 0.1s backwards`,
            }}
          />
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: gradients.success,
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: `0 4px 12px ${vibrantColors.boldGreen}30`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateX(4px)',
              boxShadow: `0 6px 16px ${vibrantColors.boldGreen}40`,
            },
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            Proposed Nodes:
          </Typography>
          <Chip
            label={stats.newNodes}
            size="small"
            sx={{
              background: 'white',
              color: vibrantColors.boldGreen,
              fontWeight: 700,
              animation: `${countUp} 0.5s ease-out 0.2s backwards`,
            }}
          />
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: gradients.warning,
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: `0 4px 12px ${vibrantColors.energeticOrange}30`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateX(4px)',
              boxShadow: `0 6px 16px ${vibrantColors.energeticOrange}40`,
            },
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            Proposed Edges:
          </Typography>
          <Chip
            label={stats.newEdges}
            size="small"
            sx={{
              background: 'white',
              color: vibrantColors.energeticOrange,
              fontWeight: 700,
              animation: `${countUp} 0.5s ease-out 0.3s backwards`,
            }}
          />
        </Box>
      </Stack>

      <Divider sx={{ my: 2.5, borderColor: 'rgba(0, 102, 255, 0.2)' }} />

      {/* Visibility Controls */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          background: gradients.success,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 700,
        }}
      >
        Visibility
      </Typography>
      <Stack spacing={1.5}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: (theme) =>
              showProposed ? `${vibrantColors.boldGreen}15` : `${theme.palette.divider}10`,
            transition: 'all 0.3s ease',
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={showProposed}
                onChange={(e) => onToggleProposed(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: vibrantColors.boldGreen,
                    '& + .MuiSwitch-track': {
                      backgroundColor: vibrantColors.boldGreen,
                    },
                  },
                }}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1}>
                {showProposed ? (
                  <VisibilityIcon sx={{ color: vibrantColors.boldGreen }} />
                ) : (
                  <VisibilityOffIcon />
                )}
                <Typography variant="body2" fontWeight={600}>
                  Show Proposed Changes
                </Typography>
              </Box>
            }
          />
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: (theme) =>
              showNodeLabels ? `${vibrantColors.electricBlue}15` : `${theme.palette.divider}10`,
            transition: 'all 0.3s ease',
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={showNodeLabels}
                onChange={(e) => onToggleNodeLabels(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: vibrantColors.electricBlue,
                    '& + .MuiSwitch-track': {
                      backgroundColor: vibrantColors.electricBlue,
                    },
                  },
                }}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <LabelIcon
                  sx={{ color: showNodeLabels ? vibrantColors.electricBlue : 'text.secondary' }}
                />
                <Typography variant="body2" fontWeight={600}>
                  Show Node Labels
                </Typography>
              </Box>
            }
          />
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: (theme) =>
              showEdgeLabels ? `${vibrantColors.vibrantPurple}15` : `${theme.palette.divider}10`,
            transition: 'all 0.3s ease',
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={showEdgeLabels}
                onChange={(e) => onToggleEdgeLabels(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: vibrantColors.vibrantPurple,
                    '& + .MuiSwitch-track': {
                      backgroundColor: vibrantColors.vibrantPurple,
                    },
                  },
                }}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <LabelIcon
                  sx={{ color: showEdgeLabels ? vibrantColors.vibrantPurple : 'text.secondary' }}
                />
                <Typography variant="body2" fontWeight={600}>
                  Show Edge Labels
                </Typography>
              </Box>
            }
          />
        </Box>
      </Stack>

      <Divider sx={{ my: 2.5, borderColor: 'rgba(192, 38, 211, 0.2)' }} />

      {/* Edge Length Slider */}
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
        Layout
      </Typography>
      <Box
        sx={{
          px: 2,
          py: 2,
          borderRadius: 2,
          background: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(192, 38, 211, 0.05)' : 'rgba(192, 38, 211, 0.02)',
        }}
      >
        <Typography variant="body2" gutterBottom fontWeight={600}>
          Edge Length
        </Typography>
        <Slider
          value={edgeLength}
          onChange={(_, value) => onEdgeLengthChange(value as number)}
          min={30}
          max={200}
          step={10}
          marks={[
            { value: 30, label: 'Close' },
            { value: 80, label: 'Default' },
            { value: 200, label: 'Far' },
          ]}
          valueLabelDisplay="auto"
          sx={{
            mb: 3,
            '& .MuiSlider-track': {
              background: gradients.primary,
              border: 'none',
              height: 6,
            },
            '& .MuiSlider-rail': {
              height: 6,
              opacity: 0.3,
            },
            '& .MuiSlider-thumb': {
              width: 20,
              height: 20,
              background: 'white',
              border: `3px solid ${vibrantColors.electricBlue}`,
              boxShadow: `0 2px 8px ${vibrantColors.electricBlue}40`,
              '&:hover, &.Mui-focusVisible': {
                boxShadow: `0 0 0 8px ${vibrantColors.electricBlue}20`,
              },
            },
            '& .MuiSlider-valueLabel': {
              background: gradients.primary,
              borderRadius: 2,
            },
          }}
        />

        <Typography variant="body2" gutterBottom fontWeight={600}>
          Node Size
        </Typography>
        <Slider
          value={nodeSize}
          onChange={(_, value) => onNodeSizeChange(value as number)}
          min={3}
          max={15}
          step={1}
          marks={[
            { value: 3, label: 'Small' },
            { value: 6, label: 'Default' },
            { value: 15, label: 'Large' },
          ]}
          valueLabelDisplay="auto"
          sx={{
            '& .MuiSlider-track': {
              background: gradients.secondary,
              border: 'none',
              height: 6,
            },
            '& .MuiSlider-rail': {
              height: 6,
              opacity: 0.3,
            },
            '& .MuiSlider-thumb': {
              width: 20,
              height: 20,
              background: 'white',
              border: `3px solid ${vibrantColors.vibrantPurple}`,
              boxShadow: `0 2px 8px ${vibrantColors.vibrantPurple}40`,
              '&:hover, &.Mui-focusVisible': {
                boxShadow: `0 0 0 8px ${vibrantColors.vibrantPurple}20`,
              },
            },
            '& .MuiSlider-valueLabel': {
              background: gradients.secondary,
              borderRadius: 2,
            },
          }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Node Type Filters */}
      <Box sx={{ mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">Node Types</Typography>
          <Button size="small" onClick={handleSelectAllNodes}>
            {selectedNodeTypes.length === nodeTypes.length ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {nodeTypes.map((type) => {
            const isSelected = selectedNodeTypes.length === 0 || selectedNodeTypes.includes(type);
            return (
              <Chip
                key={type}
                label={type}
                onClick={() => handleNodeTypeToggle(type)}
                color={isSelected ? 'primary' : 'default'}
                variant={isSelected ? 'filled' : 'outlined'}
                sx={{
                  bgcolor: isSelected ? nodeTypeColors.get(type) : 'transparent',
                  borderColor: nodeTypeColors.get(type),
                  color: isSelected
                    ? theme.palette.getContrastText(nodeTypeColors.get(type) || '#000')
                    : 'inherit',
                  '&:hover': {
                    bgcolor: isSelected
                      ? nodeTypeColors.get(type)
                      : `${nodeTypeColors.get(type)}22`,
                  },
                }}
              />
            );
          })}
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Relationship Type Filters */}
      <Box sx={{ mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">Relationships</Typography>
          <Button size="small" onClick={handleSelectAllRelationships}>
            {selectedRelationshipTypes.length === relationshipTypes.length
              ? 'Deselect All'
              : 'Select All'}
          </Button>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {relationshipTypes.map((type) => {
            const isSelected =
              selectedRelationshipTypes.length === 0 || selectedRelationshipTypes.includes(type);
            return (
              <Chip
                key={type}
                label={type}
                onClick={() => handleRelationshipTypeToggle(type)}
                color={isSelected ? 'secondary' : 'default'}
                variant={isSelected ? 'filled' : 'outlined'}
              />
            );
          })}
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Legend - Shows only selected types */}
      <Typography variant="h6" gutterBottom>
        Legend
      </Typography>
      <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
        <Stack spacing={1} sx={{ mb: 2 }}>
          {/* Show only selected node types (or all if none selected) */}
          {(selectedNodeTypes.length === 0 ? nodeTypes : selectedNodeTypes).map((type) => (
            <Box key={type} display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: nodeTypeColors.get(type),
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                {type}
              </Typography>
            </Box>
          ))}

          {/* Separator if there are node types */}
          {(selectedNodeTypes.length === 0 ? nodeTypes.length : selectedNodeTypes.length) > 0 && (
            <Divider sx={{ my: 1 }} />
          )}

          {/* Proposed new indicator - only show if proposed changes are visible */}
          {showProposed && (
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  border: '2px solid',
                  borderColor: 'success.dark',
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2">Proposed New</Typography>
            </Box>
          )}
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Reset Button */}
      <Button variant="outlined" fullWidth startIcon={<RefreshIcon />} onClick={onResetView}>
        Reset View
      </Button>
    </Paper>
  );
};

export default GraphControls;
