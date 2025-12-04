import {
  useRef,
  useCallback,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Box, Paper, Typography, useTheme, IconButton, Stack, Tooltip } from '@mui/material';
import { ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon } from '@mui/icons-material';
import type { GraphData, ForceGraphData, ForceGraphNode, ForceGraphLink } from '../types/graph';
import { ChangeStatus, getColorForType } from '../types/graph';
import { vibrantColors } from '../theme/theme';

// Throttle helper for hover events
function throttle<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): T {
  let lastCall = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}

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

export interface GraphVisualizationRef {
  resetView: () => void;
  centerOnNode: (nodeId: string) => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

const GraphVisualization = forwardRef<GraphVisualizationRef, GraphVisualizationProps>(
  (
    {
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
    },
    ref
  ) => {
    const theme = useTheme();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const graphRef = useRef<any>(null);
    const [hoveredNode, setHoveredNode] = useState<ForceGraphNode | null>(null);
    const [graphData, setGraphData] = useState<ForceGraphData>({ nodes: [], links: [] });
    const [hasInitialized, setHasInitialized] = useState(false);

    // Color schemes for different node types - now dynamic!
    const getNodeColor = useCallback(
      (node: ForceGraphNode): string => {
        if (node.status === ChangeStatus.NEW) {
          return vibrantColors.boldGreen;
        }

        // Use dynamic color generation for any node type
        return getColorForType(node.type, theme.palette.mode === 'dark');
      },
      [theme.palette.mode]
    );

    const getLinkColor = useCallback(
      (link: ForceGraphLink): string => {
        if (link.status === ChangeStatus.NEW) {
          return vibrantColors.boldGreen;
        }
        return theme.palette.mode === 'dark' ? '#64748B' : '#94A3B8';
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

        // Only restart the simulation when edge length changes, not on every data update
        graphRef.current.d3ReheatSimulation();
      }
    }, [edgeLength]);

    // Expose methods to parent component
    useImperativeHandle(
      ref,
      () => ({
        resetView: () => {
          if (graphRef.current) {
            graphRef.current.zoomToFit(400, 50);
          }
        },
        centerOnNode: (nodeId: string) => {
          if (graphRef.current) {
            const node = graphData.nodes.find((n) => n.id === nodeId);
            if (node && node.x !== undefined && node.y !== undefined) {
              // Center on node and zoom in slightly
              graphRef.current.centerAt(node.x, node.y, 1000);
              graphRef.current.zoom(2, 1000);
            }
          }
        },
        zoomIn: () => {
          if (graphRef.current) {
            const currentZoom = graphRef.current.zoom();
            graphRef.current.zoom(currentZoom * 1.3, 300);
          }
        },
        zoomOut: () => {
          if (graphRef.current) {
            const currentZoom = graphRef.current.zoom();
            graphRef.current.zoom(currentZoom / 1.3, 300);
          }
        },
      }),
      [graphData.nodes]
    );

    // Throttle hover updates to reduce re-renders (especially important when labels are on)
    const handleNodeHover = useMemo(
      () =>
        throttle((node: ForceGraphNode | null) => {
          setHoveredNode(node);
        }, 50), // 50ms throttle - still responsive but reduces updates
      []
    );

    const handleNodeClick = useCallback(
      (node: ForceGraphNode) => {
        if (onNodeClick) {
          onNodeClick(node.id as string);
        } else if (graphRef.current) {
          // Default behavior: center on node without changing zoom level
          graphRef.current.centerAt(node.x, node.y, 1000);
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

    const handleZoomIn = useCallback(() => {
      if (graphRef.current) {
        const currentZoom = graphRef.current.zoom();
        graphRef.current.zoom(currentZoom * 1.3, 300);
      }
    }, []);

    const handleZoomOut = useCallback(() => {
      if (graphRef.current) {
        const currentZoom = graphRef.current.zoom();
        graphRef.current.zoom(currentZoom / 1.3, 300);
      }
    }, []);

    const paintNode = useCallback(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (node: any, ctx: CanvasRenderingContext2D) => {
        // Validate coordinates are finite numbers before drawing
        if (!isFinite(node.x) || !isFinite(node.y)) {
          return;
        }

        const nodeRadius = node.val || 5;
        const nodeColor = getNodeColor(node);
        const isNew = node.status === ChangeStatus.NEW;

        // Determine states - but skip hover check when labels are on for performance
        const isSelected = selectedNodeId && selectedNodeId === node.id;
        const isEdgeCreateSource = edgeCreateMode && edgeCreateSourceId === node.id;
        // Only check hover state when labels are OFF (expensive to track per-node)
        const isHovered = !showNodeLabels && hoveredNode && hoveredNode.id === node.id;
        const isSpecialNode = isHovered || isSelected || isEdgeCreateSource;

        // PERFORMANCE MODE: When labels are on, use ultra-minimal rendering
        if (showNodeLabels && !isSpecialNode && !isNew) {
          // Just draw a simple circle - no gradients, no effects
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
          ctx.fillStyle = nodeColor;
          ctx.fill();

          // Draw label text directly - no background box for performance
          ctx.fillStyle = theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(node.name, node.x, node.y + nodeRadius + 10);
          return;
        }

        // FULL RENDERING: When labels are off or for special nodes
        // Draw glow effect only for special or new nodes
        if (isSpecialNode || isNew) {
          const glowRadius = nodeRadius + (isHovered ? 8 : 6);
          const gradient = ctx.createRadialGradient(
            node.x,
            node.y,
            nodeRadius,
            node.x,
            node.y,
            glowRadius
          );

          if (isNew) {
            gradient.addColorStop(0, `${vibrantColors.boldGreen}40`);
            gradient.addColorStop(1, `${vibrantColors.boldGreen}00`);
          } else if (isEdgeCreateSource) {
            gradient.addColorStop(0, `${vibrantColors.boldGreen}60`);
            gradient.addColorStop(1, `${vibrantColors.boldGreen}00`);
          } else if (isSelected) {
            gradient.addColorStop(0, `${vibrantColors.vibrantPurple}60`);
            gradient.addColorStop(1, `${vibrantColors.vibrantPurple}00`);
          } else if (isHovered) {
            gradient.addColorStop(0, `${vibrantColors.electricBlue}60`);
            gradient.addColorStop(1, `${vibrantColors.electricBlue}00`);
          }

          ctx.beginPath();
          ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Draw node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = nodeColor;
        ctx.fill();

        // New node indicator
        if (isNew) {
          ctx.strokeStyle = vibrantColors.emerald;
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Draw label for special nodes or when labels are off but hovering
        if (isSpecialNode) {
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const labelY = node.y + nodeRadius + 12;

          // Background for special nodes only
          const textWidth = ctx.measureText(node.name).width;
          ctx.fillStyle =
            theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(node.x - textWidth / 2 - 4, labelY - 8, textWidth + 8, 16);

          ctx.fillStyle = isNew
            ? vibrantColors.boldGreen
            : isSelected
              ? vibrantColors.vibrantPurple
              : vibrantColors.electricBlue;
          ctx.fillText(node.name, node.x, labelY);
        }

        // Highlight rings for special nodes
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius + 3, 0, 2 * Math.PI);
          ctx.strokeStyle = vibrantColors.electricBlue;
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius + 4, 0, 2 * Math.PI);
          ctx.strokeStyle = vibrantColors.hotPink;
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        if (isEdgeCreateSource) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius + 5, 0, 2 * Math.PI);
          ctx.strokeStyle = vibrantColors.boldGreen;
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

        // Validate coordinates
        if (!isFinite(start.x) || !isFinite(start.y) || !isFinite(end.x) || !isFinite(end.y)) {
          return;
        }

        const isNew = link.status === ChangeStatus.NEW;
        const linkColor = getLinkColor(link);

        // PERFORMANCE MODE: When edge labels are on, use ultra-minimal rendering
        if (showEdgeLabels && !isNew) {
          // Simple line - no arrows, minimal styling
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.strokeStyle = linkColor;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Draw label text directly - no background for performance
          if (link.relationshipType) {
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;
            ctx.fillStyle = theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(link.relationshipType, midX, midY);
          }
          return;
        }

        // FULL RENDERING: When edge labels are off or for new links
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);

        if (isNew) {
          ctx.strokeStyle = vibrantColors.boldGreen;
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 4]);
        } else {
          ctx.strokeStyle = linkColor;
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
        }

        ctx.stroke();
        ctx.setLineDash([]);

        // Draw arrow
        const arrowLength = isNew ? 10 : 8;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const arrowX = end.x - (end.val || 5) * Math.cos(angle);
        const arrowY = end.y - (end.val || 5) * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowLength * Math.cos(angle - Math.PI / 7),
          arrowY - arrowLength * Math.sin(angle - Math.PI / 7)
        );
        ctx.lineTo(
          arrowX - arrowLength * Math.cos(angle + Math.PI / 7),
          arrowY - arrowLength * Math.sin(angle + Math.PI / 7)
        );
        ctx.closePath();
        ctx.fillStyle = isNew ? vibrantColors.boldGreen : linkColor;
        ctx.fill();

        // Draw edge label for new links when labels are on
        if (showEdgeLabels && isNew && link.relationshipType) {
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          ctx.fillStyle = vibrantColors.emerald;
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(link.relationshipType, midX, midY);
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
            background:
              theme.palette.mode === 'dark'
                ? 'radial-gradient(circle at 20% 20%, rgba(0, 102, 255, 0.05) 0%, rgba(15, 23, 42, 1) 50%)'
                : 'radial-gradient(circle at 20% 20%, rgba(0, 212, 255, 0.05) 0%, rgba(248, 250, 252, 1) 50%)',
            borderRadius: 1,
            overflow: 'hidden',
            cursor: edgeCreateMode ? 'crosshair' : 'default',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage:
                theme.palette.mode === 'dark'
                  ? 'radial-gradient(circle, rgba(0, 102, 255, 0.1) 1px, transparent 1px)'
                  : 'radial-gradient(circle, rgba(0, 102, 255, 0.05) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              opacity: 0.3,
              pointerEvents: 'none',
            },
          }}
        >
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={width}
            height={height}
            backgroundColor="transparent"
            nodeCanvasObject={paintNode}
            linkCanvasObject={paintLink}
            // Disable hover tracking when labels are on for better performance
            onNodeHover={showNodeLabels && showEdgeLabels ? undefined : handleNodeHover}
            onNodeClick={handleNodeClick}
            onLinkClick={handleLinkClick}
            enableNodeDrag={true}
            enableZoomInteraction={true}
            enablePanInteraction={true}
            // Faster simulation settling
            cooldownTicks={50}
            warmupTicks={showNodeLabels || showEdgeLabels ? 100 : 0}
            onEngineStop={() => {
              // Only zoom to fit on initial load, not on every simulation stop
              if (!hasInitialized && graphData.nodes.length > 0) {
                graphRef.current?.zoomToFit(400, 50);
                setHasInitialized(true);
              }
            }}
            // Higher decay = simulation stops faster
            d3AlphaDecay={showNodeLabels || showEdgeLabels ? 0.05 : 0.02}
            d3VelocityDecay={showNodeLabels || showEdgeLabels ? 0.5 : 0.3}
          />
        </Box>

        {/* Zoom Controls */}
        <Stack
          spacing={1.5}
          sx={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            zIndex: 1000,
          }}
        >
          <Tooltip title="Zoom In" placement="left">
            <Paper
              elevation={4}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${vibrantColors.electricBlue}15 0%, ${vibrantColors.skyBlue}15 100%)`,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 20px ${vibrantColors.electricBlue}40`,
                },
              }}
            >
              <IconButton
                onClick={handleZoomIn}
                size="medium"
                sx={{
                  color: vibrantColors.electricBlue,
                  '&:hover': {
                    background: `${vibrantColors.electricBlue}20`,
                  },
                }}
              >
                <ZoomInIcon />
              </IconButton>
            </Paper>
          </Tooltip>
          <Tooltip title="Zoom Out" placement="left">
            <Paper
              elevation={4}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${vibrantColors.vibrantPurple}15 0%, ${vibrantColors.hotPink}15 100%)`,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 20px ${vibrantColors.vibrantPurple}40`,
                },
              }}
            >
              <IconButton
                onClick={handleZoomOut}
                size="medium"
                sx={{
                  color: vibrantColors.vibrantPurple,
                  '&:hover': {
                    background: `${vibrantColors.vibrantPurple}20`,
                  },
                }}
              >
                <ZoomOutIcon />
              </IconButton>
            </Paper>
          </Tooltip>
        </Stack>

        {/* Hover tooltip */}
        {hoveredNode && (
          <Paper
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              p: 2.5,
              maxWidth: 320,
              zIndex: 1000,
              borderRadius: 3,
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
              backdropFilter: 'blur(10px)',
              borderLeft: `4px solid ${hoveredNode.status === ChangeStatus.NEW ? vibrantColors.boldGreen : vibrantColors.electricBlue}`,
              boxShadow:
                hoveredNode.status === ChangeStatus.NEW
                  ? `0 8px 32px ${vibrantColors.boldGreen}30`
                  : `0 8px 32px ${vibrantColors.electricBlue}30`,
              animation: 'fadeIn 0.2s ease-out',
              '@keyframes fadeIn': {
                from: { opacity: 0, transform: 'translateY(-10px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
            elevation={8}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 700,
                background:
                  hoveredNode.status === ChangeStatus.NEW
                    ? `linear-gradient(135deg, ${vibrantColors.boldGreen} 0%, ${vibrantColors.emerald} 100%)`
                    : `linear-gradient(135deg, ${vibrantColors.electricBlue} 0%, ${vibrantColors.skyBlue} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {hoveredNode.name}
            </Typography>
            <Box
              sx={{
                display: 'inline-block',
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${vibrantColors.vibrantPurple}15 0%, ${vibrantColors.hotPink}15 100%)`,
                mb: 1,
              }}
            >
              <Typography variant="body2" fontWeight={600} color={vibrantColors.vibrantPurple}>
                Type: {hoveredNode.type}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'inline-block',
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                ml: 1,
                mb: 1,
                background:
                  hoveredNode.status === ChangeStatus.NEW
                    ? `linear-gradient(135deg, ${vibrantColors.boldGreen}20 0%, ${vibrantColors.emerald}20 100%)`
                    : `linear-gradient(135deg, ${vibrantColors.electricBlue}15 0%, ${vibrantColors.skyBlue}15 100%)`,
              }}
            >
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{
                  color:
                    hoveredNode.status === ChangeStatus.NEW
                      ? vibrantColors.boldGreen
                      : vibrantColors.electricBlue,
                }}
              >
                {hoveredNode.status === ChangeStatus.NEW ? '✨ Proposed New' : '✓ Existing'}
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={700} sx={{ mt: 2, mb: 1 }}>
              Properties:
            </Typography>
            <Box
              sx={{
                pl: 2,
                borderLeft: `2px solid ${vibrantColors.electricBlue}30`,
              }}
            >
              {Object.entries(hoveredNode.properties).map(([key, value]) => (
                <Typography key={key} variant="caption" display="block" sx={{ mb: 0.5 }}>
                  <strong style={{ color: vibrantColors.vibrantPurple }}>{key}:</strong>{' '}
                  <span style={{ opacity: 0.8 }}>{String(value)}</span>
                </Typography>
              ))}
            </Box>
          </Paper>
        )}
      </Box>
    );
  }
);

GraphVisualization.displayName = 'GraphVisualization';

export default GraphVisualization;
