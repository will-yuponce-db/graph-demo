import React from 'react';
import { Paper, Typography, Box, Button, Stack, Divider, Tooltip } from '@mui/material';
import { AddCircleOutline as AddNodeIcon, Link as LinkIcon } from '@mui/icons-material';

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
        title="Open a form to create an edge by selecting source and target nodes"
        placement="right"
      >
        <Button
          variant="outlined"
          color="primary"
          startIcon={<LinkIcon />}
          onClick={onStartCreateEdge}
          disabled={disabled}
          fullWidth
          sx={{ mb: 1 }}
        >
          Create Edge
        </Button>
      </Tooltip>

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
            Click "Create Edge" and use the autocomplete form to select source and target nodes
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
