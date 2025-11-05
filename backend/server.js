/**
 * Express Backend Server for Graph Database with Databricks Integration
 *
 * This server uses Databricks as the primary data store with SQLite as a fallback.
 * - Reads: Try Databricks first, fallback to SQLite if unavailable
 * - Writes: Try Databricks first, fallback to SQLite if unavailable
 * It provides a REST API for the React frontend to manage graph data.
 *
 * Setup:
 * 1. cd backend
 * 2. npm install
 * 3. Copy .env.example to .env and configure your credentials (optional)
 * 4. npm run seed (to initialize database)
 * 5. npm start
 */

const express = require('express');
const cors = require('cors');
const { DBSQLClient } = require('@databricks/sql');
const logger = require('./utils/logger');
require('dotenv').config();

const {
  initDatabase,
  createTables,
  getAllNodes,
  getAllEdges,
  insertNodes,
  insertEdges,
  updateNodesStatus,
  updateEdgesStatus,
  isDatabaseEmpty,
} = require('./db/database');

const { seedDatabase } = require('./db/seed');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    const logData = {
      type: 'request',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      requestId,
    };

    // Add query params if present
    if (Object.keys(req.query).length > 0) {
      logData.query = req.query;
    }

    // Add body info for POST/PATCH requests
    if (req.body && Object.keys(req.body).length > 0) {
      if (req.body.nodes || req.body.edges) {
        logData.bodySize = {
          nodes: req.body.nodes?.length || 0,
          edges: req.body.edges?.length || 0,
        };
      }
    }

    logger.info(logData);
  });

  next();
});

// Serve static files from React app in production
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(
    express.static(path.join(__dirname, '../dist'), {
      setHeaders: (res, filePath) => {
        // Prevent caching of HTML files to ensure users get latest frontend code
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      },
    })
  );
}

// Initialize database
let db;
try {
  db = initDatabase();
  logger.info({ type: 'database_init', status: 'initialized', database: 'SQLite' });

  // Check if database is empty, if so seed it
  if (isDatabaseEmpty(db)) {
    logger.info({ type: 'database_seed', status: 'seeding', reason: 'empty database' });
    db.close();
    seedDatabase(false);
    db = initDatabase();
  }
} catch (error) {
  logger.error({ type: 'database_init', status: 'failed', error: error.message });
  process.exit(1);
}

// Databricks Configuration - uses environment variables from Databricks Apps
const DATABRICKS_CONFIG = {
  host: process.env.DATABRICKS_HOST || 'e2-demo-west.cloud.databricks.com',
  path: process.env.DATABRICKS_HTTP_PATH || '/sql/1.0/warehouses/75fd8278393d07eb',
  token: '', // Using service principal instead
  clientId: process.env.DATABRICKS_CLIENT_ID,
  clientSecret: process.env.DATABRICKS_CLIENT_SECRET,
};

const TABLE_NAME = process.env.DATABRICKS_TABLE || 'main.default.property_graph_entity_edges';

// Check if Databricks is configured
const DATABRICKS_ENABLED = !!DATABRICKS_CONFIG.clientId && !!DATABRICKS_CONFIG.clientSecret;

/**
 * Sanitize error messages for client responses
 * Keeps full details in server logs but sends clean messages to frontend
 */
function sanitizeErrorForClient(error) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
  const errorObj = typeof error === 'object' ? error : {};

  // Check for Databricks-specific error properties first
  if (errorObj.errorClass) {
    switch (errorObj.errorClass) {
      case 'TABLE_OR_VIEW_NOT_FOUND':
        return 'Database table not found';
      case 'SCHEMA_NOT_FOUND':
        return 'Database schema not found';
      case 'PARSE_SYNTAX_ERROR':
        return 'Invalid query syntax';
      default:
        return `Database error: ${errorObj.errorClass}`;
    }
  }

  // Check HTTP status codes
  if (errorObj.statusCode || errorObj.status) {
    const status = errorObj.statusCode || errorObj.status;
    switch (status) {
      case 401:
      case 403:
        return 'Databricks authentication failed';
      case 404:
        return 'Databricks resource not found';
      case 500:
        return 'Databricks server error';
      case 503:
        return 'Databricks service unavailable';
      default:
        return `Databricks error (HTTP ${status})`;
    }
  }

  // Detect common error types from message
  if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connect')) {
    return 'Unable to connect to Databricks';
  }
  if (
    errorMessage.includes('authentication') ||
    errorMessage.includes('401') ||
    errorMessage.includes('403')
  ) {
    return 'Databricks authentication failed';
  }
  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    return 'Databricks connection timed out';
  }
  if (errorMessage.includes('not configured')) {
    return 'Databricks not configured';
  }
  if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('DNS')) {
    return 'Databricks host not found';
  }
  if (errorMessage.includes('table') && errorMessage.includes('not found')) {
    return 'Database table not found';
  }

  // Return a generic version of the message without internal details
  return errorMessage.split('\n')[0].substring(0, 150);
}

