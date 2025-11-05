// Type definitions for graph visualization

export const ChangeStatus = {
  EXISTING: 'existing',
  NEW: 'new',
  MODIFIED: 'modified',
} as const;

export type ChangeStatus = (typeof ChangeStatus)[keyof typeof ChangeStatus];

export const NodeType = {
  PERSON: 'Person',
  COMPANY: 'Company',
  PRODUCT: 'Product',
  LOCATION: 'Location',
} as const;

export type NodeType = (typeof NodeType)[keyof typeof NodeType];

export const RelationshipType = {
  WORKS_AT: 'WORKS_AT',
  OWNS: 'OWNS',
  LOCATED_IN: 'LOCATED_IN',
  PRODUCES: 'PRODUCES',
  PARTNERS_WITH: 'PARTNERS_WITH',
  MANAGES: 'MANAGES',
  REPORTS_TO: 'REPORTS_TO',
} as const;

export type RelationshipType = (typeof RelationshipType)[keyof typeof RelationshipType];

export interface NodeProperties {
  [key: string]: string | number | boolean | null;
}

export interface EdgeProperties {
  [key: string]: string | number | boolean | null;
}

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType | string;
  properties: NodeProperties;
  status: ChangeStatus;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: RelationshipType | string;
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
