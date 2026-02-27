import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format, subDays } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateTransactionPage } from '../CreateTransactionPage';

const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const PARENT_CATEGORY_ID = 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb';
const SUBCATEGORY_ID = 'cccccccc-cccc-4ccc-accc-cccccccccccc';

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useQueryClient: vi.fn(),
  mutateAsync: vi.fn(),
  invalidateQueries: vi.fn(),
  routerBack: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: mocks.useQuery,
    useQueryClient: mocks.useQueryClient,
  };
});

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    history: {
      back: mocks.routerBack,
    },
  }),
}));

vi.mock('@/shared/lib/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('sileo', () => ({
  sileo: {
    success: mocks.success,
    error: mocks.error,
  },
}));

vi.mock('../../model/transaction-queries', () => ({
  useCreateTransactionMutation: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
  }),
}));

function setupQueries() {
  const product = {
    id: PRODUCT_ID,
    type: 'cash' as const,
    name: 'Wallet',
    institution: 'Rumbo',
    balance: '100.00',
    currency: 'COP' as const,
    metadata: null,
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
  };

  const categories = [
    {
      id: PARENT_CATEGORY_ID,
      userId: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
      name: 'Comida',
      parentId: null,
      isDefault: false,
      transactionCount: 3,
      createdAt: '2026-02-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z',
    },
    {
      id: SUBCATEGORY_ID,
      userId: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
      name: 'Restaurantes',
      parentId: PARENT_CATEGORY_ID,
      isDefault: false,
      transactionCount: 1,
      createdAt: '2026-02-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z',
    },
  ];

  mocks.useQuery.mockImplementation((options: { queryKey?: unknown[] }) => {
    const queryKey = options.queryKey ?? [];

    if (queryKey[0] === 'financial-products' && queryKey[1] === PRODUCT_ID) {
      return { data: product, isPending: false };
    }

    if (queryKey[0] === 'categories') {
      return { data: { categories }, isPending: false };
    }

    return { data: undefined, isPending: false };
  });
}

describe('CreateTransactionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.mutateAsync.mockResolvedValue({});
    mocks.useQueryClient.mockReturnValue({
      invalidateQueries: mocks.invalidateQueries,
    });
    setupQueries();
  });

  it('submits selected currency, date and category in final payload', async () => {
    const user = userEvent.setup();
    const expectedYesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    render(<CreateTransactionPage productId={PRODUCT_ID} />);

    await user.type(screen.getByLabelText('Nombre'), 'Cena');
    await user.type(screen.getByLabelText('Monto'), '123.45');
    await user.click(screen.getByRole('button', { name: 'USD' }));

    const dateTrigger = document.getElementById('txn-date');
    expect(dateTrigger).toBeTruthy();
    await user.click(dateTrigger as HTMLElement);
    await user.click(await screen.findByRole('button', { name: 'Ayer' }));

    const categoryTrigger = document.getElementById('txn-category');
    expect(categoryTrigger).toBeTruthy();
    await user.click(categoryTrigger as HTMLElement);
    await user.click(await screen.findByRole('button', { name: /Comida/ }));
    await user.click(screen.getByRole('button', { name: 'Opcional - seleccionar' }));
    await user.click(await screen.findByRole('button', { name: 'Restaurantes' }));

    await user.type(screen.getByLabelText('Comercio'), 'Restaurante de prueba');
    await user.type(screen.getByLabelText('Notas'), 'Cena en familia');
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => {
      expect(mocks.mutateAsync).toHaveBeenCalledTimes(1);
    });

    const payload = mocks.mutateAsync.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      name: 'Cena',
      type: 'expense',
      amount: '123.45',
      currency: 'USD',
      categoryId: SUBCATEGORY_ID,
      merchant: 'Restaurante de prueba',
      notes: 'Cena en familia',
      excluded: false,
      date: expect.any(Date),
    });
    expect((payload.date as Date).toISOString().slice(0, 10)).toBe(expectedYesterday);
  });
});
