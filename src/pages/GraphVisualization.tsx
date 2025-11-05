import React, { useState, useEffect, useRef } from 'react';
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
} from '@mui/material';
import {
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import GraphVisualization from '../components/GraphVisualization';
import GraphControls from '../components/GraphControls';
import NodePalette from '../components/NodePalette';
import { NodeForm, EdgeForm } from '../components/NodeEdgeForm';
import { useGraphEditor } from '../hooks/useGraphEditor';
import type { GraphData, GraphStats, GraphNode, GraphEdge } from '../types/graph';
import { writeToTable, fetchGraphData } from '../services/graphApi';
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
  const [showProposed, setShowProposed] = useState(true);
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<string[]>([]);
  const [selectedRelationshipTypes, setSelectedRelationshipTypes] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<GraphData>({ nodes: [], edges: [] });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

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

  const loadGraphData = async () => {
    setIsLoadingData(true);
    setDataError(null);

    // Check if backend API is configured (matches graphApi.ts logic)
    const useBackend = import.meta.env.VITE_USE_BACKEND_API !== 'false';

    try {
      const response = await fetchGraphData();
      setInitialData({ nodes: response.nodes, edges: response.edges });
      editor.resetToInitialData({ nodes: response.nodes, edges: response.edges });

      // Log metadata from backend (includes source database and any errors)
      if (response.metadata) {
        console.log('📊 Database Metadata:', response.metadata);
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
  };

  // Node creation from palette
  const handleStartCreateNode = (nodeType: string) => {
    setNodeFormMode('create');
    setNodeFormInitialData({
      id: '',
      label: '',
      type: nodeType,
      status: ChangeStatus.NEW,
      properties: {},
    });
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

  // Edge creation
  const handleStartCreateEdge = () => {
    if (editor.isEdgeCreateMode) {
      editor.cancelEdgeCreateMode();
    } else {
      editor.startEdgeCreateMode();
    }
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

  // Delete node from GUI
  const handleNodeDelete = (nodeId: string) => {
    editor.deleteNode(nodeId);
  };

  // Delete edge from GUI
  const handleEdgeDelete = (edgeId: string) => {
    editor.deleteEdge(edgeId);
  };

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
          // Only allow deletion of NEW nodes
          if (node && node.status === ChangeStatus.NEW) {
            editor.deleteNode(editor.selectedNodeId);
          }
        } else if (editor.selectedEdgeId) {
          const edge = editor.graphData.edges.find((e) => e.id === editor.selectedEdgeId);
          // Only allow deletion of NEW edges
          if (edge && edge.status === ChangeStatus.NEW) {
            editor.deleteEdge(editor.selectedEdgeId);
          }
        }
      }

      // Escape to cancel edge creation mode
      if (e.key === 'Escape' && editor.isEdgeCreateMode) {
        editor.cancelEdgeCreateMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  // Save to backend
  const handleWriteToTable = async () => {
    setConfirmDialogOpen(false);
    setLoading(true);

    try {
      // Only send NEW nodes and edges to backend
      const result = await writeToTable(editor.userCreatedNodes, editor.userCreatedEdges);

      if (result.success) {
        setSnackbar({
          open: true,
          message: `${result.message}`,
          severity: 'success',
        });

        // Mark items as saved (update their status to EXISTING)
        const nodeIds = editor.userCreatedNodes.map((n) => n.id);
        const edgeIds = editor.userCreatedEdges.map((e) => e.id);
        editor.markItemsAsSaved(nodeIds, edgeIds);
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
    <Container maxWidth={false} sx={{ minHeight: '100vh', py: 3 }}>
      <Box sx={{ mb: 3 }}>
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
                To sync with Databricks, configure DATABRICKS_CLIENT_ID and DATABRICKS_CLIENT_SECRET
                in backend/.env
              </>
            ) : (
              <>
                <strong>Connected:</strong> Backend API → SQLite (with Databricks sync)
              </>
            )}
          </Typography>
        </Paper>
      </Box>

      <Grid container spacing={3} sx={{ height: 'calc(100vh - 200px)' }}>
        {/* Node Palette */}
        <Grid size={{ xs: 12, md: 2.5 }}>
          <NodePalette
            onStartCreateNode={handleStartCreateNode}
            onStartCreateEdge={handleStartCreateEdge}
            isEdgeCreateMode={editor.isEdgeCreateMode}
            disabled={isLoadingData}
          />
        </Grid>

        {/* Graph Visualization */}
        <Grid size={{ xs: 12, md: 6.5 }}>
          <Paper
            ref={graphContainerRef}
            sx={{
              height: '100%',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Knowledge Graph Editor</Typography>
              <Box display="flex" gap={1}>
                <Chip label={`${stats.existingNodes} Existing`} color="primary" size="small" />
                {hasProposedChanges && (
                  <Chip label={`${stats.newNodes} New`} color="success" size="small" />
                )}
              </Box>
            </Box>
            <Box sx={{ flexGrow: 1, position: 'relative' }}>
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
                  data={editor.graphData}
                  showProposed={showProposed}
                  selectedNodeTypes={selectedNodeTypes}
                  selectedRelationshipTypes={selectedRelationshipTypes}
                  width={graphDimensions.width - 32}
                  height={graphDimensions.height - 100}
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
                  onNodeDrop={handleStartCreateNode}
                  edgeCreateMode={editor.isEdgeCreateMode}
                  edgeCreateSourceId={editor.edgeCreateSourceId}
                  selectedNodeId={editor.selectedNodeId}
                />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Controls Panel */}
        <Grid size={{ xs: 12, md: 3 }}>
          <GraphControls
            showProposed={showProposed}
            onToggleProposed={setShowProposed}
            selectedNodeTypes={selectedNodeTypes}
            onNodeTypeChange={setSelectedNodeTypes}
            selectedRelationshipTypes={selectedRelationshipTypes}
            onRelationshipTypeChange={setSelectedRelationshipTypes}
            onResetView={handleResetView}
            stats={stats}
          />
        </Grid>
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
