import React, { useRef, useCallback, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import type { GraphData, ForceGraphData, ForceGraphNode, ForceGraphLink } from '../types/graph';
import { ChangeStatus, NodeType } from '../types/graph';

interface GraphVisualizationProps {
  data: GraphData;
  showProposed: boolean;
  selectedNodeTypes: string[];
  selectedRelationshipTypes: string[];
  showNodeLabels?: boolean;
  showEdgeLabels?: boolean;
  edgeLength?: number;
  nodeSize?: number;
  width?: number;
  height?: number;
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  edgeCreateMode?: boolean;
  edgeCreateSourceId?: string | null;
  selectedNodeId?: string | null;
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  showProposed,
  selectedNodeTypes,
  selectedRelationshipTypes,
  showNodeLabels = false,
  showEdgeLabels = false,
  edgeLength = 80,
  nodeSize = 6,
  width = 800,
  height = 600,
  onNodeClick,
  onEdgeClick,
  edgeCreateMode = false,
  edgeCreateSourceId = null,
  selectedNodeId = null,
}) => {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<ForceGraphNode | null>(null);
  const [graphData, setGraphData] = useState<ForceGraphData>({ nodes: [], links: [] });

  // Color schemes for different node types
  const getNodeColor = useCallback(
    (node: ForceGraphNode): string => {
      if (node.status === ChangeStatus.NEW) {
        return theme.palette.mode === 'dark' ? '#4caf50' : '#2e7d32';
      }

      // Color by type for existing nodes
      switch (node.type) {
        case NodeType.PERSON:
          return theme.palette.mode === 'dark' ? '#42a5f5' : '#1976d2';
        case NodeType.COMPANY:
          return theme.palette.mode === 'dark' ? '#ab47bc' : '#7b1fa2';
        case NodeType.PRODUCT:
          return theme.palette.mode === 'dark' ? '#ff9800' : '#f57c00';
        case NodeType.LOCATION:
          return theme.palette.mode === 'dark' ? '#ef5350' : '#c62828';
        default:
          return theme.palette.mode === 'dark' ? '#78909c' : '#546e7a';
      }
    },
    [theme.palette.mode]
  );

  const getLinkColor = useCallback(
    (link: ForceGraphLink): string => {
      if (link.status === ChangeStatus.NEW) {
        return theme.palette.mode === 'dark' ? '#66bb6a' : '#43a047';
      }
      return theme.palette.mode === 'dark' ? '#616161' : '#9e9e9e';
    },
    [theme.palette.mode]
  );

  // Transform data for react-force-graph
  useEffect(() => {
    const filteredNodes = data.nodes.filter((node) => {
      if (!showProposed && node.status === ChangeStatus.NEW) return false;
      if (selectedNodeTypes.length > 0 && !selectedNodeTypes.includes(node.type)) return false;
      return true;
    });

    const nodeIds = new Set(filteredNodes.map((n) => n.id));

    const filteredEdges = data.edges.filter((edge) => {
      if (!showProposed && edge.status === ChangeStatus.NEW) return false;
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return false;
      if (
        selectedRelationshipTypes.length > 0 &&
        !selectedRelationshipTypes.includes(edge.relationshipType)
      )
        return false;
      return true;
    });

    const forceNodes: ForceGraphNode[] = filteredNodes.map((node) => ({
      id: node.id,
      name: node.label,
      type: node.type,
      status: node.status,
      properties: node.properties,
      val: node.status === ChangeStatus.NEW ? nodeSize * 1.3 : nodeSize,
    }));

    const forceLinks: ForceGraphLink[] = filteredEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      relationshipType: edge.relationshipType,
      status: edge.status,
      properties: edge.properties,
    }));

    setGraphData({ nodes: forceNodes, links: forceLinks });
  }, [data, showProposed, selectedNodeTypes, selectedRelationshipTypes, nodeSize]);

  // Configure d3 forces to spread nodes farther apart
  useEffect(() => {
    if (graphRef.current) {
      // Set link distance based on slider value
      graphRef.current.d3Force('link')?.distance(edgeLength);

      // Adjust charge strength proportionally to edge length for better layout
      const chargeStrength = -(edgeLength * 2.5);
      graphRef.current.d3Force('charge')?.strength(chargeStrength);

      // Restart the simulation with new forces
      graphRef.current.d3ReheatSimulation();
    }
  }, [graphData, edgeLength]);

  const handleNodeHover = useCallback((node: ForceGraphNode | null) => {
    setHoveredNode(node);
  }, []);

  const handleNodeClick = useCallback(
    (node: ForceGraphNode) => {
      if (onNodeClick) {
        onNodeClick(node.id as string);
      } else if (graphRef.current) {
        // Default behavior: center on node
        graphRef.current.centerAt(node.x, node.y, 1000);
        graphRef.current.zoom(2, 1000);
      }
    },
    [onNodeClick]
  );

  const handleLinkClick = useCallback(
    (link: ForceGraphLink) => {
      if (onEdgeClick) {
        onEdgeClick(link.id as string);
      }
    },
    [onEdgeClick]
  );

  const paintNode = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any, ctx: CanvasRenderingContext2D) => {
      const label = node.name;
      const fontSize = 11;
      const nodeRadius = node.val || 5;

      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = getNodeColor(node);
      ctx.fill();

      // Add border for new nodes
      if (node.status === ChangeStatus.NEW) {
        ctx.strokeStyle = theme.palette.mode === 'dark' ? '#81c784' : '#1b5e20';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Determine if label should be shown
      const isHovered = hoveredNode && hoveredNode.id === node.id;
      const isSelected = selectedNodeId && selectedNodeId === node.id;
      const isEdgeCreateSource = edgeCreateMode && edgeCreateSourceId === node.id;
      const shouldShowLabel = showNodeLabels || isHovered || isSelected || isEdgeCreateSource;

      // Draw label only when appropriate
      if (shouldShowLabel) {
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Measure text for background
        const textMetrics = ctx.measureText(label);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;
        const padding = 4;
        const labelY = node.y + nodeRadius + 12;

        // Draw semi-transparent background
        ctx.fillStyle =
          theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(
          node.x - textWidth / 2 - padding,
          labelY - textHeight / 2 - padding,
          textWidth + padding * 2,
          textHeight + padding * 2
        );

        // Draw text
        ctx.fillStyle = theme.palette.text.primary;
        ctx.fillText(label, node.x, labelY);
      }

      // Highlight hovered node
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = theme.palette.primary.main;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Highlight selected node
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius + 4, 0, 2 * Math.PI);
        ctx.strokeStyle = theme.palette.secondary.main;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Highlight source node in edge create mode
      if (isEdgeCreateSource) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = theme.palette.success.main;
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    },
    [
      hoveredNode,
      theme,
      getNodeColor,
      selectedNodeId,
      edgeCreateMode,
      edgeCreateSourceId,
      showNodeLabels,
    ]
  );

  const paintLink = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (link: any, ctx: CanvasRenderingContext2D) => {
      const start = link.source;
      const end = link.target;

      // Draw link
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = getLinkColor(link);
      ctx.lineWidth = link.status === ChangeStatus.NEW ? 2 : 1;
      if (link.status === ChangeStatus.NEW) {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw arrow
      const arrowLength = 8;
      const angle = Math.atan2(end.y - start.y, end.x - start.x);

      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - arrowLength * Math.cos(angle - Math.PI / 6),
        end.y - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        end.x - arrowLength * Math.cos(angle + Math.PI / 6),
        end.y - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = getLinkColor(link);
      ctx.fill();

      // Draw edge label if enabled
      if (showEdgeLabels && link.relationshipType) {
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const label = link.relationshipType;
        const fontSize = 10;

        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Measure text for background
        const textMetrics = ctx.measureText(label);
        const textWidth = textMetrics.width;
        const padding = 3;

        // Draw semi-transparent background
        ctx.fillStyle =
          theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(
          midX - textWidth / 2 - padding,
          midY - fontSize / 2 - padding,
          textWidth + padding * 2,
          fontSize + padding * 2
        );

        // Draw text
        ctx.fillStyle = theme.palette.text.secondary;
        ctx.fillText(label, midX, midY);
      }
    },
    [getLinkColor, showEdgeLabels, theme]
  );

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
          borderRadius: 1,
          overflow: 'hidden',
          cursor: edgeCreateMode ? 'crosshair' : 'default',
        }}
      >
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={width}
          height={height}
          backgroundColor={theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5'}
          nodeCanvasObject={paintNode}
          linkCanvasObject={paintLink}
          onNodeHover={handleNodeHover}
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          cooldownTicks={100}
          onEngineStop={() => graphRef.current?.zoomToFit(400, 50)}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      </Box>

      {/* Hover tooltip */}
      {hoveredNode && (
        <Paper
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            p: 2,
            maxWidth: 300,
            zIndex: 1000,
          }}
          elevation={4}
        >
          <Typography variant="h6" gutterBottom>
            {hoveredNode.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Type: {hoveredNode.type}
          </Typography>
          <Typography
            variant="body2"
            color={hoveredNode.status === ChangeStatus.NEW ? 'success.main' : 'text.secondary'}
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            Status: {hoveredNode.status === ChangeStatus.NEW ? 'Proposed New' : 'Existing'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Properties:
          </Typography>
          <Box sx={{ pl: 2 }}>
            {Object.entries(hoveredNode.properties).map(([key, value]) => (
              <Typography key={key} variant="caption" display="block">
                <strong>{key}:</strong> {String(value)}
              </Typography>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default GraphVisualization;
