import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CategoryCascadePicker } from '../CategoryCascadePicker';

const categories = [
  { id: 'parent-1', name: 'Comida', parentId: null, transactionCount: 5 },
  { id: 'parent-2', name: 'Transporte', parentId: null, transactionCount: 3 },
  { id: 'parent-3', name: 'Entretenimiento', parentId: null, transactionCount: 0 },
  { id: 'child-1', name: 'Restaurantes', parentId: 'parent-1', transactionCount: 2 },
  { id: 'child-2', name: 'Supermercado', parentId: 'parent-1', transactionCount: 3 },
  { id: 'child-3', name: 'Bus', parentId: 'parent-2', transactionCount: 3 },
];

describe('CategoryCascadePicker', () => {
  it('shows only parent categories initially', () => {
    render(<CategoryCascadePicker categories={categories} value={null} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Comida/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Transporte/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Restaurantes/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Supermercado/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Bus/ })).not.toBeInTheDocument();
  });

  it('hides categories with 0 transactions by default (hideEmpty=true)', () => {
    render(<CategoryCascadePicker categories={categories} value={null} onChange={vi.fn()} />);

    // Entretenimiento has 0 transactions and no children with transactions
    expect(screen.queryByRole('button', { name: /Entretenimiento/ })).not.toBeInTheDocument();
  });

  it('shows categories with 0 transactions when hideEmpty is false', () => {
    render(
      <CategoryCascadePicker
        categories={categories}
        value={null}
        onChange={vi.fn()}
        hideEmpty={false}
      />,
    );

    expect(screen.getByRole('button', { name: /Entretenimiento/ })).toBeInTheDocument();
  });

  it('shows parent with 0 transactions if children have transactions, with total count', () => {
    const categoriesWithEmptyParent = [
      { id: 'parent-hogar', name: 'Hogar', parentId: null, transactionCount: 0 },
      {
        id: 'child-mantenimiento',
        name: 'Mantenimiento',
        parentId: 'parent-hogar',
        transactionCount: 2,
      },
      { id: 'parent-empty', name: 'Empty', parentId: null, transactionCount: 0 },
    ];

    render(
      <CategoryCascadePicker
        categories={categoriesWithEmptyParent}
        value={null}
        onChange={vi.fn()}
      />,
    );

    // Hogar should appear because its child Mantenimiento has transactions
    expect(screen.getByRole('button', { name: /Hogar/ })).toBeInTheDocument();
    // Hogar should show count of 2 (sum of children's transactions)
    expect(screen.getByText('(2)')).toBeInTheDocument();
    // Empty should NOT appear - no transactions and no children with transactions
    expect(screen.queryByRole('button', { name: /Empty/ })).not.toBeInTheDocument();
  });

  it('shows total transaction count for parents (own + children)', () => {
    render(<CategoryCascadePicker categories={categories} value={null} onChange={vi.fn()} />);

    // Comida: 5 (own) + 2 (Restaurantes) + 3 (Supermercado) = 10
    expect(screen.getByText('(10)')).toBeInTheDocument();
    // Transporte: 3 (own) + 3 (Bus) = 6
    expect(screen.getByText('(6)')).toBeInTheDocument();
  });

  it('shows subcategories when parent with children is clicked', async () => {
    const user = userEvent.setup();
    render(<CategoryCascadePicker categories={categories} value={null} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Comida/ }));

    expect(screen.getByRole('button', { name: /Restaurantes/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Supermercado/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Transporte/ })).not.toBeInTheDocument();
  });

  it('shows back button in subcategory view', async () => {
    const user = userEvent.setup();
    render(<CategoryCascadePicker categories={categories} value={null} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Comida/ }));

    expect(screen.getByRole('button', { name: /Volver/ })).toBeInTheDocument();
  });

  it('returns to parent view when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<CategoryCascadePicker categories={categories} value={null} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Comida/ }));
    await user.click(screen.getByRole('button', { name: /Volver/ }));

    expect(screen.getByRole('button', { name: /Comida/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Transporte/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Restaurantes/ })).not.toBeInTheDocument();
  });

  it('calls onChange when subcategory is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryCascadePicker categories={categories} value={null} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /Comida/ }));
    await user.click(screen.getByRole('button', { name: /Restaurantes/ }));

    expect(onChange).toHaveBeenCalledWith('child-1');
  });

  it('calls onChange(null) when "Todas las categorias" is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryCascadePicker categories={categories} value="parent-1" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /Todas las categorías/ }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('calls onChange directly when parent without children is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const categoriesWithoutChildrenForTransporte = categories.filter((c) => c.id !== 'child-3');
    render(
      <CategoryCascadePicker
        categories={categoriesWithoutChildrenForTransporte}
        value={null}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Transporte/ }));

    expect(onChange).toHaveBeenCalledWith('parent-2');
  });

  it('highlights selected item with checkmark', () => {
    render(<CategoryCascadePicker categories={categories} value="parent-1" onChange={vi.fn()} />);

    const comidaButton = screen.getByRole('button', { name: /Comida/ });
    expect(comidaButton).toHaveClass('bg-accent');
  });

  it('shows "Todas [Parent]" option in subcategory view', async () => {
    const user = userEvent.setup();
    render(<CategoryCascadePicker categories={categories} value={null} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Comida/ }));

    // Should show "Todas Comida" option with total count
    expect(screen.getByRole('button', { name: /Todas Comida/ })).toBeInTheDocument();
    // Total: 5 (Comida) + 2 (Restaurantes) + 3 (Supermercado) = 10
    expect(screen.getByText('(10)')).toBeInTheDocument();
  });

  it('calls onChange with parent id when "Todas [Parent]" is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryCascadePicker categories={categories} value={null} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /Comida/ }));
    await user.click(screen.getByRole('button', { name: /Todas Comida/ }));

    expect(onChange).toHaveBeenCalledWith('parent-1');
  });
});
