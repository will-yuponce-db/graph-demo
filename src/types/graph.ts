// Type definitions for graph visualization

export const ChangeStatus = {
  EXISTING: 'existing',
  NEW: 'new',
  MODIFIED: 'modified',
} as const;

export type ChangeStatus = (typeof ChangeStatus)[keyof typeof ChangeStatus];

// Node and relationship types are now dynamic - they can be any string
// No more hardcoded enums to allow for unlimited scalability

export interface NodeProperties {
  [key: string]: string | number | boolean | null;
}

export interface EdgeProperties {
  [key: string]: string | number | boolean | null;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string; // Now accepts any string type
  properties: NodeProperties;
  status: ChangeStatus;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: string; // Now accepts any string relationship type
  properties: EdgeProperties;
  status: ChangeStatus;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Transformed data for react-force-graph
export interface ForceGraphNode {
  id: string;
  name: string;
  type: string;
  status: ChangeStatus;
  properties: NodeProperties;
  val?: number;
  color?: string;
  x?: number;
  y?: number;
}

export interface ForceGraphLink {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
  status: ChangeStatus;
  properties: EdgeProperties;
  color?: string;
}

export interface ForceGraphData {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
}

// API types for future Databricks integration
export interface WriteToTableRequest {
  nodes: GraphNode[];
  edges: GraphEdge[];
  timestamp: string;
}

export interface WriteToTableResponse {
  success: boolean;
  message: string;
  jobId?: string;
  writtenNodes?: number;
  writtenEdges?: number;
}

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  newNodes: number;
  newEdges: number;
  existingNodes: number;
  existingEdges: number;
}

// Utility functions for dynamic type extraction and color generation

/**
 * Extract unique node types from graph data
 */
export function getUniqueNodeTypes(data: GraphData): string[] {
  const types = new Set<string>();
  data.nodes.forEach((node) => types.add(node.type));
  return Array.from(types).sort();
}

/**
 * Extract unique relationship types from graph data
 */
export function getUniqueRelationshipTypes(data: GraphData): string[] {
  const types = new Set<string>();
  data.edges.forEach((edge) => types.add(edge.relationshipType));
  return Array.from(types).sort();
}

/**
 * Generate a consistent color for a given string using a hash function
 * Returns colors from a curated palette for better visual distinction
 */
export function getColorForType(type: string, isDarkMode: boolean = false): string {
  // Curated color palettes optimized for both light and dark modes
  // These colors are chosen for maximum distinction and accessibility
  const darkModeColors = [
    '#42a5f5', // Blue
    '#ab47bc', // Purple
    '#ff9800', // Orange
    '#ef5350', // Red
    '#66bb6a', // Green
    '#ffa726', // Deep Orange
    '#26c6da', // Cyan
    '#ec407a', // Pink
    '#9ccc65', // Light Green
    '#5c6bc0', // Indigo
    '#ffca28', // Amber
    '#8d6e63', // Brown
    '#78909c', // Blue Grey
    '#ff7043', // Deep Orange
    '#ba68c8', // Purple
    '#7e57c2', // Deep Purple
    '#29b6f6', // Light Blue
    '#26a69a', // Teal
    '#d4e157', // Lime
    '#ffd54f', // Amber
  ];

  const lightModeColors = [
    '#1976d2', // Blue
    '#7b1fa2', // Purple
    '#f57c00', // Orange
    '#c62828', // Red
    '#388e3c', // Green
    '#e64a19', // Deep Orange
    '#0097a7', // Cyan
    '#c2185b', // Pink
    '#689f38', // Light Green
    '#3949ab', // Indigo
    '#ffa000', // Amber
    '#5d4037', // Brown
    '#546e7a', // Blue Grey
    '#d84315', // Deep Orange
    '#8e24aa', // Purple
    '#5e35b1', // Deep Purple
    '#0288d1', // Light Blue
    '#00897b', // Teal
    '#afb42b', // Lime
    '#ffb300', // Amber
  ];

  const colors = isDarkMode ? darkModeColors : lightModeColors;

  // Simple hash function to get consistent color for same type
  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    hash = type.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Get color mapping for all node types in the data
 */
export function getNodeTypeColorMap(
  data: GraphData,
  isDarkMode: boolean = false
): Map<string, string> {
  const colorMap = new Map<string, string>();
  const types = getUniqueNodeTypes(data);

  types.forEach((type) => {
    colorMap.set(type, getColorForType(type, isDarkMode));
  });

  return colorMap;
}
