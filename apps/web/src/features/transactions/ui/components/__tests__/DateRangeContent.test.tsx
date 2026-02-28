import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateRangeContent } from '../DateRangeContent';

describe('DateRangeContent', () => {
  beforeEach(() => {
    // Mock matchMedia for useIsMobile hook
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false, // Desktop by default
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });
  it('renders all preset buttons', () => {
    render(
      <DateRangeContent
        startDate={undefined}
        endDate={undefined}
        preset="all"
        onPresetChange={vi.fn()}
        onRangeChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Esta semana' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Este mes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Últimos 30 días' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Todo' })).toBeInTheDocument();
  });

  it('calls onPresetChange when preset clicked', async () => {
    const onPresetChange = vi.fn();

    render(
      <DateRangeContent
        startDate={undefined}
        endDate={undefined}
        preset="all"
        onPresetChange={onPresetChange}
        onRangeChange={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Esta semana' }));

    expect(onPresetChange).toHaveBeenCalledWith('week');
  });

  it('highlights active preset with data-active attribute', () => {
    const { rerender } = render(
      <DateRangeContent
        startDate={undefined}
        endDate={undefined}
        preset="week"
        onPresetChange={vi.fn()}
        onRangeChange={vi.fn()}
      />,
    );

    const weekButton = screen.getByRole('button', { name: 'Esta semana' });
    const monthButton = screen.getByRole('button', { name: 'Este mes' });

    expect(weekButton).toHaveAttribute('data-active', 'true');
    expect(monthButton).not.toHaveAttribute('data-active', 'true');

    rerender(
      <DateRangeContent
        startDate={undefined}
        endDate={undefined}
        preset="month"
        onPresetChange={vi.fn()}
        onRangeChange={vi.fn()}
      />,
    );

    expect(weekButton).not.toHaveAttribute('data-active', 'true');
    expect(monthButton).toHaveAttribute('data-active', 'true');
  });
});
