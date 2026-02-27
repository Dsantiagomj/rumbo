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

  it('hides categories with 0 transactions', () => {
    render(<CategoryCascadePicker categories={categories} value={null} onChange={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /Entretenimiento/ })).not.toBeInTheDocument();
  });

  it('shows transaction count badge', () => {
    render(<CategoryCascadePicker categories={categories} value={null} onChange={vi.fn()} />);

    expect(screen.getByText('(5)')).toBeInTheDocument();
    expect(screen.getByText('(3)')).toBeInTheDocument();
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
});
