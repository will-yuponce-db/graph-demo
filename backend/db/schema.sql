-- SQLite Schema for Graph Database
-- Tables for nodes and edges

-- Drop tables if they exist
DROP TABLE IF EXISTS edges;
DROP TABLE IF EXISTS nodes;

-- Nodes table
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'existing',
  properties TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Edges table
CREATE TABLE edges (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  target TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  status TEXT DEFAULT 'existing',
  properties TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source) REFERENCES nodes(id),
  FOREIGN KEY (target) REFERENCES nodes(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_nodes_type ON nodes(type);
CREATE INDEX idx_nodes_status ON nodes(status);
CREATE INDEX idx_edges_source ON edges(source);
CREATE INDEX idx_edges_target ON edges(target);
CREATE INDEX idx_edges_relationship_type ON edges(relationship_type);
CREATE INDEX idx_edges_status ON edges(status);

