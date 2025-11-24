import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NodePalette from '../NodePalette';

describe('NodePalette', () => {
  const mockOnStartCreateNode = vi.fn();
  const mockOnStartCreateEdge = vi.fn();

  it('renders the palette with create buttons', () => {
    render(
      <NodePalette
        onStartCreateNode={mockOnStartCreateNode}
        onStartCreateEdge={mockOnStartCreateEdge}
        disabled={false}
      />
    );

    expect(screen.getByText(/Create New/i)).toBeInTheDocument();
  });

  it('calls onStartCreateNode when create node button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <NodePalette
        onStartCreateNode={mockOnStartCreateNode}
        onStartCreateEdge={mockOnStartCreateEdge}
        disabled={false}
      />
    );

    const createNodeButton = screen.getByRole('button', { name: /new node/i });
    await user.click(createNodeButton);

    expect(mockOnStartCreateNode).toHaveBeenCalledTimes(1);
  });

  it('calls onStartCreateEdge when create edge button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <NodePalette
        onStartCreateNode={mockOnStartCreateNode}
        onStartCreateEdge={mockOnStartCreateEdge}
        disabled={false}
      />
    );

    const createEdgeButton = screen.getByRole('button', { name: /new relationship/i });
    await user.click(createEdgeButton);

    expect(mockOnStartCreateEdge).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when disabled prop is true', () => {
    render(
      <NodePalette
        onStartCreateNode={mockOnStartCreateNode}
        onStartCreateEdge={mockOnStartCreateEdge}
        disabled={true}
      />
    );

    const createNodeButton = screen.getByRole('button', { name: /new node/i });
    const createEdgeButton = screen.getByRole('button', { name: /new relationship/i });

    expect(createNodeButton).toBeDisabled();
    expect(createEdgeButton).toBeDisabled();
  });
});
