import { useState, useCallback, useEffect } from 'react';
import type { GraphNode, GraphEdge, GraphData } from '../types/graph';
import { ChangeStatus } from '../types/graph';

interface UseGraphEditorOptions {
  initialData: GraphData;
}

interface UseGraphEditorReturn {
  // Current graph data (original + user modifications)
  graphData: GraphData;

  // User-created items (not yet saved)
  userCreatedNodes: GraphNode[];
  userCreatedEdges: GraphEdge[];

  // Selection state
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  // Edge creation mode
  isEdgeCreateMode: boolean;
  edgeCreateSourceId: string | null;

  // Actions
  addNode: (node: Omit<GraphNode, 'status'>) => void;
  updateNode: (nodeId: string, updates: Partial<GraphNode>) => void;
  deleteNode: (nodeId: string) => void;

  addEdge: (edge: Omit<GraphEdge, 'status'>) => void;
  updateEdge: (edgeId: string, updates: Partial<GraphEdge>) => void;
  deleteEdge: (edgeId: string) => void;

  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;

  // Edge creation flow
  startEdgeCreateMode: () => void;
  cancelEdgeCreateMode: () => void;
  handleNodeClickForEdge: (nodeId: string) => { sourceId: string; targetId: string } | null;

  // Save and reset
  markItemsAsSaved: (nodeIds: string[], edgeIds: string[]) => void;
  resetToInitialData: (newData: GraphData) => void;

  // Statistics
  getStats: () => {
    totalNodes: number;
    totalEdges: number;
    newNodes: number;
    newEdges: number;
  };
}

/**
 * Custom hook for managing graph editor state
 */
