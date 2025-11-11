import React from 'react';
import { Paper, Typography, Box, Button, Stack, Divider, Tooltip } from '@mui/material';
import { AddCircleOutline as AddNodeIcon, Link as LinkIcon } from '@mui/icons-material';

interface NodePaletteProps {
  onStartCreateNode?: () => void;
  onStartCreateEdge: () => void;
  isEdgeCreateMode: boolean;
  disabled?: boolean;
}

const NodePalette: React.FC<NodePaletteProps> = ({
  onStartCreateNode,
  onStartCreateEdge,
  isEdgeCreateMode,
  disabled = false,
}) => {
  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Create
      </Typography>

      <Stack spacing={1.5}>
        <Tooltip title="Create a new node with any type" placement="right">
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddNodeIcon />}
            onClick={onStartCreateNode}
            disabled={disabled}
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            Create Node
          </Button>
        </Tooltip>
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
            Click "Create Node" button above. You can enter any type you want.
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

        <Box>
          <Typography variant="caption" display="block" gutterBottom>
            <strong>View Labels:</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Use the visibility toggles in the controls panel to show/hide node and edge labels
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