logger.info({
  type: 'server_config',
  environment: process.env.NODE_ENV || 'development',
  port: PORT,
  sqlite: 'enabled',
  databricks: {
    enabled: DATABRICKS_ENABLED,
    host: DATABRICKS_CONFIG.host,
    table: TABLE_NAME,
    path: DATABRICKS_CONFIG.path,
    clientId: DATABRICKS_CONFIG.clientId ? 'configured' : 'missing',
    clientSecret: DATABRICKS_CONFIG.clientSecret ? 'configured' : 'missing',
  },
});

/**
 * Create a Databricks SQL connection
 */
async function createDatabricksConnection() {
  if (!DATABRICKS_ENABLED) {
    throw new Error('Databricks not configured');
  }

  logger.databricks(logger.info.level, {
    operation: 'connection',
    status: 'attempting',
    host: DATABRICKS_CONFIG.host,
    path: DATABRICKS_CONFIG.path,
  });

  try {
    const client = new DBSQLClient();

    const connection = await client.connect({
      host: DATABRICKS_CONFIG.host,
      path: DATABRICKS_CONFIG.path,
      token: DATABRICKS_CONFIG.token,
      clientId: DATABRICKS_CONFIG.clientId,
      clientSecret: DATABRICKS_CONFIG.clientSecret,
    });

    logger.databricks('INFO', {
      operation: 'connection',
      status: 'success',
    });
    return connection;
  } catch (error) {
    logger.databricks('ERROR', {
      operation: 'connection',
      status: 'failed',
      error: error.message,
      errorType: error.constructor.name,
      statusCode: error.statusCode,
      errorCode: error.code,
      sqlState: error.sqlState,
      errorClass: error.errorClass,
    });
    throw error;
  }
}

/**
 * Read graph data from Databricks
 */
async function readFromDatabricks() {
  if (!DATABRICKS_ENABLED) {
    throw new Error('Databricks not configured');
  }

  let connection;

  try {
    connection = await createDatabricksConnection();
    const session = await connection.openSession();

    const query = `SELECT * FROM ${TABLE_NAME}`;
    const queryOperation = await session.executeStatement(query, {
      runAsync: false,
    });

    const result = await queryOperation.fetchAll();
    await queryOperation.close();
    await session.close();

    // Transform Databricks result into nodes and edges
    const nodesMap = new Map();
    const edges = [];

    result.forEach((row) => {
      // Parse properties safely
      let startProps = {};
      let endProps = {};
      try {
        startProps = JSON.parse(row.node_start_properties || '{}');
      } catch (e) {
        console.warn(`Failed to parse node_start_properties for ${row.node_start_id}:`, e.message);
      }
      try {
        endProps = JSON.parse(row.node_end_properties || '{}');
      } catch (e) {
        console.warn(`Failed to parse node_end_properties for ${row.node_end_id}:`, e.message);
      }

      // Add source node (use node_start_key as the type, which appears to be the entity type)
      if (!nodesMap.has(row.node_start_id)) {
        nodesMap.set(row.node_start_id, {
          id: row.node_start_id,
          label: row.node_start_id, // Use ID as label
          type: row.node_start_key || 'Unknown', // node_start_key is the entity type (e.g., "Customer")
          properties: startProps,
          status: 'existing',
        });
      }

      // Add target node (use node_end_key as the type)
      if (!nodesMap.has(row.node_end_id)) {
        nodesMap.set(row.node_end_id, {
          id: row.node_end_id,
          label: row.node_end_id, // Use ID as label
          type: row.node_end_key || 'Unknown', // node_end_key is the entity type (e.g., "Account")
          properties: endProps,
          status: 'existing',
        });
      }

      // Add edge
      edges.push({
        id: `edge_${row.node_start_id}_${row.node_end_id}_${row.relationship}`,
        source: row.node_start_id,
        target: row.node_end_id,
        relationshipType: row.relationship,
        properties: {},
        status: 'existing',
      });
    });

    const nodes = Array.from(nodesMap.values());
    logger.databricks('INFO', {
      operation: 'read',
      status: 'success',
      nodeCount: nodes.length,
      edgeCount: edges.length,
    });

    return { nodes, edges };
  } catch (error) {
    logger.databricks('ERROR', {
      operation: 'read',
      status: 'failed',
      query: `SELECT * FROM ${TABLE_NAME}`,
      error: error.message,
      errorType: error.constructor.name,
      statusCode: error.statusCode,
      errorCode: error.code,
      sqlState: error.sqlState,
      errorClass: error.errorClass,
    });
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Error closing Databricks connection:', closeError);
      }
    }
  }
}