export function useGraphEditor({ initialData }: UseGraphEditorOptions): UseGraphEditorReturn {
  // Store original data separate from user modifications
  const [originalData, setOriginalData] = useState<GraphData>(initialData);

  // User-created items (not yet saved to backend)
  const [userCreatedNodes, setUserCreatedNodes] = useState<GraphNode[]>([]);
  const [userCreatedEdges, setUserCreatedEdges] = useState<GraphEdge[]>([]);

  // Modified items (existing items that were edited)
  const [modifiedNodes, setModifiedNodes] = useState<Map<string, Partial<GraphNode>>>(new Map());
  const [modifiedEdges, setModifiedEdges] = useState<Map<string, Partial<GraphEdge>>>(new Map());

  // Deleted items
  const [deletedNodeIds, setDeletedNodeIds] = useState<Set<string>>(new Set());
  const [deletedEdgeIds, setDeletedEdgeIds] = useState<Set<string>>(new Set());

  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Edge creation mode
  const [isEdgeCreateMode, setIsEdgeCreateMode] = useState(false);
  const [edgeCreateSourceId, setEdgeCreateSourceId] = useState<string | null>(null);

  // Update original data when initial data changes
  useEffect(() => {
    setOriginalData(initialData);
  }, [initialData]);

  // Compute combined graph data (original + modifications)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const graphData: GraphData = {
    nodes: [
      ...originalData.nodes
        .filter((node) => !deletedNodeIds.has(node.id))
        .map((node) => {
          const modifications = modifiedNodes.get(node.id);
          return modifications ? { ...node, ...modifications } : node;
        }),
      ...userCreatedNodes.filter((node) => !deletedNodeIds.has(node.id)),
    ],
    edges: [
      ...originalData.edges
        .filter((edge) => !deletedEdgeIds.has(edge.id))
        .map((edge) => {
          const modifications = modifiedEdges.get(edge.id);
          return modifications ? { ...edge, ...modifications } : edge;
        }),
      ...userCreatedEdges.filter((edge) => !deletedEdgeIds.has(edge.id)),
    ],
  };

  // Add a new node (user-created)
  const addNode = useCallback((node: Omit<GraphNode, 'status'>) => {
    const newNode: GraphNode = {
      ...node,
      status: ChangeStatus.NEW,
    };
    setUserCreatedNodes((prev) => [...prev, newNode]);
  }, []);

  // Update a node
  const updateNode = useCallback(
    (nodeId: string, updates: Partial<GraphNode>) => {
      // Check if it's a user-created node
      const userNodeIndex = userCreatedNodes.findIndex((n) => n.id === nodeId);
      if (userNodeIndex !== -1) {
        setUserCreatedNodes((prev) =>
          prev.map((node, idx) => (idx === userNodeIndex ? { ...node, ...updates } : node))
        );
      } else {
        // It's an original node, track modifications
        setModifiedNodes((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(nodeId) || {};
          newMap.set(nodeId, { ...existing, ...updates });
          return newMap;
        });
      }
    },
    [userCreatedNodes]
  );

  // Delete a node
  const deleteNode = useCallback(
    (nodeId: string) => {
      // Check if it's a user-created node
      const isUserCreated = userCreatedNodes.some((n) => n.id === nodeId);

      if (isUserCreated) {
        // Remove from user-created list
        setUserCreatedNodes((prev) => prev.filter((n) => n.id !== nodeId));
        // Also remove any edges connected to this node
        setUserCreatedEdges((prev) =>
          prev.filter((e) => e.source !== nodeId && e.target !== nodeId)
        );
      } else {
        // Mark as deleted
        setDeletedNodeIds((prev) => new Set(prev).add(nodeId));
        // Also mark connected edges as deleted
        const connectedEdges = originalData.edges
          .filter((e) => e.source === nodeId || e.target === nodeId)
          .map((e) => e.id);
        setDeletedEdgeIds((prev) => {
          const newSet = new Set(prev);
          connectedEdges.forEach((id) => newSet.add(id));
          return newSet;
        });
      }

      // Clear selection if this node was selected
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    },
    [userCreatedNodes, originalData.edges, selectedNodeId]
  );

  // Add a new edge (user-created)
  const addEdge = useCallback((edge: Omit<GraphEdge, 'status'>) => {
    const newEdge: GraphEdge = {
      ...edge,
      status: ChangeStatus.NEW,
    };
    setUserCreatedEdges((prev) => [...prev, newEdge]);
  }, []);

  // Update an edge
  const updateEdge = useCallback(
    (edgeId: string, updates: Partial<GraphEdge>) => {
      // Check if it's a user-created edge
      const userEdgeIndex = userCreatedEdges.findIndex((e) => e.id === edgeId);
      if (userEdgeIndex !== -1) {
        setUserCreatedEdges((prev) =>
          prev.map((edge, idx) => (idx === userEdgeIndex ? { ...edge, ...updates } : edge))
        );
      } else {
        // It's an original edge, track modifications
        setModifiedEdges((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(edgeId) || {};
          newMap.set(edgeId, { ...existing, ...updates });
          return newMap;
        });
      }
    },
    [userCreatedEdges]
  );

  // Delete an edge
  const deleteEdge = useCallback(
    (edgeId: string) => {
      // Check if it's a user-created edge
      const isUserCreated = userCreatedEdges.some((e) => e.id === edgeId);

      if (isUserCreated) {
        // Remove from user-created list
        setUserCreatedEdges((prev) => prev.filter((e) => e.id !== edgeId));
      } else {
        // Mark as deleted
        setDeletedEdgeIds((prev) => new Set(prev).add(edgeId));
      }

      // Clear selection if this edge was selected
      if (selectedEdgeId === edgeId) {
        setSelectedEdgeId(null);
      }
    },
    [userCreatedEdges, selectedEdgeId]
  );

  // Selection
  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  }, []);

  const selectEdge = useCallback((edgeId: string | null) => {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
  }, []);

  // Edge creation mode
  const startEdgeCreateMode = useCallback(() => {
    setIsEdgeCreateMode(true);
    setEdgeCreateSourceId(null);
  }, []);

  const cancelEdgeCreateMode = useCallback(() => {
    setIsEdgeCreateMode(false);
    setEdgeCreateSourceId(null);
  }, []);

  const handleNodeClickForEdge = useCallback(
    (nodeId: string): { sourceId: string; targetId: string } | null => {
      if (!isEdgeCreateMode) return null;

      if (!edgeCreateSourceId) {
        // First click - set source
        setEdgeCreateSourceId(nodeId);
        return null;
      } else {
        // Second click - create edge
        const sourceId = edgeCreateSourceId;
        const targetId = nodeId;

        // Reset edge creation mode
        setIsEdgeCreateMode(false);
        setEdgeCreateSourceId(null);

        // Return source and target for the caller to open the edge form
        return { sourceId, targetId };
      }
    },
    [isEdgeCreateMode, edgeCreateSourceId]
  );

  // Mark items as saved (change status from NEW to EXISTING)
  const markItemsAsSaved = useCallback((nodeIds: string[], edgeIds: string[]) => {
    // Move user-created nodes to original data with EXISTING status
    setUserCreatedNodes((prev) => {
      const savedNodes = prev.filter((n) => nodeIds.includes(n.id));
      const remainingNodes = prev.filter((n) => !nodeIds.includes(n.id));

      // Add saved nodes to original data
      if (savedNodes.length > 0) {
        setOriginalData((data) => ({
          ...data,
          nodes: [
            ...data.nodes,
            ...savedNodes.map((n) => ({ ...n, status: ChangeStatus.EXISTING })),
          ],
        }));
      }

      return remainingNodes;
    });

    // Move user-created edges to original data with EXISTING status
    setUserCreatedEdges((prev) => {
      const savedEdges = prev.filter((e) => edgeIds.includes(e.id));
      const remainingEdges = prev.filter((e) => !edgeIds.includes(e.id));

      // Add saved edges to original data
      if (savedEdges.length > 0) {
        setOriginalData((data) => ({
          ...data,
          edges: [
            ...data.edges,
            ...savedEdges.map((e) => ({ ...e, status: ChangeStatus.EXISTING })),
          ],
        }));
      }

      return remainingEdges;
    });
  }, []);

  // Reset to new initial data (e.g., after refetch from backend)
  const resetToInitialData = useCallback((newData: GraphData) => {
    setOriginalData(newData);
    setUserCreatedNodes([]);
    setUserCreatedEdges([]);
    setModifiedNodes(new Map());
    setModifiedEdges(new Map());
    setDeletedNodeIds(new Set());
    setDeletedEdgeIds(new Set());
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  // Get statistics
  const getStats = useCallback(() => {
    return {
      totalNodes: graphData.nodes.length,
      totalEdges: graphData.edges.length,
      newNodes: userCreatedNodes.filter((n) => !deletedNodeIds.has(n.id)).length,
      newEdges: userCreatedEdges.filter((e) => !deletedEdgeIds.has(e.id)).length,
    };
  }, [graphData, userCreatedNodes, userCreatedEdges, deletedNodeIds, deletedEdgeIds]);

  return {
    graphData,
    userCreatedNodes: userCreatedNodes.filter((n) => !deletedNodeIds.has(n.id)),
    userCreatedEdges: userCreatedEdges.filter((e) => !deletedEdgeIds.has(e.id)),
    selectedNodeId,
    selectedEdgeId,
    isEdgeCreateMode,
    edgeCreateSourceId,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    updateEdge,
    deleteEdge,
    selectNode,
    selectEdge,
    startEdgeCreateMode,
    cancelEdgeCreateMode,
    handleNodeClickForEdge,
    markItemsAsSaved,
    resetToInitialData,
    getStats,
  };
}
