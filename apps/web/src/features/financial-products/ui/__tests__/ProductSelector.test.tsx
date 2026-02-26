import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductSelector } from '../ProductSelector';

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: mocks.useQuery,
  };
});

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
    to?: string;
  }) => (
    <a href="/mock" className={className}>
      {children}
    </a>
  ),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('ProductSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product list when products exist', () => {
    mocks.useQuery.mockReturnValue({
      data: {
        products: [
          {
            id: '1',
            name: 'Bancolombia Ahorro',
            type: 'savings',
            balance: '1500000',
            currency: 'COP',
          },
          {
            id: '2',
            name: 'Visa Platinum',
            type: 'credit_card',
            balance: '-200000',
            currency: 'COP',
          },
        ],
      },
      isPending: false,
    });

    const onSelect = vi.fn();
    renderWithProviders(<ProductSelector onSelect={onSelect} />);

    expect(screen.getByText('Bancolombia Ahorro')).toBeInTheDocument();
    expect(screen.getByText('Visa Platinum')).toBeInTheDocument();
  });

  it('calls onSelect when a product is clicked', async () => {
    const user = userEvent.setup();
    mocks.useQuery.mockReturnValue({
      data: {
        products: [
          {
            id: 'prod-1',
            name: 'Bancolombia Ahorro',
            type: 'savings',
            balance: '1500000',
            currency: 'COP',
          },
        ],
      },
      isPending: false,
    });

    const onSelect = vi.fn();
    renderWithProviders(<ProductSelector onSelect={onSelect} />);

    await user.click(screen.getByText('Bancolombia Ahorro'));

    expect(onSelect).toHaveBeenCalledWith('prod-1');
  });

  it('shows empty state when no products exist', () => {
    mocks.useQuery.mockReturnValue({
      data: { products: [] },
      isPending: false,
    });

    const onSelect = vi.fn();
    renderWithProviders(<ProductSelector onSelect={onSelect} />);

    expect(screen.getByText(/no tienes productos/i)).toBeInTheDocument();
  });

  it('shows loading state while fetching', () => {
    mocks.useQuery.mockReturnValue({
      data: undefined,
      isPending: true,
    });

    const onSelect = vi.fn();
    renderWithProviders(<ProductSelector onSelect={onSelect} />);

    expect(screen.getByTestId('product-selector-loading')).toBeInTheDocument();
  });
});
