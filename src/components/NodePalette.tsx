import React from 'react';
import { Paper, Typography, Box, Button, Stack, Divider, Tooltip } from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Inventory as ProductIcon,
  Place as LocationIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { NodeType } from '../types/graph';

interface NodePaletteProps {
  onStartCreateNode?: (nodeType: string) => void;
  onStartCreateEdge: () => void;
  isEdgeCreateMode: boolean;
  disabled?: boolean;
}

const nodeTypeConfig = {
  [NodeType.PERSON]: {
    icon: <PersonIcon />,
    color: '#1976d2',
    description: 'Add a person node',
  },
  [NodeType.COMPANY]: {
    icon: <BusinessIcon />,
    color: '#7b1fa2',
    description: 'Add a company node',
  },
  [NodeType.PRODUCT]: {
    icon: <ProductIcon />,
    color: '#f57c00',
    description: 'Add a product node',
  },
  [NodeType.LOCATION]: {
    icon: <LocationIcon />,
    color: '#c62828',
    description: 'Add a location node',
  },
};

const NodePalette: React.FC<NodePaletteProps> = ({
  onStartCreateEdge,
  isEdgeCreateMode,
  disabled = false,
}) => {
  const [draggedType, setDraggedType] = React.useState<string | null>(null);

  const handleDragStart = (nodeType: string) => (e: React.DragEvent) => {
    setDraggedType(nodeType);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('nodeType', nodeType);
  };

  const handleDragEnd = () => {
    setDraggedType(null);
  };

  return (
    <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Node Palette
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Drag node types onto the canvas to create new nodes
      </Typography>

      <Stack spacing={1.5}>
        {Object.entries(nodeTypeConfig).map(([nodeType, config]) => (
          <Tooltip key={nodeType} title={config.description} placement="right">
            <Button
              variant="outlined"
              draggable={!disabled}
              onDragStart={handleDragStart(nodeType)}
              onDragEnd={handleDragEnd}
              disabled={disabled}
              startIcon={config.icon}
              sx={{
                justifyContent: 'flex-start',
                borderColor: config.color,
                color: config.color,
                opacity: draggedType === nodeType ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'grab',
                '&:active': {
                  cursor: disabled ? 'not-allowed' : 'grabbing',
                },
                '&:hover': {
                  borderColor: config.color,
                  backgroundColor: `${config.color}15`,
                },
              }}
            >
              {nodeType}
            </Button>
          </Tooltip>
        ))}
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Relationships
      </Typography>

      <Tooltip
        title="Click to enable edge creation mode, then click two nodes to connect them"
        placement="right"
      >
        <Button
          variant={isEdgeCreateMode ? 'contained' : 'outlined'}
          color={isEdgeCreateMode ? 'success' : 'primary'}
          startIcon={<LinkIcon />}
          onClick={onStartCreateEdge}
          disabled={disabled}
          fullWidth
          sx={{ mb: 1 }}
        >
          {isEdgeCreateMode ? 'Creating Edge...' : 'Create Edge'}
        </Button>
      </Tooltip>

      {isEdgeCreateMode && (
        <Box sx={{ mt: 1, p: 1.5, bgcolor: 'success.light', borderRadius: 1 }}>
          <Typography variant="caption" color="success.contrastText">
            Click a source node, then click a target node to create a relationship
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Instructions
      </Typography>

      <Stack spacing={1}>
        <Box>
          <Typography variant="caption" display="block" gutterBottom>
            <strong>Create Node:</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Drag a node type from above and drop it on the canvas
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" display="block" gutterBottom>
            <strong>Create Edge:</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            1. Click "Create Edge" button
            <br />
            2. Click source node
            <br />
            3. Click target node
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" display="block" gutterBottom>
            <strong>Edit Node/Edge:</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Click on any node or edge to edit its properties
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" display="block" gutterBottom>
            <strong>Delete:</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Select a node/edge and press Delete key
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ p: 1.5, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="caption" color="info.contrastText">
          💡 <strong>Tip:</strong> New nodes and edges are marked as "proposed" until you save them
          to the database
        </Typography>
      </Box>
    </Paper>
  );
};

export default NodePalette;