/**
 * Write nodes and edges to Databricks
 */
async function writeToDatabricks(nodes, edges) {
  if (!DATABRICKS_ENABLED) {
    throw new Error('Databricks not configured');
  }

  let connection;

  try {
    connection = await createDatabricksConnection();
    const session = await connection.openSession();

    // For each edge, insert a row into the table with both nodes
    for (const edge of edges) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (!sourceNode || !targetNode) {
        console.warn(`Skipping edge ${edge.id} - missing source or target node`);
        continue;
      }

      const query = `
        INSERT INTO ${TABLE_NAME} (
          node_start_id,
          node_start_key,
          relationship,
          node_end_id,
          node_end_key,
          node_start_properties,
          node_end_properties
        ) VALUES (
          '${sourceNode.id}',
          '${sourceNode.label}',
          '${edge.relationshipType}',
          '${targetNode.id}',
          '${targetNode.label}',
          '${JSON.stringify(sourceNode.properties).replace(/'/g, "''")}',
          '${JSON.stringify(targetNode.properties).replace(/'/g, "''")}'
        )
      `;

      const queryOperation = await session.executeStatement(query, {
        runAsync: false,
      });
      await queryOperation.close();
    }

    await session.close();
    logger.databricks('INFO', {
      operation: 'write',
      status: 'success',
      nodeCount: nodes.length,
      edgeCount: edges.length,
    });

    return {
      success: true,
      target: 'databricks',
    };
  } catch (error) {
    logger.databricks('ERROR', {
      operation: 'write',
      status: 'failed',
      table: TABLE_NAME,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      error: error.message,
      errorType: error.constructor.name,
      statusCode: error.statusCode,
      errorCode: error.code,
      sqlState: error.sqlState,
      errorClass: error.errorClass,
    });
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Error closing Databricks connection:', closeError);
      }
    }
  }
}

/**
 * GET /api/graph
 * Fetch graph data - tries Databricks first, falls back to SQLite
 */
