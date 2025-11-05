/**
 * SQLite Database Manager
 * Provides connection and query helpers for the graph database
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'graph.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

/**
 * Initialize database connection
 */
function initDatabase() {
  const db = new Database(DB_PATH, {
    verbose: console.log,
  });

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  return db;
}

/**
 * Create tables from schema file
 */
function createTables(db) {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);
  console.log('✓ Database tables created');
}

/**
 * Get all nodes from database
 */
function getAllNodes(db) {
  const stmt = db.prepare('SELECT * FROM nodes ORDER BY created_at');
  const rows = stmt.all();

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    type: row.type,
    status: row.status,
    properties: JSON.parse(row.properties),
  }));
}

/**
 * Get all edges from database
 */
function getAllEdges(db) {
  const stmt = db.prepare('SELECT * FROM edges ORDER BY created_at');
  const rows = stmt.all();

  return rows.map((row) => ({
    id: row.id,
    source: row.source,
    target: row.target,
    relationshipType: row.relationship_type,
    status: row.status,
    properties: JSON.parse(row.properties),
  }));
}

/**
 * Insert a single node
 */
function insertNode(db, node) {
  const stmt = db.prepare(`
    INSERT INTO nodes (id, label, type, status, properties)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(node.id, node.label, node.type, node.status, JSON.stringify(node.properties));
}

/**
 * Insert a single edge
 */
function insertEdge(db, edge) {
  const stmt = db.prepare(`
    INSERT INTO edges (id, source, target, relationship_type, status, properties)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    edge.id,
    edge.source,
    edge.target,
    edge.relationshipType,
    edge.status,
    JSON.stringify(edge.properties)
  );
}

/**
 * Insert multiple nodes (transaction)
 */
function insertNodes(db, nodes) {
  const insert = db.transaction((nodes) => {
    for (const node of nodes) {
      insertNode(db, node);
    }
  });

  insert(nodes);
  console.log(`✓ Inserted ${nodes.length} nodes`);
}

/**
 * Insert multiple edges (transaction)
 */
function insertEdges(db, edges) {
  const insert = db.transaction((edges) => {
    for (const edge of edges) {
      insertEdge(db, edge);
    }
  });

  insert(edges);
  console.log(`✓ Inserted ${edges.length} edges`);
}

/**
 * Update node status
 */
function updateNodeStatus(db, nodeId, status) {
  const stmt = db.prepare(`
    UPDATE nodes 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(status, nodeId);
}

/**
 * Update edge status
 */
function updateEdgeStatus(db, edgeId, status) {
  const stmt = db.prepare(`
    UPDATE edges 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(edgeId, status);
}

/**
 * Update multiple nodes status (transaction)
 */
function updateNodesStatus(db, nodeIds, status) {
  const update = db.transaction((nodeIds, status) => {
    for (const nodeId of nodeIds) {
      updateNodeStatus(db, nodeId, status);
    }
  });

  update(nodeIds, status);
  console.log(`✓ Updated ${nodeIds.length} nodes to status: ${status}`);
}

/**
 * Update multiple edges status (transaction)
 */
function updateEdgesStatus(db, edgeIds, status) {
  const update = db.transaction((edgeIds, status) => {
    for (const edgeId of edgeIds) {
      updateEdgeStatus(db, edgeId, status);
    }
  });

  update(edgeIds, status);
  console.log(`✓ Updated ${edgeIds.length} edges to status: ${status}`);
}

/**
 * Clear all data from tables
 */
function clearAllData(db) {
  db.exec('DELETE FROM edges');
  db.exec('DELETE FROM nodes');
  console.log('✓ All data cleared');
}

/**
 * Check if database is empty
 */
function isDatabaseEmpty(db) {
  const nodeCount = db.prepare('SELECT COUNT(*) as count FROM nodes').get();
  return nodeCount.count === 0;
}

module.exports = {
  initDatabase,
  createTables,
  getAllNodes,
  getAllEdges,
  insertNode,
  insertEdge,
  insertNodes,
  insertEdges,
  updateNodeStatus,
  updateEdgeStatus,
  updateNodesStatus,
  updateEdgesStatus,
  clearAllData,
  isDatabaseEmpty,
  DB_PATH,
};
