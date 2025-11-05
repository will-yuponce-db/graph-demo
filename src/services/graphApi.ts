import type {
  GraphNode,
  GraphEdge,
  WriteToTableRequest,
  WriteToTableResponse,
} from '../types/graph';
import { ChangeStatus } from '../types/graph';
import { mockGraphData } from '../data/mockGraphData';

/**
 * API service for graph data
 *
 * NOTE: This frontend implementation uses mock data. To connect to Databricks:
 * 1. Create a backend API server (Express/Node.js)
 * 2. Use @databricks/sql in the backend (it requires Node.js environment)
 * 3. Call your backend API from this service
 *
 * See backend/server.js for a complete backend implementation example.
 */

/**
 * Backend API URL
 * In production (monolith): use relative /api path (same server)
 * In development: use http://localhost:3000/api (separate backend server)
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

/**
 * Whether to use backend API or mock data
 * Default to true since we now have SQLite backend
 */
const USE_BACKEND_API = import.meta.env.VITE_USE_BACKEND_API !== 'false';

/**
 * Fetch graph data from backend API or use mock data
 * The backend API connects to Databricks SQL warehouse
 */
export const fetchGraphData = async (): Promise<{
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata?: {
    source: string;
    databricksEnabled: boolean;
    databricksError: string | null;
    timestamp?: string;
    duration?: string;
  };
}> => {
  if (!USE_BACKEND_API) {
    console.log('📊 Using mock data (backend disabled via VITE_USE_BACKEND_API=false)');
    return {
      nodes: mockGraphData.nodes,
      edges: mockGraphData.edges,
      metadata: {
        source: 'Mock Data',
        databricksEnabled: false,
        databricksError: null,
      },
    };
  }

  try {
    console.log('🔗 Fetching graph data from backend API...');
    const response = await fetch(`${API_BASE_URL}/graph`);

    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(
      `✓ Fetched ${data.nodes.length} nodes and ${data.edges.length} edges from ${data.metadata?.source || 'backend'}`
    );

    if (data.metadata) {
      console.log(
        `📊 Source: ${data.metadata.source} | Databricks: ${data.metadata.databricksEnabled ? 'Enabled' : 'Disabled'}`
      );
      if (data.metadata.databricksError) {
        console.warn(`⚠️  Databricks Error: ${data.metadata.databricksError}`);
      }
    }

    return {
      nodes: data.nodes,
      edges: data.edges,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error('Error fetching from backend API:', error);
    console.warn('⚠️ Make sure the backend server is running: cd backend && npm start');
    throw error;
  }
};

/**
 * Write approved changes to the graph table via backend API
 */
export const writeToTable = async (
  nodes: GraphNode[],
  edges: GraphEdge[]
): Promise<WriteToTableResponse> => {
  // Filter for new nodes and edges only
  const newNodes = nodes.filter((n) => n.status === ChangeStatus.NEW);
  const newEdges = edges.filter((e) => e.status === ChangeStatus.NEW);

  if (newNodes.length === 0 && newEdges.length === 0) {
    return {
      success: true,
      message: 'No new changes to write',
      writtenNodes: 0,
      writtenEdges: 0,
    };
  }

  if (!USE_BACKEND_API) {
    // Mock mode - simulate success
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(
      '📝 Mock write (backend disabled):',
      newNodes.length,
      'nodes,',
      newEdges.length,
      'edges'
    );

    return {
      success: true,
      message: `Mock: Would write ${newNodes.length} nodes and ${newEdges.length} edges (backend disabled)`,
      jobId: `mock_job_${Date.now()}`,
      writtenNodes: newNodes.length,
      writtenEdges: newEdges.length,
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/graph`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nodes: newNodes,
        edges: newEdges,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Log metadata information
    if (result.metadata) {
      console.log(
        `📊 Write Target: ${result.metadata.source} | Duration: ${result.metadata.duration}`
      );
      if (result.metadata.databricksError) {
        console.warn(`⚠️  Databricks Error: ${result.metadata.databricksError}`);
      }
    }

    return result;
  } catch (error) {
    console.error('Error writing to backend API:', error);
    return {
      success: false,
      message: `Failed to write to backend: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Check the status of a write job
 */
export const checkJobStatus = async (
  jobId: string
): Promise<{
  jobId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  message: string;
}> => {
  if (!USE_BACKEND_API) {
    return {
      jobId,
      status: 'SUCCESS',
      message: 'Mock write operation completed successfully',
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/job/${jobId}`);

    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      jobId,
      status: 'FAILED',
      message: `Failed to check job status: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Update the status of nodes and edges in the database
 * Called after successful save to mark items as EXISTING
 */
export const updateItemsStatus = async (
  nodeIds: string[],
  edgeIds: string[],
  status: string
): Promise<{ success: boolean; message: string }> => {
  if (!USE_BACKEND_API) {
    // In mock mode, just return success
    return {
      success: true,
      message: `Mock: Updated ${nodeIds.length + edgeIds.length} items to ${status}`,
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/graph/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nodeIds,
        edgeIds,
        status,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error('Error updating item status:', error);
    return {
      success: false,
      message: `Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Utility to prepare write request payload
 */
export const prepareWriteRequest = (
  nodes: GraphNode[],
  edges: GraphEdge[]
): WriteToTableRequest => {
  return {
    nodes: nodes.filter((n) => n.status === ChangeStatus.NEW),
    edges: edges.filter((e) => e.status === ChangeStatus.NEW),
    timestamp: new Date().toISOString(),
  };
};
