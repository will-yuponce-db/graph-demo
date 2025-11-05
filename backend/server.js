/**
 * Express Backend Server for Graph Database with Databricks Integration
 *
 * This server uses SQLite as the primary data store and syncs to Databricks when available.
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
const DBSQLClient = require('@databricks/sql');
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

  // Log incoming request
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📨 INCOMING REQUEST [${requestId}]`);
  console.log(`   ${req.method} ${req.path}`);
  console.log(`   Time: ${new Date().toISOString()}`);
  if (Object.keys(req.query).length > 0) {
    console.log(`   Query:`, req.query);
  }
  if (req.body && Object.keys(req.body).length > 0) {
    if (req.body.nodes || req.body.edges) {
      console.log(
        `   Body: ${req.body.nodes?.length || 0} nodes, ${req.body.edges?.length || 0} edges`
      );
    } else {
      console.log(`   Body:`, JSON.stringify(req.body).substring(0, 200));
    }
  }

  // Capture response
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    const duration = Date.now() - startTime;

    console.log(`\n📤 RESPONSE [${requestId}]`);
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   Duration: ${duration}ms`);

    // Log key response fields
    if (body.success !== undefined) console.log(`   Success: ${body.success}`);
    if (body.source) console.log(`   Source: ${body.source}`);
    if (body.databricksEnabled !== undefined)
      console.log(`   Databricks: ${body.databricksEnabled ? 'Enabled' : 'Disabled'}`);
    if (body.databricksError) console.log(`   ⚠️  Databricks Error: ${body.databricksError}`);
    if (body.nodes) console.log(`   Nodes: ${body.nodes.length}`);
    if (body.edges) console.log(`   Edges: ${body.edges.length}`);
    if (body.message) console.log(`   Message: ${body.message}`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return originalJson(body);
  };

  next();
});

// Serve static files from React app in production
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Initialize database
let db;
try {
  db = initDatabase();
  console.log('✓ SQLite database initialized');

  // Check if database is empty, if so seed it
  if (isDatabaseEmpty(db)) {
    console.log('Database is empty, seeding with initial data...');
    db.close();
    seedDatabase(false);
    db = initDatabase();
  }
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

// Databricks Configuration - uses environment variables from Databricks Apps
const DATABRICKS_CONFIG = {
  host: process.env.DATABRICKS_HOST || 'e2-demo-field-eng.cloud.databricks.com',
  path: process.env.DATABRICKS_HTTP_PATH || '/sql/1.0/warehouses/862f1d757f0424f7',
  token: '', // Using service principal instead
  clientId: process.env.DATABRICKS_CLIENT_ID,
  clientSecret: process.env.DATABRICKS_CLIENT_SECRET,
};

const TABLE_NAME = process.env.DATABRICKS_TABLE || 'main.default.property_graph_entity_edges';

// Check if Databricks is configured
const DATABRICKS_ENABLED = !!DATABRICKS_CONFIG.clientId && !!DATABRICKS_CONFIG.clientSecret;

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🔧 SERVER CONFIGURATION');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Environment:', process.env.NODE_ENV || 'development');
console.log('  Port:', PORT);
console.log('  SQLite Database: ✓ Enabled (primary store)');
console.log('\n📊 DATABRICKS CONFIGURATION:');
if (DATABRICKS_ENABLED) {
  console.log('  Status: ✅ ENABLED - Will sync to Databricks');
  console.log('  Host:', DATABRICKS_CONFIG.host);
  console.log('  Client ID:', DATABRICKS_CONFIG.clientId ? '✓ Configured' : '✗ Missing');
  console.log('  Client Secret:', DATABRICKS_CONFIG.clientSecret ? '✓ Configured' : '✗ Missing');
  console.log('  Table:', TABLE_NAME);
  console.log('  Path:', DATABRICKS_CONFIG.path);
} else {
  console.log('  Status: ⚠️  DISABLED - SQLite only mode');
  console.log('  Reason: Missing DATABRICKS_CLIENT_ID or DATABRICKS_CLIENT_SECRET');
}
console.log('═══════════════════════════════════════════════════════════\n');

/**
 * Create a Databricks SQL connection
 */
