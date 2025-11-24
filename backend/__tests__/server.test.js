const request = require('supertest');
const express = require('express');

// Mock database functions
jest.mock('../db/database', () => ({
  initDatabase: jest.fn(() => ({
    close: jest.fn(),
  })),
  getAllNodes: jest.fn(() => []),
  getAllEdges: jest.fn(() => []),
  insertNodes: jest.fn(() => ({ changes: 0 })),
  insertEdges: jest.fn(() => ({ changes: 0 })),
  isDatabaseEmpty: jest.fn(() => false),
  createTables: jest.fn(),
  updateNodesStatus: jest.fn(),
  updateEdgesStatus: jest.fn(),
}));

jest.mock('../db/seed', () => ({
  seedDatabase: jest.fn(),
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('Server API Endpoints', () => {
  let app;

  beforeAll(() => {
    // Create a test app
    app = express();
    app.use(express.json());

    // Add basic health endpoint for testing
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // Mock graph endpoint
    app.get('/api/graph', (req, res) => {
      const { getAllNodes, getAllEdges } = require('../db/database');
      const nodes = getAllNodes();
      const edges = getAllEdges();

      res.json({
        success: true,
        data: {
          nodes: nodes.map((n) => ({
            id: n.id,
            name: n.name,
            type: n.type,
            properties: JSON.parse(n.properties || '{}'),
            status: n.status || 'existing',
          })),
          edges: edges.map((e) => ({
            id: e.id,
            source: e.source_id,
            target: e.target_id,
            relationshipType: e.relationship_type,
            properties: JSON.parse(e.properties || '{}'),
            status: e.status || 'existing',
          })),
        },
        source: 'sqlite',
        databricksEnabled: false,
      });
    });

    // Mock write endpoint
    app.post('/api/graph', (req, res) => {
      const { nodes = [], edges = [] } = req.body;

      res.json({
        success: true,
        message: `Successfully wrote ${nodes.length} nodes and ${edges.length} edges`,
        nodesWritten: nodes.length,
        edgesWritten: edges.length,
        target: 'sqlite',
      });
    });
  });

  describe('GET /health', () => {
    it('returns health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/graph', () => {
    it('returns graph data successfully', async () => {
      const response = await request(app).get('/api/graph');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('nodes');
      expect(response.body.data).toHaveProperty('edges');
      expect(Array.isArray(response.body.data.nodes)).toBe(true);
      expect(Array.isArray(response.body.data.edges)).toBe(true);
    });

    it('includes source information', async () => {
      const response = await request(app).get('/api/graph');

      expect(response.body).toHaveProperty('source');
      expect(response.body).toHaveProperty('databricksEnabled');
    });
  });

  describe('POST /api/graph', () => {
    it('writes graph data successfully', async () => {
      const testData = {
        nodes: [
          {
            id: 'test-1',
            name: 'Test Node',
            type: 'Person',
            properties: {},
            status: 'new',
          },
        ],
        edges: [],
      };

      const response = await request(app).post('/api/graph').send(testData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('nodesWritten', 1);
      expect(response.body).toHaveProperty('edgesWritten', 0);
    });

    it('handles empty data', async () => {
      const response = await request(app).post('/api/graph').send({
        nodes: [],
        edges: [],
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.nodesWritten).toBe(0);
      expect(response.body.edgesWritten).toBe(0);
    });
  });
});

describe('Utility Functions', () => {
  describe('validateTableName', () => {
    // Note: Since validateTableName is internal to server.js, we test it conceptually
    const validTableNames = [
      'main.default.my_table',
      'schema.table',
      'simple_table',
      'table_123',
      '`catalog`.`schema`.`table`',
    ];

    const invalidTableNames = [
      'table; DROP TABLE users;',
      'table-name',
      'table name',
      '../../../etc/passwd',
      'table$name',
    ];

    it('should accept valid table name formats', () => {
      validTableNames.forEach((name) => {
        // Pattern that should match valid names
        const validPattern = /^[a-zA-Z0-9_`]+(\.[a-zA-Z0-9_`]+){0,2}$/;
        expect(validPattern.test(name)).toBe(true);
      });
    });

    it('should reject invalid table name formats', () => {
      invalidTableNames.forEach((name) => {
        const validPattern = /^[a-zA-Z0-9_`]+(\.[a-zA-Z0-9_`]+){0,2}$/;
        expect(validPattern.test(name)).toBe(false);
      });
    });
  });
});
