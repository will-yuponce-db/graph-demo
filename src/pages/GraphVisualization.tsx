import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import GraphVisualization, { type GraphVisualizationRef } from '../components/GraphVisualization';
import GraphControls from '../components/GraphControls';
import NodePalette from '../components/NodePalette';
import NodeSearch from '../components/NodeSearch';
import { NodeForm, EdgeForm } from '../components/NodeEdgeForm';
import { useGraphEditor } from '../hooks/useGraphEditor';
import type { GraphData, GraphStats, GraphNode, GraphEdge } from '../types/graph';
import {
  writeToTable,
  fetchGraphData,
  deleteNode as apiDeleteNode,
  deleteEdge as apiDeleteEdge,
} from '../services/graphApi';
import { ChangeStatus } from '../types/graph';

// Helper function to calculate graph stats
const getGraphStats = (data: GraphData): GraphStats => {
  const newNodes = data.nodes.filter((n) => n.status === ChangeStatus.NEW).length;
  const newEdges = data.edges.filter((e) => e.status === ChangeStatus.NEW).length;
  const existingNodes = data.nodes.filter((n) => n.status === ChangeStatus.EXISTING).length;
  const existingEdges = data.edges.filter((e) => e.status === ChangeStatus.EXISTING).length;

  return {
    totalNodes: data.nodes.length,
    totalEdges: data.edges.length,
    newNodes,
    newEdges,
    existingNodes,
    existingEdges,
  };
};