async function createDatabricksConnection() {
  if (!DATABRICKS_ENABLED) {
    throw new Error('Databricks not configured');
  }

  const client = new DBSQLClient();

  const connection = await client.connect({
    host: DATABRICKS_CONFIG.host,
    path: DATABRICKS_CONFIG.path,
    token: DATABRICKS_CONFIG.token,
    clientId: DATABRICKS_CONFIG.clientId,
    clientSecret: DATABRICKS_CONFIG.clientSecret,
  });

  console.log('✓ Connected to Databricks SQL Warehouse');
  return connection;
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
    console.log(`✓ Read ${nodes.length} nodes and ${edges.length} edges from Databricks`);

    return { nodes, edges };
  } catch (error) {
    console.error('Error reading from Databricks:', error);
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
    console.log(
      `✓ Successfully wrote ${nodes.length} nodes and ${edges.length} edges to Databricks`
    );

    return {
      success: true,
      target: 'databricks',
    };
  } catch (error) {
    console.error('Error writing to Databricks:', error);
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
      console.log('\n📥 [GET /api/graph] Attempting to read from Databricks...');
      const dbStartTime = Date.now();
      try {
        const data = await readFromDatabricks();
        nodes = data.nodes;
        edges = data.edges;
        source = 'Databricks';
        const dbDuration = Date.now() - dbStartTime;
        console.log(`   ✅ Databricks read SUCCESS (${dbDuration}ms)`);
      } catch (dbError) {
        const dbDuration = Date.now() - dbStartTime;
        console.error(`   ❌ Databricks read FAILED (${dbDuration}ms): ${dbError.message}`);
        console.warn('   ⚠️  Falling back to SQLite...');
        databricksError = dbError.message;

        // Fall back to SQLite
        console.log('   💾 Reading from SQLite...');
        nodes = getAllNodes(db);
        edges = getAllEdges(db);
        source = 'SQLite (fallback)';
      }
    } else {
      console.log('\n📥 [GET /api/graph] Reading from SQLite (Databricks disabled)...');
      nodes = getAllNodes(db);
      edges = getAllEdges(db);
    }

    const duration = Date.now() - startTime;
    console.log(
      `✅ [GET /api/graph] Success from ${source}: ${nodes.length} nodes, ${edges.length} edges (${duration}ms total)\n`
    );

    res.json({
      success: true,
      source,
      databricksEnabled: DATABRICKS_ENABLED,
      databricksError,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      nodes,
      edges,
      metadata: {
        source,
        databricksEnabled: DATABRICKS_ENABLED,
        databricksError,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [GET /api/graph] Error: ${error.message} (${duration}ms)\n`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch graph data',
      message: error.message,
      source: 'error',
      databricksEnabled: DATABRICKS_ENABLED,
      databricksError: databricksError || error.message,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      metadata: {
        source: 'error',
        databricksEnabled: DATABRICKS_ENABLED,
        databricksError: databricksError || error.message,
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
  console.log(`\n📤 [POST /api/graph] Write request: ${nodes.length} nodes, ${edges.length} edges`);

  let target = 'SQLite';
  let writeError = null;

  try {
    // Try writing to Databricks first if configured
    if (DATABRICKS_ENABLED) {
      console.log('   🔄 Attempting write to Databricks...');
      const dbStartTime = Date.now();
      try {
        await writeToDatabricks(nodes, edges);
        const dbDuration = Date.now() - dbStartTime;
        console.log(`   ✅ Databricks write SUCCESS (${dbDuration}ms)`);
        target = 'Databricks';
      } catch (error) {
        const dbDuration = Date.now() - dbStartTime;
        console.error(`   ❌ Databricks write FAILED (${dbDuration}ms): ${error.message}`);
        console.warn('   ⚠️  Falling back to SQLite...');
        writeError = error.message;

        // Fall back to SQLite
        console.log('   💾 Writing to SQLite as fallback...');
        const sqliteStartTime = Date.now();
        insertNodes(db, nodes);
        insertEdges(db, edges);
        const sqliteDuration = Date.now() - sqliteStartTime;
        console.log(`   ✅ SQLite write SUCCESS (${sqliteDuration}ms)`);
        target = 'SQLite (fallback)';
      }
    } else {
      console.log('   💾 Writing to SQLite (Databricks disabled)...');
      const sqliteStartTime = Date.now();
      insertNodes(db, nodes);
      insertEdges(db, edges);
      const sqliteDuration = Date.now() - sqliteStartTime;
      console.log(`   ✅ SQLite write SUCCESS (${sqliteDuration}ms)`);
    }

    const totalDuration = Date.now() - startTime;
    const message = writeError
      ? `✅ Wrote ${nodes.length} nodes and ${edges.length} edges to ${target} (Databricks unavailable: ${writeError})`
      : `✅ Wrote ${nodes.length} nodes and ${edges.length} edges to ${target}`;

    console.log(`✅ [POST /api/graph] Complete: ${target} (${totalDuration}ms total)\n`);

    res.json({
      success: true,
      message,
      source: target,
      databricksEnabled: DATABRICKS_ENABLED,
      databricksError: writeError,
      timestamp: new Date().toISOString(),
      duration: `${totalDuration}ms`,
      target,
      jobId: `job_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      writtenNodes: nodes.length,
      writtenEdges: edges.length,
      metadata: {
        source: target,
        databricksEnabled: DATABRICKS_ENABLED,
        databricksError: writeError,
        timestamp: new Date().toISOString(),
        duration: `${totalDuration}ms`,
      },
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`❌ [POST /api/graph] Write FAILED (${totalDuration}ms): ${error.message}\n`);
    res.status(500).json({
      success: false,
      message: `Failed to write to database: ${error.message}`,
      source: 'error',
      databricksEnabled: DATABRICKS_ENABLED,
      databricksError: writeError || error.message,
      timestamp: new Date().toISOString(),
      duration: `${totalDuration}ms`,
      metadata: {
        source: 'error',
        databricksEnabled: DATABRICKS_ENABLED,
        databricksError: writeError || error.message,
        timestamp: new Date().toISOString(),
        duration: `${totalDuration}ms`,
      },
    });
  }
});

