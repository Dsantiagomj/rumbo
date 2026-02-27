import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CategoryPickerContent } from '../CategoryPickerContent';

const categories = [
  { id: 'cat-1', name: 'Comida', parentId: null, transactionCount: 3 },
  { id: 'cat-2', name: 'Transporte', parentId: null, transactionCount: 0 },
];

describe('CategoryPickerContent', () => {
  it('renders categories and notifies selection changes', async () => {
    const onChange = vi.fn();

    render(<CategoryPickerContent categories={categories} value={null} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Sin categoria' }));
    await userEvent.click(screen.getByRole('button', { name: 'Comida' }));

    expect(onChange).toHaveBeenNthCalledWith(1, null);
    expect(onChange).toHaveBeenNthCalledWith(2, 'cat-1');
  });

  it('shows transaction count only when enabled and greater than zero', () => {
    const { rerender } = render(
      <CategoryPickerContent categories={categories} value={null} onChange={vi.fn()} />,
    );

    expect(screen.queryByText('(3)')).not.toBeInTheDocument();

    rerender(
      <CategoryPickerContent
        categories={categories}
        value={null}
        onChange={vi.fn()}
        showTransactionCount
      />,
    );

    expect(screen.getByText('(3)')).toBeInTheDocument();
    expect(screen.queryByText('(0)')).not.toBeInTheDocument();
  });

  it('filters visible categories by search text', async () => {
    render(
      <CategoryPickerContent
        categories={categories}
        value={null}
        onChange={vi.fn()}
        showTransactionCount
      />,
    );

    await userEvent.type(screen.getByPlaceholderText('Buscar...'), 'trans');

    expect(screen.getByRole('button', { name: 'Transporte' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Comida' })).not.toBeInTheDocument();
  });
});
