import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchGraphData, writeToTable, deleteNode, deleteEdge } from '../graphApi';
import { ChangeStatus } from '../../types/graph';

// Mock fetch globally
global.fetch = vi.fn();

describe('graphApi', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchGraphData', () => {
    it('fetches graph data successfully', async () => {
      const mockData = {
        success: true,
        data: {
          nodes: [
            {
              id: '1',
              name: 'Test Node',
              type: 'Person',
              properties: {},
              status: ChangeStatus.EXISTING,
            },
          ],
          edges: [],
        },
        source: 'sqlite',
        databricksEnabled: false,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchGraphData('test_table');

      expect(result.success).toBe(true);
      expect(result.data?.nodes).toHaveLength(1);
      expect(result.source).toBe('sqlite');
    });

    it('handles fetch errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchGraphData('test_table');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('handles non-ok responses', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      const result = await fetchGraphData('test_table');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not Found');
    });
  });

  describe('writeToTable', () => {
    it('writes data successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Data written successfully',
        nodesWritten: 1,
        edgesWritten: 1,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const nodes = [
        {
          id: '1',
          name: 'Test Node',
          type: 'Person',
          properties: {},
          status: ChangeStatus.NEW,
        },
      ];
      const edges: never[] = [];

      const result = await writeToTable(nodes, edges, 'test_table');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Data written successfully');
    });

    it('handles write errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Write failed'));

      const result = await writeToTable([], [], 'test_table');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Write failed');
    });
  });

  describe('deleteNode', () => {
    it('deletes a node successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Node deleted',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await deleteNode('1', 'test_table');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Node deleted');
    });
  });

  describe('deleteEdge', () => {
    it('deletes an edge successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Edge deleted',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await deleteEdge('edge1', 'test_table');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Edge deleted');
    });
  });
});