/**
 * PATCH /api/graph/status
 * Update status of nodes and edges (e.g., from 'new' to 'existing')
 */
app.patch('/api/graph/status', async (req, res) => {
  const { nodeIds, edgeIds, status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Missing status in request body',
    });
  }

  try {
    if (nodeIds && nodeIds.length > 0) {
      updateNodesStatus(db, nodeIds, status);
    }

    if (edgeIds && edgeIds.length > 0) {
      updateEdgesStatus(db, edgeIds, status);
    }

    res.json({
      success: true,
      message: `Updated ${(nodeIds?.length || 0) + (edgeIds?.length || 0)} items to status: ${status}`,
      updatedNodes: nodeIds?.length || 0,
      updatedEdges: edgeIds?.length || 0,
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: `Failed to update status: ${error.message}`,
    });
  }
});

/**
 * POST /api/graph/seed
 * Reseed the database with mock data
 */
app.post('/api/graph/seed', async (req, res) => {
  try {
    console.log('Reseeding database...');

    // Close current connection
    db.close();

    // Reseed
    seedDatabase(true);

    // Reinitialize connection
    db = initDatabase();

    const nodes = getAllNodes(db);
    const edges = getAllEdges(db);

    res.json({
      success: true,
      message: 'Database reseeded successfully',
      nodeCount: nodes.length,
      edgeCount: edges.length,
    });
  } catch (error) {
    console.error('Error reseeding database:', error);
    res.status(500).json({
      success: false,
      message: `Failed to reseed database: ${error.message}`,
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
  console.log('\n Shutting down gracefully...');
  if (db) {
    db.close();
    console.log('✓ Database connection closed');
  }
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  const nodeCount = getAllNodes(db).length;
  const edgeCount = getAllEdges(db).length;

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🚀 SERVER STARTED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  SQLite: ${nodeCount} nodes, ${edgeCount} edges loaded`);

  if (DATABRICKS_ENABLED) {
    console.log('\n  🎯 DATA STRATEGY: Databricks Primary, SQLite Fallback');
    console.log(`     → Reads from Databricks when available`);
    console.log(`     → Writes to Databricks when available`);
    console.log(`     → Falls back to SQLite if Databricks unavailable`);
  } else {
    console.log('\n  🎯 DATA STRATEGY: SQLite only (Databricks disabled)');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('Ready to accept requests...\n');
});