const GraphVisualizationPage: React.FC = () => {
  // Set page title
  React.useEffect(() => {
    document.title = 'Interactive Graph Editor | Databricks';
  }, []);

  // Ref for graph visualization component
  const graphVisualizationRef = useRef<GraphVisualizationRef>(null);

  const [showProposed, setShowProposed] = useState(true);
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<string[]>([]);
  const [selectedRelationshipTypes, setSelectedRelationshipTypes] = useState<string[]>([]);
  const [showNodeLabels, setShowNodeLabels] = useState(false);
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [edgeLength, setEdgeLength] = useState(80);
  const [nodeSize, setNodeSize] = useState(6);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<GraphData>({ nodes: [], edges: [] });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [dbMetadata, setDbMetadata] = useState<{
    source?: string;
    databricksEnabled?: boolean;
    databricksError?: string | null;
  }>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Table configuration state
  const [tableName, setTableName] = useState<string>(() => {
    return (
      localStorage.getItem('databricksTableName') || 'main.default.property_graph_entity_edges'
    );
  });
  const [tableNameInput, setTableNameInput] = useState<string>(tableName);
  const [isEditingTableName, setIsEditingTableName] = useState(false);

  // Node/Edge form state
  const [nodeFormOpen, setNodeFormOpen] = useState(false);
  const [nodeFormMode, setNodeFormMode] = useState<'create' | 'edit'>('create');
  const [nodeFormInitialData, setNodeFormInitialData] = useState<GraphNode | undefined>();

  const [edgeFormOpen, setEdgeFormOpen] = useState(false);
  const [edgeFormMode, setEdgeFormMode] = useState<'create' | 'edit'>('create');
  const [edgeFormInitialData, setEdgeFormInitialData] = useState<GraphEdge | undefined>();
  const [edgeFormSourceId, setEdgeFormSourceId] = useState<string | undefined>();
  const [edgeFormTargetId, setEdgeFormTargetId] = useState<string | undefined>();

  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 800, height: 600 });

  // Use the graph editor hook
  const editor = useGraphEditor({ initialData });

  const stats = getGraphStats(editor.graphData);

  // Fetch graph data from backend on component mount
  useEffect(() => {
    loadGraphData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveTableName = () => {
    const trimmedName = tableNameInput.trim();
    if (trimmedName) {
      setTableName(trimmedName);
      localStorage.setItem('databricksTableName', trimmedName);
      setIsEditingTableName(false);
      setSnackbar({
        open: true,
        message: `Table name updated to: ${trimmedName}. Click Refresh to load data from the new table.`,
        severity: 'info',
      });
    }
  };

  const handleCancelEditTableName = () => {
    setTableNameInput(tableName);
    setIsEditingTableName(false);
  };

  const loadGraphData = async () => {
    setIsLoadingData(true);
    setDataError(null);

    // Check if backend API is configured (matches graphApi.ts logic)
    const useBackend = import.meta.env.VITE_USE_BACKEND_API !== 'false';

    try {
      const response = await fetchGraphData(tableName);
      setInitialData({ nodes: response.nodes, edges: response.edges });
      editor.resetToInitialData({ nodes: response.nodes, edges: response.edges });

      // Log metadata from backend (includes source database and any errors)
      if (response.metadata) {
        console.log('📊 Database Metadata:', response.metadata);
        setDbMetadata(response.metadata);
      }

      // Determine if we're using mock data
      setIsUsingMockData(!useBackend || response.metadata?.source === 'Mock Data');

      // Build message with metadata
      let message = `Loaded ${response.nodes.length} nodes and ${response.edges.length} edges`;
      if (response.metadata) {
        message += ` from ${response.metadata.source}`;
        if (response.metadata.databricksError) {
          message += ` (Databricks unavailable: ${response.metadata.databricksError})`;
        }
      }

      setSnackbar({
        open: true,
        message,
        severity: response.metadata?.databricksError ? 'warning' : useBackend ? 'success' : 'info',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load graph data';
      setDataError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Calculate graph dimensions based on container size
  useEffect(() => {
    const updateDimensions = () => {
      if (graphContainerRef.current) {
        const width = graphContainerRef.current.clientWidth;
        const height = graphContainerRef.current.clientHeight;
        setGraphDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleResetView = () => {
    setShowProposed(true);
    setSelectedNodeTypes([]);
    setSelectedRelationshipTypes([]);
    // Reset the graph zoom and pan
    graphVisualizationRef.current?.resetView();
  };

  const handleNodeSearchSelect = (nodeId: string) => {
    // Center on the selected node
    graphVisualizationRef.current?.centerOnNode(nodeId);
    // Select the node
    editor.selectNode(nodeId);
  };

  // Node creation from palette
  const handleStartCreateNode = () => {
    setNodeFormMode('create');
    setNodeFormInitialData(undefined);
    setNodeFormOpen(true);
  };

  const handleNodeFormSave = (node: Omit<GraphNode, 'status'>) => {
    if (nodeFormMode === 'create') {
      editor.addNode(node);
    } else if (nodeFormInitialData) {
      editor.updateNode(nodeFormInitialData.id, node);
    }
    setNodeFormOpen(false);
    setNodeFormInitialData(undefined);
  };

  // Edge creation - open form directly instead of click mode
  const handleStartCreateEdge = () => {
    setEdgeFormMode('create');
    setEdgeFormSourceId(undefined);
    setEdgeFormTargetId(undefined);
    setEdgeFormInitialData(undefined);
    setEdgeFormOpen(true);
  };

  const handleNodeClickForEdge = (nodeId: string) => {
    const result = editor.handleNodeClickForEdge(nodeId);
    if (result !== null && result !== undefined) {
      // Open edge form with source and target
      setEdgeFormMode('create');
      setEdgeFormSourceId(result.sourceId);
      setEdgeFormTargetId(result.targetId);
      setEdgeFormInitialData(undefined);
      setEdgeFormOpen(true);
    }
  };

  const handleEdgeFormSave = (edge: Omit<GraphEdge, 'status'>) => {
    if (edgeFormMode === 'create') {
      editor.addEdge(edge);
    } else if (edgeFormInitialData) {
      editor.updateEdge(edgeFormInitialData.id, edge);
    }
    setEdgeFormOpen(false);
    setEdgeFormInitialData(undefined);
    setEdgeFormSourceId(undefined);
    setEdgeFormTargetId(undefined);
  };

  // Edit existing node
  const handleNodeEdit = (nodeId: string) => {
    const node = editor.graphData.nodes.find((n) => n.id === nodeId);
    if (node) {
      setNodeFormMode('edit');
      setNodeFormInitialData(node);
      setNodeFormOpen(true);
    }
  };

  // Delete node (both from local state and database if existing)
  const handleNodeDelete = useCallback(
    async (nodeId: string) => {
      const node = editor.graphData.nodes.find((n) => n.id === nodeId);

      if (!node) {
        return;
      }

      // If it's an existing node (not NEW), delete from database
      if (node.status === ChangeStatus.EXISTING) {
        if (
          !window.confirm(
            `Are you sure you want to delete "${node.label}" from the database? This action cannot be undone.`
          )
        ) {
          return;
        }

        setLoading(true);
        try {
          const result = await apiDeleteNode(nodeId, tableName);
          if (result.success) {
            // Remove from local state
            editor.deleteNode(nodeId);
            setSnackbar({
              open: true,
              message: result.message,
              severity: 'success',
            });
            // Reload data to ensure consistency
            await loadGraphData();
          } else {
            setSnackbar({
              open: true,
              message: result.message,
              severity: 'error',
            });
          }
        } catch (error) {
          setSnackbar({
            open: true,
            message: error instanceof Error ? error.message : 'Failed to delete node',
            severity: 'error',
          });
        } finally {
          setLoading(false);
        }
      } else {
        // It's a NEW node, just remove from local state
        editor.deleteNode(nodeId);
      }
    },
    [editor, tableName, loadGraphData]
  );

  // Delete edge (both from local state and database if existing)
  const handleEdgeDelete = useCallback(
    async (edgeId: string) => {
      const edge = editor.graphData.edges.find((e) => e.id === edgeId);

      if (!edge) {
        return;
      }

      // If it's an existing edge (not NEW), delete from database
      if (edge.status === ChangeStatus.EXISTING) {
        if (
          !window.confirm(
            `Are you sure you want to delete this ${edge.relationshipType} relationship from the database? This action cannot be undone.`
          )
        ) {
          return;
        }

        setLoading(true);
        try {
          const result = await apiDeleteEdge(edgeId, tableName);
          if (result.success) {
            // Remove from local state
            editor.deleteEdge(edgeId);
            setSnackbar({
              open: true,
              message: result.message,
              severity: 'success',
            });
            // Reload data to ensure consistency
            await loadGraphData();
          } else {
            setSnackbar({
              open: true,
              message: result.message,
              severity: 'error',
            });
          }
        } catch (error) {
          setSnackbar({
            open: true,
            message: error instanceof Error ? error.message : 'Failed to delete edge',
            severity: 'error',
          });
        } finally {
          setLoading(false);
        }
      } else {
        // It's a NEW edge, just remove from local state
        editor.deleteEdge(edgeId);
      }
    },
    [editor, tableName, loadGraphData]
  );

  // Edit existing edge
  const handleEdgeEdit = (edgeId: string) => {
    const edge = editor.graphData.edges.find((e) => e.id === edgeId);
    if (edge) {
      setEdgeFormMode('edit');
      setEdgeFormInitialData(edge);
      setEdgeFormOpen(true);
    }
  };

  // Delete node or edge (keyboard shortcut)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (editor.selectedNodeId) {
          const node = editor.graphData.nodes.find((n) => n.id === editor.selectedNodeId);
          // Allow deletion of any node (NEW nodes delete locally, EXISTING nodes delete from DB)
          if (node) {
            handleNodeDelete(editor.selectedNodeId);
          }
        } else if (editor.selectedEdgeId) {
          const edge = editor.graphData.edges.find((e) => e.id === editor.selectedEdgeId);
          // Allow deletion of any edge (NEW edges delete locally, EXISTING edges delete from DB)
          if (edge) {
            handleEdgeDelete(editor.selectedEdgeId);
          }
        }
      }

      // F key to toggle fullscreen
      if (e.key === 'f' || e.key === 'F') {
        // Only if not typing in an input field
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          setIsFullscreen((prev) => !prev);
        }
      }

      // Escape to cancel edge creation mode or exit fullscreen
      if (e.key === 'Escape') {
        if (editor.isEdgeCreateMode) {
          editor.cancelEdgeCreateMode();
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, isFullscreen]);

  // Save to backend
  const handleWriteToTable = async () => {
    setConfirmDialogOpen(false);
    setLoading(true);

    try {
      // Pass ALL nodes and edges - writeToTable will filter for NEW items
      // and include any existing nodes referenced by new edges (needed for Databricks edge table)
      const result = await writeToTable(editor.graphData.nodes, editor.graphData.edges, tableName);

      if (result.success) {
        // Get IDs of items being saved
        const nodeIds = editor.userCreatedNodes.map((n) => n.id);
        const edgeIds = editor.userCreatedEdges.map((e) => e.id);

        // Mark items as saved in local state (frontend-only)
        // Status is not stored in Databricks, only used for frontend UI
        editor.markItemsAsSaved(nodeIds, edgeIds);

        setSnackbar({
          open: true,
          message: `${result.message}`,
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error instanceof Error ? error.message : 'An error occurred while writing to table',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const newNodesCount = stats.newNodes;
  const newEdgesCount = stats.newEdges;
  const hasProposedChanges = newNodesCount > 0 || newEdgesCount > 0;

  return (
    <Container
      maxWidth={false}
      sx={{
        minHeight: '100vh',
        height: isFullscreen ? '100vh' : undefined,
        py: isFullscreen ? 0 : 3,
        px: isFullscreen ? 0 : undefined,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {!isFullscreen && (
        <Box sx={{ mb: 3, flexShrink: 0 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h4" gutterBottom>
                Graph Editor
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create and edit graph nodes and relationships, then save to database
              </Typography>
            </Box>
            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
              <Button
                variant="outlined"
                color="primary"
                startIcon={isLoadingData ? <CircularProgress size={20} /> : <RefreshIcon />}
                onClick={loadGraphData}
                disabled={isLoadingData}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={() => setConfirmDialogOpen(true)}
                disabled={!hasProposedChanges || loading || isLoadingData}
              >
                Save to Database ({newNodesCount} nodes, {newEdgesCount} edges)
              </Button>
            </Box>
          </Box>

          {/* Connection Info Banner */}
          <Paper
            sx={{
              p: 2,
              bgcolor: dataError ? 'error.main' : isUsingMockData ? 'warning.main' : 'info.main',
              color: dataError
                ? 'error.contrastText'
                : isUsingMockData
                  ? 'warning.contrastText'
                  : 'info.contrastText',
            }}
          >
            <Typography variant="body2">
              {dataError ? (
                <>
                  <strong>Connection Error:</strong> {dataError}
                </>
              ) : isUsingMockData ? (
                <>
                  <strong>Demo Mode:</strong> Using SQLite database. Changes will be saved locally.
                  <br />
                  To sync with Databricks, configure DATABRICKS_CLIENT_ID and
                  DATABRICKS_CLIENT_SECRET in backend/.env
                </>
              ) : (
                <>
                  <strong>Connected:</strong> Backend API →{' '}
                  {dbMetadata.databricksEnabled
                    ? 'Databricks (with SQLite fallback)'
                    : 'SQLite only'}
                  {dbMetadata.databricksError && (
                    <>
                      <br />
                      <small>⚠️ Databricks unavailable: {dbMetadata.databricksError}</small>
                    </>
                  )}
                </>
              )}
            </Typography>
          </Paper>

          {/* Table Configuration */}
          <Paper sx={{ p: 2, mt: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" fontWeight="bold" sx={{ minWidth: '120px' }}>
                Databricks Table:
              </Typography>
              {isEditingTableName ? (
                <>
                  <TextField
                    size="small"
                    fullWidth
                    value={tableNameInput}
                    onChange={(e) => setTableNameInput(e.target.value)}
                    placeholder="e.g., main.default.property_graph_entity_edges"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveTableName();
                      } else if (e.key === 'Escape') {
                        handleCancelEditTableName();
                      }
                    }}
                    autoFocus
                  />
                  <Tooltip title="Save">
                    <IconButton
                      color="primary"
                      onClick={handleSaveTableName}
                      disabled={!tableNameInput.trim()}
                    >
                      <CheckIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <IconButton color="default" onClick={handleCancelEditTableName}>
                      <CloseIcon />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Typography variant="body2" sx={{ flexGrow: 1, fontFamily: 'monospace' }}>
                    {tableName}
                  </Typography>
                  <Tooltip title="Edit table name">
                    <IconButton
                      size="small"
                      onClick={() => setIsEditingTableName(true)}
                      disabled={isLoadingData}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Specify the Databricks table to read from and write to. Format:
              catalog.schema.table_name
            </Typography>
          </Paper>
        </Box>
      )}

      <Grid
        container
        spacing={isFullscreen ? 0 : 3}
        sx={{
          flexGrow: 1,
          minHeight: isFullscreen ? 0 : '700px',
          height: isFullscreen ? '100vh' : undefined,
        }}
      >
        {/* Node Palette */}
        {!isFullscreen && (
          <Grid size={{ xs: 12, md: 2 }} sx={{ minHeight: '700px' }}>
            <NodePalette
              onStartCreateNode={handleStartCreateNode}
              onStartCreateEdge={handleStartCreateEdge}
              disabled={isLoadingData}
            />
          </Grid>
        )}

        {/* Graph Visualization */}
        <Grid
          size={{ xs: 12, md: isFullscreen ? 12 : 7.5 }}
          sx={{
            minHeight: isFullscreen ? undefined : '700px',
            height: isFullscreen ? '100vh' : undefined,
          }}
        >
          <Paper
            ref={graphContainerRef}
            elevation={isFullscreen ? 0 : 1}
            sx={{
              height: '100%',
              p: isFullscreen ? 0 : 2,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: isFullscreen ? 0 : undefined,
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={isFullscreen ? 1 : 2}
              sx={{ flexShrink: 0, px: isFullscreen ? 2 : 0, pt: isFullscreen ? 1 : 0 }}
            >
              {!isFullscreen && <Typography variant="h6">Knowledge Graph Editor</Typography>}
              <Box
                display="flex"
                gap={1}
                alignItems="center"
                sx={{ ml: isFullscreen ? 'auto' : 0 }}
              >
                <Chip label={`${stats.existingNodes} Existing`} color="primary" size="small" />
                {hasProposedChanges && (
                  <Chip label={`${stats.newNodes} New`} color="success" size="small" />
                )}
                <Tooltip title={isFullscreen ? 'Exit Fullscreen (Esc or F)' : 'Fullscreen (F)'}>
                  <IconButton
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    color="primary"
                    size="small"
                  >
                    {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Node Search */}
            {!isFullscreen && (
              <Box sx={{ mb: 2, flexShrink: 0 }}>
                <NodeSearch
                  graphData={editor.graphData}
                  onNodeSelect={handleNodeSearchSelect}
                  disabled={isLoadingData}
                />
              </Box>
            )}
            <Box sx={{ flexGrow: 1, position: 'relative', minHeight: 0 }}>
              {isLoadingData ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Box textAlign="center">
                    <CircularProgress size={60} />
                    <Typography variant="body1" sx={{ mt: 2 }}>
                      Loading graph data...
                    </Typography>
                  </Box>
                </Box>
              ) : dataError ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Box textAlign="center">
                    <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
                    <Typography variant="h6" color="error">
                      Failed to load graph data
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {dataError}
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={loadGraphData}
                      sx={{ mt: 2 }}
                      startIcon={<RefreshIcon />}
                    >
                      Retry
                    </Button>
                  </Box>
                </Box>
              ) : (
                <GraphVisualization
                  ref={graphVisualizationRef}
                  data={editor.graphData}
                  showProposed={showProposed}
                  selectedNodeTypes={selectedNodeTypes}
                  selectedRelationshipTypes={selectedRelationshipTypes}
                  showNodeLabels={showNodeLabels}
                  showEdgeLabels={showEdgeLabels}
                  edgeLength={edgeLength}
                  nodeSize={nodeSize}
                  width={isFullscreen ? graphDimensions.width : graphDimensions.width - 32}
                  height={isFullscreen ? graphDimensions.height - 60 : graphDimensions.height - 140}
                  onNodeClick={(nodeId) => {
                    if (editor.isEdgeCreateMode) {
                      handleNodeClickForEdge(nodeId);
                    } else {
                      handleNodeEdit(nodeId);
                    }
                  }}
                  onEdgeClick={(edgeId) => {
                    if (!editor.isEdgeCreateMode) {
                      handleEdgeEdit(edgeId);
                    }
                  }}
                  edgeCreateMode={editor.isEdgeCreateMode}
                  edgeCreateSourceId={editor.edgeCreateSourceId}
                  selectedNodeId={editor.selectedNodeId}
                />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Controls Panel */}
        {!isFullscreen && (
          <Grid size={{ xs: 12, md: 2.5 }} sx={{ minHeight: '700px' }}>
            <GraphControls
              showProposed={showProposed}
              onToggleProposed={setShowProposed}
              selectedNodeTypes={selectedNodeTypes}
              onNodeTypeChange={setSelectedNodeTypes}
              selectedRelationshipTypes={selectedRelationshipTypes}
              onRelationshipTypeChange={setSelectedRelationshipTypes}
              showNodeLabels={showNodeLabels}
              onToggleNodeLabels={setShowNodeLabels}
              showEdgeLabels={showEdgeLabels}
              onToggleEdgeLabels={setShowEdgeLabels}
              edgeLength={edgeLength}
              onEdgeLengthChange={setEdgeLength}
              nodeSize={nodeSize}
              onNodeSizeChange={setNodeSize}
              onResetView={handleResetView}
              graphData={editor.graphData}
              stats={stats}
            />
          </Grid>
        )}
      </Grid>

      {/* Node Form Dialog */}
      <NodeForm
        open={nodeFormOpen}
        onClose={() => {
          setNodeFormOpen(false);
          setNodeFormInitialData(undefined);
        }}
        onSave={handleNodeFormSave}
        onDelete={handleNodeDelete}
        initialData={nodeFormInitialData}
        mode={nodeFormMode}
      />

      {/* Edge Form Dialog */}
      <EdgeForm
        open={edgeFormOpen}
        onClose={() => {
          setEdgeFormOpen(false);
          setEdgeFormInitialData(undefined);
          setEdgeFormSourceId(undefined);
          setEdgeFormTargetId(undefined);
        }}
        onSave={handleEdgeFormSave}
        onDelete={handleEdgeDelete}
        initialData={edgeFormInitialData}
        sourceNodeId={edgeFormSourceId}
        targetNodeId={edgeFormTargetId}
        mode={edgeFormMode}
        availableNodes={editor.graphData.nodes}
      />

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Save to Database</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You are about to save the following changes:
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>New Nodes:</strong> {newNodesCount}
            </Typography>
            <Typography variant="body2">
              <strong>New Edges:</strong> {newEdgesCount}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            These changes will be written to the database. If Databricks is configured, data will be
            synced there as well.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleWriteToTable}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {loading ? 'Saving...' : 'Confirm Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          icon={snackbar.severity === 'success' ? <CheckCircleIcon /> : <ErrorIcon />}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default GraphVisualizationPage;