app.get('/api/graph', async (req, res) => {
  const startTime = Date.now();
  let nodes, edges;
  let source = 'SQLite';
  let databricksError = null;

  try {
    // Try Databricks first if configured
    if (DATABRICKS_ENABLED) {
      try {
        const data = await readFromDatabricks();
        nodes = data.nodes;
        edges = data.edges;
        source = 'Databricks';
      } catch (dbError) {
        databricksError = dbError.message;
        logger.warn({
          type: 'api_fallback',
          endpoint: 'GET /api/graph',
          reason: 'databricks_failed',
          error: sanitizeErrorForClient(dbError),
        });

        // Fall back to SQLite
        nodes = getAllNodes(db);
        edges = getAllEdges(db);
        source = 'SQLite (fallback)';
      }
    } else {
      nodes = getAllNodes(db);
      edges = getAllEdges(db);
    }

    const duration = Date.now() - startTime;
    logger.info({
      type: 'api_success',
      method: 'GET',
      endpoint: '/api/graph',
      source,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      duration,
    });

    res.json({
      success: true,
      source,
      databricksEnabled: DATABRICKS_ENABLED,
      databricksError: sanitizeErrorForClient(databricksError),
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      nodes,
      edges,
      metadata: {
        source,
        databricksEnabled: DATABRICKS_ENABLED,
        databricksError: sanitizeErrorForClient(databricksError),
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({
      type: 'api_error',
      method: 'GET',
      endpoint: '/api/graph',
      error: error.message,
      duration,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch graph data',
      message: sanitizeErrorForClient(error),
      source: 'error',
      databricksEnabled: DATABRICKS_ENABLED,
      databricksError: sanitizeErrorForClient(databricksError || error),
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      metadata: {
        source: 'error',
        databricksEnabled: DATABRICKS_ENABLED,
        databricksError: sanitizeErrorForClient(databricksError || error),
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
      },
    });
  }
});

/**
 * POST /api/graph
 * Write new nodes and edges to database
 * Tries Databricks first, falls back to SQLite on failure
 */
app.post('/api/graph', async (req, res) => {
  const { nodes, edges } = req.body;

  if (!nodes || !edges) {
    return res.status(400).json({
      success: false,
      message: 'Missing nodes or edges in request body',
    });
  }

  if (nodes.length === 0 && edges.length === 0) {
    return res.json({
      success: true,
      message: 'No new changes to write',
      writtenNodes: 0,
      writtenEdges: 0,
    });
  }

  const startTime = Date.now();
  let target = 'SQLite';
  let writeError = null;

  try {
    // Try writing to Databricks first if configured
    if (DATABRICKS_ENABLED) {
      try {
        await writeToDatabricks(nodes, edges);
        target = 'Databricks';
      } catch (error) {
        writeError = error.message;
        logger.warn({
          type: 'api_fallback',
          endpoint: 'POST /api/graph',
          reason: 'databricks_failed',
          error: sanitizeErrorForClient(error),
        });

        // Fall back to SQLite
        insertNodes(db, nodes);
        insertEdges(db, edges);
        target = 'SQLite (fallback)';
      }
    } else {
      insertNodes(db, nodes);
      insertEdges(db, edges);
    }

    const totalDuration = Date.now() - startTime;
    const sanitizedError = sanitizeErrorForClient(writeError);
    const message = writeError
      ? `Wrote ${nodes.length} nodes and ${edges.length} edges to ${target} (Databricks unavailable: ${sanitizedError})`
      : `Wrote ${nodes.length} nodes and ${edges.length} edges to ${target}`;

    logger.info({
      type: 'api_success',
      method: 'POST',
      endpoint: '/api/graph',
      target,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      duration: totalDuration,
    });

    res.json({
      success: true,
      message,
      source: target,
      databricksEnabled: DATABRICKS_ENABLED,
      databricksError: sanitizedError,
      timestamp: new Date().toISOString(),
      duration: `${totalDuration}ms`,
      target,
      jobId: `job_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      writtenNodes: nodes.length,
      writtenEdges: edges.length,
      metadata: {
        source: target,
        databricksEnabled: DATABRICKS_ENABLED,
        databricksError: sanitizedError,
        timestamp: new Date().toISOString(),
        duration: `${totalDuration}ms`,
      },
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    logger.error({
      type: 'api_error',
      method: 'POST',
      endpoint: '/api/graph',
      error: error.message,
      duration: totalDuration,
    });

    res.status(500).json({
      success: false,
      message: `Failed to write to database: ${sanitizeErrorForClient(error)}`,
      source: 'error',
      databricksEnabled: DATABRICKS_ENABLED,
      databricksError: sanitizeErrorForClient(writeError || error),
      timestamp: new Date().toISOString(),
      duration: `${totalDuration}ms`,
      metadata: {
        source: 'error',
        databricksEnabled: DATABRICKS_ENABLED,
        databricksError: sanitizeErrorForClient(writeError || error),
        timestamp: new Date().toISOString(),
        duration: `${totalDuration}ms`,
      },
    });
  }
});

/**
 * PATCH /api/graph/status
 * Update status of nodes and edges (e.g., from 'new' to 'existing')
 * Note: Status updates are currently SQLite-only as Databricks table doesn't have status field
 */
app.patch('/api/graph/status', async (req, res) => {
  const { nodeIds, edgeIds, status } = req.body;
  const startTime = Date.now();

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Missing status in request body',
      source: 'error',
      databricksEnabled: DATABRICKS_ENABLED,
      databricksError: null,
      timestamp: new Date().toISOString(),
      duration: '0ms',
    });
  }

  try {
    // Note: Status updates are SQLite-only
    // Databricks table structure doesn't include status field
    if (nodeIds && nodeIds.length > 0) {
      updateNodesStatus(db, nodeIds, status);
    }

    if (edgeIds && edgeIds.length > 0) {
      updateEdgesStatus(db, edgeIds, status);
    }

    const totalDuration = Date.now() - startTime;
    logger.info({
      type: 'api_success',
      method: 'PATCH',
      endpoint: '/api/graph/status',
      status,
      nodeCount: nodeIds?.length || 0,
      edgeCount: edgeIds?.length || 0,
      duration: totalDuration,
    });

    res.json({
      success: true,
      message: `Updated ${(nodeIds?.length || 0) + (edgeIds?.length || 0)} items to status: ${status}`,
      source: 'SQLite',
      databricksEnabled: DATABRICKS_ENABLED,
      databricksError: null,
      timestamp: new Date().toISOString(),
      duration: `${totalDuration}ms`,
      updatedNodes: nodeIds?.length || 0,
      updatedEdges: edgeIds?.length || 0,
      metadata: {
        source: 'SQLite',
        databricksEnabled: DATABRICKS_ENABLED,
        databricksError: null,
        timestamp: new Date().toISOString(),
        duration: `${totalDuration}ms`,
      },
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    logger.error({
      type: 'api_error',
      method: 'PATCH',
      endpoint: '/api/graph/status',
      error: error.message,
      duration: totalDuration,
    });

    res.status(500).json({
      success: false,
      message: `Failed to update status: ${sanitizeErrorForClient(error)}`,
      source: 'error',
      databricksEnabled: DATABRICKS_ENABLED,
      databricksError: null,
      timestamp: new Date().toISOString(),
      duration: `${totalDuration}ms`,
      metadata: {
        source: 'error',
        databricksEnabled: DATABRICKS_ENABLED,
        databricksError: null,
        timestamp: new Date().toISOString(),
        duration: `${totalDuration}ms`,
      },
    });
  }
});

/**
 * POST /api/graph/seed
 * Reseed the database with mock data
 */
app.post('/api/graph/seed', async (req, res) => {
  const startTime = Date.now();

  try {
    // Close current connection
    db.close();

    // Reseed
    seedDatabase(true);

    // Reinitialize connection
    db = initDatabase();

    const nodes = getAllNodes(db);
    const edges = getAllEdges(db);

    const totalDuration = Date.now() - startTime;
    logger.info({
      type: 'api_success',
      method: 'POST',
      endpoint: '/api/graph/seed',
      nodeCount: nodes.length,
      edgeCount: edges.length,
      duration: totalDuration,
    });

    res.json({
      success: true,
      message: 'Database reseeded successfully',
      source: 'SQLite',
      databricksEnabled: DATABRICKS_ENABLED,
      databricksError: null,
      timestamp: new Date().toISOString(),
      duration: `${totalDuration}ms`,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      metadata: {
        source: 'SQLite',
        databricksEnabled: DATABRICKS_ENABLED,
        databricksError: null,
        timestamp: new Date().toISOString(),
        duration: `${totalDuration}ms`,
      },
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    logger.error({
      type: 'api_error',
      method: 'POST',
      endpoint: '/api/graph/seed',
      error: error.message,
      duration: totalDuration,
    });

    res.status(500).json({
      success: false,
      message: `Failed to reseed database: ${sanitizeErrorForClient(error)}`,
      source: 'error',
      databricksEnabled: DATABRICKS_ENABLED,
      databricksError: null,
      timestamp: new Date().toISOString(),
      duration: `${totalDuration}ms`,
      metadata: {
        source: 'error',
        databricksEnabled: DATABRICKS_ENABLED,
        databricksError: null,
        timestamp: new Date().toISOString(),
        duration: `${totalDuration}ms`,
      },
    });
  }
});

/**
 * GET /api/job/:jobId
 * Check job status (simplified for demo)
 */
app.get('/api/job/:jobId', (req, res) => {
  const { jobId } = req.params;

  res.json({
    jobId,
    status: 'SUCCESS',
    message: 'Write operation completed successfully',
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  const nodes = getAllNodes(db);
  const edges = getAllEdges(db);

  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    source: DATABRICKS_ENABLED ? 'Databricks + SQLite (fallback)' : 'SQLite',
    databricksEnabled: DATABRICKS_ENABLED,
    databricksError: null,
    timestamp: new Date().toISOString(),
    database: {
      type: 'SQLite',
      nodeCount: nodes.length,
      edgeCount: edges.length,
    },
    databricks: {
      configured: DATABRICKS_ENABLED,
      host: DATABRICKS_CONFIG.host,
      table: TABLE_NAME,
    },
    metadata: {
      source: DATABRICKS_ENABLED ? 'Databricks + SQLite (fallback)' : 'SQLite',
      databricksEnabled: DATABRICKS_ENABLED,
      databricksError: null,
      timestamp: new Date().toISOString(),
    },
  });
});

// Serve React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info({ type: 'server_shutdown', signal: 'SIGINT' });
  if (db) {
    db.close();
    logger.info({ type: 'database_close', status: 'success' });
  }
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  const nodeCount = getAllNodes(db).length;
  const edgeCount = getAllEdges(db).length;

  logger.info({
    type: 'server_started',
    url: `http://localhost:${PORT}`,
    database: {
      sqlite: { nodes: nodeCount, edges: edgeCount },
    },
    dataStrategy: DATABRICKS_ENABLED ? 'Databricks primary with SQLite fallback' : 'SQLite only',
  });
});
