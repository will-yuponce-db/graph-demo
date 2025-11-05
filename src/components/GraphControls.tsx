import React from 'react';
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
  FormGroup,
  Checkbox,
  Slider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import { NodeType, RelationshipType } from '../types/graph';

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
  stats,
}) => {
  const nodeTypes = Object.values(NodeType);
  const relationshipTypes = Object.values(RelationshipType);

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
    <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      {/* Graph Statistics */}
      <Typography variant="h6" gutterBottom>
        Graph Statistics
      </Typography>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2">Total Nodes:</Typography>
          <Chip label={stats.totalNodes} size="small" color="primary" />
        </Box>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2">Total Edges:</Typography>
          <Chip label={stats.totalEdges} size="small" color="primary" />
        </Box>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2" color="success.main">
            Proposed Nodes:
          </Typography>
          <Chip label={stats.newNodes} size="small" color="success" />
        </Box>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2" color="success.main">
            Proposed Edges:
          </Typography>
          <Chip label={stats.newEdges} size="small" color="success" />
        </Box>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* Visibility Controls */}
      <Typography variant="h6" gutterBottom>
        Visibility
      </Typography>
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={showProposed}
              onChange={(e) => onToggleProposed(e.target.checked)}
              color="success"
            />
          }
          label={
            <Box display="flex" alignItems="center" gap={1}>
              {showProposed ? <VisibilityIcon /> : <VisibilityOffIcon />}
              <Typography variant="body2">Show Proposed Changes</Typography>
            </Box>
          }
        />
        <FormControlLabel
          control={
            <Switch
              checked={showNodeLabels}
              onChange={(e) => onToggleNodeLabels(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Box display="flex" alignItems="center" gap={1}>
              <LabelIcon />
              <Typography variant="body2">Show Node Labels</Typography>
            </Box>
          }
        />
        <FormControlLabel
          control={
            <Switch
              checked={showEdgeLabels}
              onChange={(e) => onToggleEdgeLabels(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Box display="flex" alignItems="center" gap={1}>
              <LabelIcon />
              <Typography variant="body2">Show Edge Labels</Typography>
            </Box>
          }
        />
      </FormGroup>

      <Divider sx={{ my: 2 }} />

      {/* Edge Length Slider */}
      <Typography variant="h6" gutterBottom>
        Layout
      </Typography>
      <Box sx={{ px: 1 }}>
        <Typography variant="body2" gutterBottom>
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
          sx={{ mb: 2 }}
        />

        <Typography variant="body2" gutterBottom>
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
          sx={{ mb: 1 }}
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
        <FormGroup>
          {nodeTypes.map((type) => (
            <FormControlLabel
              key={type}
              control={
                <Checkbox
                  checked={selectedNodeTypes.length === 0 || selectedNodeTypes.includes(type)}
                  onChange={() => handleNodeTypeToggle(type)}
                  size="small"
                />
              }
              label={<Typography variant="body2">{type}</Typography>}
            />
          ))}
        </FormGroup>
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
        <FormGroup>
          {relationshipTypes.map((type) => (
            <FormControlLabel
              key={type}
              control={
                <Checkbox
                  checked={
                    selectedRelationshipTypes.length === 0 ||
                    selectedRelationshipTypes.includes(type)
                  }
                  onChange={() => handleRelationshipTypeToggle(type)}
                  size="small"
                />
              }
              label={<Typography variant="body2">{type}</Typography>}
            />
          ))}
        </FormGroup>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Legend */}
      <Typography variant="h6" gutterBottom>
        Legend
      </Typography>
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: 'primary.main',
            }}
          />
          <Typography variant="body2">Person</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: '#7b1fa2',
            }}
          />
          <Typography variant="body2">Company</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: '#f57c00',
            }}
          />
          <Typography variant="body2">Product</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: '#c62828',
            }}
          />
          <Typography variant="body2">Location</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: 'success.main',
              border: '2px solid',
              borderColor: 'success.dark',
            }}
          />
          <Typography variant="body2">Proposed New</Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* Reset Button */}
      <Button variant="outlined" fullWidth startIcon={<RefreshIcon />} onClick={onResetView}>
        Reset View
      </Button>
    </Paper>
  );
};

export default GraphControls;
