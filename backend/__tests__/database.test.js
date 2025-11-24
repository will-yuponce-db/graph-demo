const {
  initDatabase,
  getAllNodes,
  getAllEdges,
  insertNodes,
  insertEdges,
  isDatabaseEmpty,
} = require('../db/database');
const fs = require('fs');
const path = require('path');

describe('Database Operations', () => {
  let db;
  const testDbPath = path.join(__dirname, 'test.db');

  beforeEach(() => {
    // Remove test database if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    // Initialize a test database
    db = initDatabase(testDbPath);
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('initDatabase', () => {
    it('creates a new database', () => {
      expect(db).toBeDefined();
      expect(fs.existsSync(testDbPath)).toBe(true);
    });

    it('creates nodes and edges tables', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const tableNames = tables.map((t) => t.name);

      expect(tableNames).toContain('nodes');
      expect(tableNames).toContain('edges');
    });
  });

  describe('isDatabaseEmpty', () => {
    it('returns true for empty database', () => {
      expect(isDatabaseEmpty(db)).toBe(true);
    });

    it('returns false after inserting data', () => {
      const nodes = [
        {
          id: 'test-1',
          name: 'Test Node',
          type: 'Person',
          properties: JSON.stringify({}),
          status: 'existing',
        },
      ];
      insertNodes(db, nodes);
      expect(isDatabaseEmpty(db)).toBe(false);
    });
  });

  describe('insertNodes', () => {
    it('inserts nodes successfully', () => {
      const nodes = [
        {
          id: 'node-1',
          name: 'Alice',
          type: 'Person',
          properties: JSON.stringify({ age: 30 }),
          status: 'existing',
        },
        {
          id: 'node-2',
          name: 'Bob',
          type: 'Person',
          properties: JSON.stringify({ age: 25 }),
          status: 'existing',
        },
      ];

      const result = insertNodes(db, nodes);
      expect(result.changes).toBe(2);

      const allNodes = getAllNodes(db);
      expect(allNodes).toHaveLength(2);
      expect(allNodes[0].name).toBe('Alice');
      expect(allNodes[1].name).toBe('Bob');
    });

    it('handles empty array', () => {
      const result = insertNodes(db, []);
      expect(result.changes).toBe(0);
    });
  });

  describe('insertEdges', () => {
    it('inserts edges successfully', () => {
      // First insert nodes
      const nodes = [
        {
          id: 'node-1',
          name: 'Alice',
          type: 'Person',
          properties: JSON.stringify({}),
          status: 'existing',
        },
        {
          id: 'node-2',
          name: 'Bob',
          type: 'Person',
          properties: JSON.stringify({}),
          status: 'existing',
        },
      ];
      insertNodes(db, nodes);

      // Then insert edges
      const edges = [
        {
          id: 'edge-1',
          source_id: 'node-1',
          target_id: 'node-2',
          relationship_type: 'KNOWS',
          properties: JSON.stringify({}),
          status: 'existing',
        },
      ];

      const result = insertEdges(db, edges);
      expect(result.changes).toBe(1);

      const allEdges = getAllEdges(db);
      expect(allEdges).toHaveLength(1);
      expect(allEdges[0].relationship_type).toBe('KNOWS');
    });

    it('handles empty array', () => {
      const result = insertEdges(db, []);
      expect(result.changes).toBe(0);
    });
  });

  describe('getAllNodes', () => {
    it('returns all nodes', () => {
      const nodes = [
        {
          id: 'node-1',
          name: 'Alice',
          type: 'Person',
          properties: JSON.stringify({ city: 'NYC' }),
          status: 'existing',
        },
      ];
      insertNodes(db, nodes);

      const result = getAllNodes(db);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
      expect(result[0].type).toBe('Person');
    });

    it('returns empty array for empty database', () => {
      const result = getAllNodes(db);
      expect(result).toEqual([]);
    });
  });

  describe('getAllEdges', () => {
    it('returns all edges', () => {
      const nodes = [
        {
          id: 'node-1',
          name: 'Alice',
          type: 'Person',
          properties: JSON.stringify({}),
          status: 'existing',
        },
        {
          id: 'node-2',
          name: 'Company',
          type: 'Organization',
          properties: JSON.stringify({}),
          status: 'existing',
        },
      ];
      insertNodes(db, nodes);

      const edges = [
        {
          id: 'edge-1',
          source_id: 'node-1',
          target_id: 'node-2',
          relationship_type: 'WORKS_AT',
          properties: JSON.stringify({ since: 2020 }),
          status: 'existing',
        },
      ];
      insertEdges(db, edges);

      const result = getAllEdges(db);
      expect(result).toHaveLength(1);
      expect(result[0].relationship_type).toBe('WORKS_AT');
    });

    it('returns empty array for database with no edges', () => {
      const result = getAllEdges(db);
      expect(result).toEqual([]);
    });
  });
});
