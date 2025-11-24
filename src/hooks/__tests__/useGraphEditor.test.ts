import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGraphEditor } from '../useGraphEditor';
import { ChangeStatus } from '../../types/graph';
import type { GraphData } from '../../types/graph';

describe('useGraphEditor', () => {
  const initialData: GraphData = {
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
  };

  it('initializes with provided data', () => {
    const { result } = renderHook(() => useGraphEditor({ initialData }));

    expect(result.current.graphData.nodes).toHaveLength(1);
    expect(result.current.graphData.nodes[0].name).toBe('Test Node');
  });

  it('adds a new node', () => {
    const { result } = renderHook(() => useGraphEditor({ initialData }));

    act(() => {
      result.current.addNode({
        id: '2',
        name: 'New Node',
        type: 'Company',
        properties: {},
      });
    });

    expect(result.current.graphData.nodes).toHaveLength(2);
    expect(result.current.graphData.nodes[1].name).toBe('New Node');
    expect(result.current.graphData.nodes[1].status).toBe(ChangeStatus.NEW);
  });

  it('updates an existing node', () => {
    const { result } = renderHook(() => useGraphEditor({ initialData }));

    act(() => {
      result.current.updateNode('1', {
        id: '1',
        name: 'Updated Node',
        type: 'Person',
        properties: {},
      });
    });

    expect(result.current.graphData.nodes[0].name).toBe('Updated Node');
  });

  it('deletes a node', () => {
    const { result } = renderHook(() => useGraphEditor({ initialData }));

    act(() => {
      result.current.deleteNode('1');
    });

    expect(result.current.graphData.nodes).toHaveLength(0);
  });

  it('adds a new edge', () => {
    const { result } = renderHook(() => useGraphEditor({ initialData }));

    act(() => {
      result.current.addNode({
        id: '2',
        name: 'Node 2',
        type: 'Company',
        properties: {},
      });
    });

    act(() => {
      result.current.addEdge({
        id: 'edge1',
        source: '1',
        target: '2',
        relationshipType: 'WORKS_AT',
        properties: {},
      });
    });

    expect(result.current.graphData.edges).toHaveLength(1);
    expect(result.current.graphData.edges[0].relationshipType).toBe('WORKS_AT');
    expect(result.current.graphData.edges[0].status).toBe(ChangeStatus.NEW);
  });

  it('deletes an edge', () => {
    const dataWithEdge: GraphData = {
      nodes: [
        { id: '1', name: 'Node 1', type: 'Person', properties: {}, status: ChangeStatus.EXISTING },
        { id: '2', name: 'Node 2', type: 'Company', properties: {}, status: ChangeStatus.EXISTING },
      ],
      edges: [
        {
          id: 'edge1',
          source: '1',
          target: '2',
          relationshipType: 'WORKS_AT',
          properties: {},
          status: ChangeStatus.EXISTING,
        },
      ],
    };

    const { result } = renderHook(() => useGraphEditor({ initialData: dataWithEdge }));

    act(() => {
      result.current.deleteEdge('edge1');
    });

    expect(result.current.graphData.edges).toHaveLength(0);
  });

  it('tracks user created nodes', () => {
    const { result } = renderHook(() => useGraphEditor({ initialData }));

    act(() => {
      result.current.addNode({
        id: '2',
        name: 'New Node',
        type: 'Company',
        properties: {},
      });
    });

    expect(result.current.userCreatedNodes).toHaveLength(1);
    expect(result.current.userCreatedNodes[0].id).toBe('2');
  });

  it('selects a node', () => {
    const { result } = renderHook(() => useGraphEditor({ initialData }));

    act(() => {
      result.current.selectNode('1');
    });

    expect(result.current.selectedNodeId).toBe('1');
  });

  it('clears selection', () => {
    const { result } = renderHook(() => useGraphEditor({ initialData }));

    act(() => {
      result.current.selectNode('1');
    });

    expect(result.current.selectedNodeId).toBe('1');

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedNodeId).toBeNull();
  });

  it('marks items as saved', () => {
    const { result } = renderHook(() => useGraphEditor({ initialData }));

    act(() => {
      result.current.addNode({
        id: '2',
        name: 'New Node',
        type: 'Company',
        properties: {},
      });
    });

    expect(result.current.userCreatedNodes).toHaveLength(1);

    act(() => {
      result.current.markItemsAsSaved(['2'], []);
    });

    expect(result.current.userCreatedNodes).toHaveLength(0);
    expect(result.current.graphData.nodes[1].status).toBe(ChangeStatus.EXISTING);
  });
});
