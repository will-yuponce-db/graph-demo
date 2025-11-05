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
    if (body.source) {
      console.log(`   Database Source: ${body.source}`);
      if (body.source.includes('fallback')) {
        console.log(`   ⚠️  Note: Using fallback database due to primary failure`);
      }
    }
    if (body.databricksEnabled !== undefined) {
      const dbStatus = body.databricksEnabled ? 'Configured & Active' : 'Not Configured';
      console.log(`   Databricks Status: ${dbStatus}`);
    }
    if (body.databricksError) {
      console.log(`   ⚠️  Databricks Error (sanitized for client): ${body.databricksError}`);
      console.log(`   💡 Full error details logged above in request processing`);
    }
    if (body.nodes) console.log(`   Response Data: ${body.nodes.length} nodes`);
    if (body.edges) console.log(`   Response Data: ${body.edges.length} edges`);
    if (body.message) console.log(`   Message: ${body.message}`);

    // Log full response body for debugging (truncated)
    const responsePreview = JSON.stringify(body, null, 2).substring(0, 500);
    console.log(`\n   📋 Response Preview:`);
    console.log(`   ${responsePreview.split('\n').slice(0, 15).join('\n   ')}...`);

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

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🔧 SERVER CONFIGURATION');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Environment:', process.env.NODE_ENV || 'development');
console.log('  Port:', PORT);
console.log('  SQLite Database: ✓ Enabled (fallback/cache)');
console.log('\n📊 DATABRICKS CONFIGURATION:');
if (DATABRICKS_ENABLED) {
  console.log('  Status: ✅ ENABLED - Primary data store');
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

  console.log('   🔌 Attempting Databricks connection...');
  console.log(`      Host: ${DATABRICKS_CONFIG.host}`);
  console.log(`      Path: ${DATABRICKS_CONFIG.path}`);
  console.log(`      Client ID: ${DATABRICKS_CONFIG.clientId ? '✓' : '✗'}`);

  try {
    const client = new DBSQLClient();

    const connection = await client.connect({
      host: DATABRICKS_CONFIG.host,
      path: DATABRICKS_CONFIG.path,
      token: DATABRICKS_CONFIG.token,
      clientId: DATABRICKS_CONFIG.clientId,
      clientSecret: DATABRICKS_CONFIG.clientSecret,
    });

    console.log('   ✅ Connected to Databricks SQL Warehouse');
    return connection;
  } catch (error) {
    console.error('\n   ❌ Databricks connection FAILED');
    console.error('   ═════════════════════════════════════════════════');
    console.error('   🔍 CONNECTION ERROR DETAILS:');
    console.error('   ═════════════════════════════════════════════════');
    console.error('   Error Type:', error.constructor.name);
    console.error('   Error Message:', error.message);

    // Log all error properties for Databricks-specific details
    if (error.statusCode) console.error('   HTTP Status Code:', error.statusCode);
    if (error.status) console.error('   Status:', error.status);
    if (error.code) console.error('   Error Code:', error.code);
    if (error.sqlState) console.error('   SQL State:', error.sqlState);
    if (error.errorClass) console.error('   Error Class:', error.errorClass);
    if (error.messageParameters) {
      console.error('   Message Parameters:', JSON.stringify(error.messageParameters, null, 2));
    }

    // Log ALL error properties
    console.error('\n   All Error Properties:');
    console.error('   ', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    console.error('\n   Full Stack Trace:');
    console.error(error.stack);
    console.error('   ═════════════════════════════════════════════════\n');
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
    console.log(`✓ Read ${nodes.length} nodes and ${edges.length} edges from Databricks`);

    return { nodes, edges };
  } catch (error) {
    console.error('\n❌ Error reading from Databricks:');
    console.error('═════════════════════════════════════════════════');
    console.error('🔍 QUERY EXECUTION ERROR:');
    console.error('═════════════════════════════════════════════════');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    console.error('Query:', `SELECT * FROM ${TABLE_NAME}`);

    // Log all error properties for Databricks-specific details
    if (error.statusCode) console.error('HTTP Status Code:', error.statusCode);
    if (error.status) console.error('Status:', error.status);
    if (error.code) console.error('Error Code:', error.code);
    if (error.sqlState) console.error('SQL State:', error.sqlState);
    if (error.errorClass) console.error('Error Class:', error.errorClass);
    if (error.messageParameters) {
      console.error('Message Parameters:', JSON.stringify(error.messageParameters, null, 2));
    }

    // Log ALL error properties
    console.error('\nAll Error Properties:');
    console.error(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    console.error('\nFull Stack Trace:');
    console.error(error.stack);
    console.error('═════════════════════════════════════════════════\n');
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
    console.error('\n❌ Error writing to Databricks:');
    console.error('═════════════════════════════════════════════════');
    console.error('🔍 WRITE OPERATION ERROR:');
    console.error('═════════════════════════════════════════════════');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    console.error('Target Table:', TABLE_NAME);
    console.error('Nodes to write:', nodes.length);
    console.error('Edges to write:', edges.length);

    // Log all error properties for Databricks-specific details
    if (error.statusCode) console.error('HTTP Status Code:', error.statusCode);
    if (error.status) console.error('Status:', error.status);
    if (error.code) console.error('Error Code:', error.code);
    if (error.sqlState) console.error('SQL State:', error.sqlState);
    if (error.errorClass) console.error('Error Class:', error.errorClass);
    if (error.messageParameters) {
      console.error('Message Parameters:', JSON.stringify(error.messageParameters, null, 2));
    }

    // Log ALL error properties
    console.error('\nAll Error Properties:');
    console.error(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    console.error('\nFull Stack Trace:');
    console.error(error.stack);
    console.error('═════════════════════════════════════════════════\n');
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
        console.error(`\n   ❌ Databricks read FAILED (${dbDuration}ms)`);
        console.error('   ═════════════════════════════════════════════════');
        console.error('   🔍 RAW ERROR DETAILS (Not sent to client):');
        console.error('   ═════════════════════════════════════════════════');
        console.error('   Error Type:', dbError.constructor.name);
        console.error('   Error Message:', dbError.message);
        console.error('\n   Full Stack Trace:');
        console.error(dbError.stack);
        console.error('   ═════════════════════════════════════════════════');

        databricksError = dbError.message; // Keep raw error for logging
        const sanitizedForClient = sanitizeErrorForClient(dbError);
        console.warn(`\n   ⚠️  Falling back to SQLite...`);
        console.warn(`   📤 Client will receive sanitized error: "${sanitizedForClient}"`);
        console.warn('');

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
    console.error(`\n❌ [GET /api/graph] CRITICAL ERROR (${duration}ms)`);
    console.error('═════════════════════════════════════════════════');
    console.error('🔍 UNHANDLED ERROR - Both Databricks AND SQLite failed:');
    console.error('═════════════════════════════════════════════════');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    console.error('\nFull Stack Trace:');
    console.error(error.stack);
    console.error('═════════════════════════════════════════════════\n');
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
        console.error(`\n   ❌ Databricks write FAILED (${dbDuration}ms)`);
        console.error('   ═════════════════════════════════════════════════');
        console.error('   🔍 RAW ERROR DETAILS (Not sent to client):');
        console.error('   ═════════════════════════════════════════════════');
        console.error('   Error Type:', error.constructor.name);
        console.error('   Error Message:', error.message);
        console.error('\n   Full Stack Trace:');
        console.error(error.stack);
        console.error('   ═════════════════════════════════════════════════');

        writeError = error.message; // Keep raw error for logging
        const sanitizedForClient = sanitizeErrorForClient(error);
        console.warn(`\n   ⚠️  Falling back to SQLite...`);
        console.warn(`   📤 Client will receive sanitized error: "${sanitizedForClient}"`);
        console.warn('');

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
    const sanitizedError = sanitizeErrorForClient(writeError);
    const message = writeError
      ? `✅ Wrote ${nodes.length} nodes and ${edges.length} edges to ${target} (Databricks unavailable: ${sanitizedError})`
      : `✅ Wrote ${nodes.length} nodes and ${edges.length} edges to ${target}`;

    console.log(`✅ [POST /api/graph] Complete: ${target} (${totalDuration}ms total)\n`);

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
    console.error(`\n❌ [POST /api/graph] CRITICAL ERROR (${totalDuration}ms)`);
    console.error('═════════════════════════════════════════════════');
    console.error('🔍 UNHANDLED ERROR - Both Databricks AND SQLite failed:');
    console.error('═════════════════════════════════════════════════');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    console.error('\nFull Stack Trace:');
    console.error(error.stack);
    console.error('═════════════════════════════════════════════════\n');
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

  console.log(`\n🔄 [PATCH /api/graph/status] Updating status to: ${status}`);
  console.log(`   Nodes: ${nodeIds?.length || 0}, Edges: ${edgeIds?.length || 0}`);

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
    console.log(`✅ [PATCH /api/graph/status] Complete (${totalDuration}ms)\n`);

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
    console.error(`\n❌ [PATCH /api/graph/status] ERROR (${totalDuration}ms)`);
    console.error('═════════════════════════════════════════════════');
    console.error('🔍 STATUS UPDATE ERROR:');
    console.error('═════════════════════════════════════════════════');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    console.error('\nFull Stack Trace:');
    console.error(error.stack);
    console.error('═════════════════════════════════════════════════\n');
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
    console.log('\n🌱 [POST /api/graph/seed] Reseeding database...');

    // Close current connection
    db.close();

    // Reseed
    seedDatabase(true);

    // Reinitialize connection
    db = initDatabase();

    const nodes = getAllNodes(db);
    const edges = getAllEdges(db);

    const totalDuration = Date.now() - startTime;
    console.log(`✅ [POST /api/graph/seed] Complete (${totalDuration}ms)\n`);

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
    console.error(`\n❌ [POST /api/graph/seed] ERROR (${totalDuration}ms)`);
    console.error('═════════════════════════════════════════════════');
    console.error('🔍 DATABASE SEED ERROR:');
    console.error('═════════════════════════════════════════════════');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    console.error('\nFull Stack Trace:');
    console.error(error.stack);
    console.error('═════════════════════════════════════════════════\n');
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
    console.log('\n  🎯 DATA STRATEGY: Databricks Primary → SQLite Fallback');
    console.log(`     → Reads: Databricks first, SQLite fallback`);
    console.log(`     → Writes: Databricks first, SQLite fallback`);
  } else {
    console.log('\n  🎯 DATA STRATEGY: SQLite only (Databricks disabled)');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('Ready to accept requests...\n');
});
