import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResponsivePopover } from '../responsive-popover';

const useIsMobileMock = vi.fn<() => boolean>();

vi.mock('@/shared/lib/useIsMobile', () => ({
  useIsMobile: () => useIsMobileMock(),
}));

describe('ResponsivePopover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useIsMobileMock.mockReturnValue(false);
  });

  it('defaults trigger type to button on desktop mode', () => {
    render(
      <ResponsivePopover
        open={false}
        onOpenChange={vi.fn()}
        // biome-ignore lint/a11y/useButtonType: Testing that component adds type="button" by default
        trigger={<button>Abrir</button>}
      >
        <div>Contenido</div>
      </ResponsivePopover>,
    );

    expect(screen.getByRole('button', { name: 'Abrir' })).toHaveAttribute('type', 'button');
  });

  it('opens on mobile trigger click when click is not prevented', async () => {
    useIsMobileMock.mockReturnValue(true);
    const onOpenChange = vi.fn();
    const onTriggerClick = vi.fn();

    render(
      <ResponsivePopover
        open={false}
        onOpenChange={onOpenChange}
        trigger={
          <button type="button" onClick={onTriggerClick}>
            Abrir
          </button>
        }
      >
        <div>Contenido</div>
      </ResponsivePopover>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    expect(onTriggerClick).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('does not open on mobile when trigger click prevents default', async () => {
    useIsMobileMock.mockReturnValue(true);
    const onOpenChange = vi.fn();

    render(
      <ResponsivePopover
        open={false}
        onOpenChange={onOpenChange}
        trigger={
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
            }}
          >
            Abrir
          </button>
        }
      >
        <div>Contenido</div>
      </ResponsivePopover>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
