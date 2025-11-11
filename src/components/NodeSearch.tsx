import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemButton,
  Typography,
  Chip,
  InputAdornment,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  CircleOutlined as NodeIcon,
} from '@mui/icons-material';
import type { GraphData, GraphNode } from '../types/graph';
import { getColorForType, ChangeStatus } from '../types/graph';

interface NodeSearchProps {
  graphData: GraphData;
  onNodeSelect: (nodeId: string) => void;
  disabled?: boolean;
}

const NodeSearch: React.FC<NodeSearchProps> = ({ graphData, onNodeSelect, disabled = false }) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Search nodes by label, type, or property values
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    const results: Array<{ node: GraphNode; matchReason: string }> = [];

    graphData.nodes.forEach((node) => {
      // Search in label
      if (node.label.toLowerCase().includes(query)) {
        results.push({ node, matchReason: 'Label' });
        return;
      }

      // Search in type
      if (node.type.toLowerCase().includes(query)) {
        results.push({ node, matchReason: 'Type' });
        return;
      }

      // Search in properties
      for (const [key, value] of Object.entries(node.properties)) {
        const valueStr = String(value).toLowerCase();
        if (valueStr.includes(query) || key.toLowerCase().includes(query)) {
          results.push({ node, matchReason: `Property: ${key}` });
          return;
        }
      }
    });

    return results.slice(0, 10); // Limit to top 10 results
  }, [searchQuery, graphData.nodes]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      onNodeSelect(nodeId);
      setSearchQuery('');
      setIsFocused(false);
    },
    [onNodeSelect]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setIsFocused(false);
  }, []);

  const showResults = isFocused && searchQuery.trim() && searchResults.length > 0;

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 400 }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search nodes by label, type, or properties..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          // Delay to allow click on result
          setTimeout(() => setIsFocused(false), 200);
        }}
        disabled={disabled}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <CloseIcon
                fontSize="small"
                sx={{ cursor: 'pointer', opacity: 0.6, '&:hover': { opacity: 1 } }}
                onClick={handleClearSearch}
              />
            </InputAdornment>
          ),
        }}
        sx={{
          bgcolor: theme.palette.background.paper,
          borderRadius: 1,
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
            },
          },
        }}
      />

      <Collapse in={showResults}>
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1300,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
          }}
        >
          <List dense disablePadding>
            {searchResults.map(({ node, matchReason }, index) => {
              const nodeColor = getColorForType(node.type, theme.palette.mode === 'dark');
              const isNew = node.status === ChangeStatus.NEW;

              return (
                <ListItem key={node.id} disablePadding divider={index < searchResults.length - 1}>
                  <ListItemButton
                    onClick={() => handleNodeClick(node.id)}
                    sx={{
                      '&:hover': {
                        bgcolor: alpha(nodeColor, 0.1),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        width: '100%',
                      }}
                    >
                      {/* Node type indicator */}
                      <NodeIcon
                        sx={{
                          color: nodeColor,
                          fontSize: 20,
                          flexShrink: 0,
                        }}
                      />

                      {/* Node info */}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {node.label}
                          </Typography>
                          {isNew && <Chip label="New" size="small" color="success" />}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={node.type}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: alpha(nodeColor, 0.2),
                              color: theme.palette.getContrastText(nodeColor),
                              borderColor: nodeColor,
                              border: `1px solid ${nodeColor}`,
                            }}
                          />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Match: {matchReason}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          {/* Results count footer */}
          <Box
            sx={{
              p: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="caption" color="text.secondary" align="center" display="block">
              {searchResults.length === 10
                ? 'Showing top 10 results'
                : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} found`}
            </Typography>
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default NodeSearch;
