import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StudentNotifications } from '../notifications';
import * as notificationHooks from '@/hooks/notifications/useNotifications';
import type { Notification } from '@/types/notification.types';

// Mock the notification hooks
vi.mock('@/hooks/notifications/useNotifications', () => ({
  useNotifications: vi.fn(),
  useUnreadCount: vi.fn(),
  useMarkAsRead: vi.fn(),
  useMarkAllAsRead: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Helper to create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Yangi topshiriq',
    message: 'Matematika kursi uchun yangi topshiriq qo\'shildi',
    type: 'assignment',
    isRead: false,
    createdAt: new Date('2024-01-15T10:00:00'),
    priority: 'high',
  },
  {
    id: '2',
    title: 'Baho qo\'yildi',
    message: 'Fizika imtihoni uchun baho qo\'yildi',
    type: 'grade',
    isRead: true,
    createdAt: new Date('2024-01-14T15:30:00'),
    priority: 'normal',
  },
  {
    id: '3',
    title: 'Test eslatmasi',
    message: 'Ertaga test bo\'ladi',
    type: 'test',
    isRead: false,
    createdAt: new Date('2024-01-15T09:00:00'),
    priority: 'urgent',
  },
];

describe('StudentNotifications Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading skeleton while fetching notifications', () => {
    vi.mocked(notificationHooks.useNotifications).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false,
      isError: false,
    } as any);

    vi.mocked(notificationHooks.useUnreadCount).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    vi.mocked(notificationHooks.useMarkAsRead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(notificationHooks.useMarkAllAsRead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <StudentNotifications />
      </Wrapper>
    );

    // Check for skeleton elements
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('should display notifications after successful fetch', async () => {
    vi.mocked(notificationHooks.useNotifications).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as any);

    vi.mocked(notificationHooks.useUnreadCount).mockReturnValue({
      data: { count: 2 },
      isLoading: false,
    } as any);

    vi.mocked(notificationHooks.useMarkAsRead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(notificationHooks.useMarkAllAsRead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <StudentNotifications />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Yangi topshiriq')).toBeInTheDocument();
      expect(screen.getByText('Baho qo\'yildi')).toBeInTheDocument();
      expect(screen.getByText('Test eslatmasi')).toBeInTheDocument();
    });
  });

  it('should display unread badge with correct count', async () => {
    vi.mocked(notificationHooks.useNotifications).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as any);

    vi.mocked(notificationHooks.useUnreadCount).mockReturnValue({
      data: { count: 2 },
      isLoading: false,
    } as any);

    vi.mocked(notificationHooks.useMarkAsRead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(notificationHooks.useMarkAllAsRead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <StudentNotifications />
      </Wrapper>
    );

    await waitFor(() => {
      const badge = screen.getByText('2');
      expect(badge).toBeInTheDocument();
    });
  });

  it('should group notifications by type', async () => {
    vi.mocked(notificationHooks.useNotifications).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as any);

    vi.mocked(notificationHooks.useUnreadCount).mockReturnValue({
      data: { count: 2 },
      isLoading: false,
    } as any);

    vi.mocked(notificationHooks.useMarkAsRead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(notificationHooks.useMarkAllAsRead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <StudentNotifications />
      </Wrapper>
    );

    await waitFor(() => {
      // Check that filter buttons exist
      const allButtons = screen.getAllByRole('button');
      const hasTopshiriqButton = allButtons.some(btn => btn.textContent?.includes('Topshiriq'));
      const hasBahoButton = allButtons.some(btn => btn.textContent?.includes('Baho'));
      const hasTestButton = allButtons.some(btn => btn.textContent?.includes('Test'));
      
      expect(hasTopshiriqButton).toBe(true);
      expect(hasBahoButton).toBe(true);
      expect(hasTestButton).toBe(true);
    });
  });

  it('should call mark as read mutation when notification is clicked', async () => {
    const mockMarkAsRead = vi.fn();

    vi.mocked(notificationHooks.useNotifications).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as any);

    vi.mocked(notificationHooks.useUnreadCount).mockReturnValue({
      data: { count: 2 },
      isLoading: false,
    } as any);

    vi.mocked(notificationHooks.useMarkAsRead).mockReturnValue({
      mutate: mockMarkAsRead,
      isPending: false,
    } as any);

    vi.mocked(notificationHooks.useMarkAllAsRead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <StudentNotifications />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Yangi topshiriq')).toBeInTheDocument();
    });

    // Click on a notification
    const notificationCard = screen.getByText('Yangi topshiriq').closest('div[class*="cursor-pointer"]');
    if (notificationCard) {
      fireEvent.click(notificationCard);
      expect(mockMarkAsRead).toHaveBeenCalledWith('1');
    }
  });

  it('should call mark all as read mutation when button is clicked', async () => {
    const mockMarkAllAsRead = vi.fn();

    vi.mocked(notificationHooks.useNotifications).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as any);

    vi.mocked(notificationHooks.useUnreadCount).mockReturnValue({
      data: { count: 2 },
      isLoading: false,
    } as any);

    vi.mocked(notificationHooks.useMarkAsRead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(notificationHooks.useMarkAllAsRead).mockReturnValue({
      mutate: mockMarkAllAsRead,
      isPending: false,
    } as any);

    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <StudentNotifications />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Barchasini o'qildi")).toBeInTheDocument();
    });

    // Click on "Mark all as read" button
    const markAllButton = screen.getByText("Barchasini o'qildi");
    fireEvent.click(markAllButton);

    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });

  it('should display error message when fetch fails', async () => {
    const error = new Error('Network error');

    vi.mocked(notificationHooks.useNotifications).mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
      isSuccess: false,
      isError: true,
    } as any);

    vi.mocked(notificationHooks.useUnreadCount).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);

    vi.mocked(notificationHooks.useMarkAsRead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(notificationHooks.useMarkAllAsRead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <StudentNotifications />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Xatolik yuz berdi')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should display bold text for unread notifications', async () => {
    vi.mocked(notificationHooks.useNotifications).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as any);

    vi.mocked(notificationHooks.useUnreadCount).mockReturnValue({
      data: { count: 2 },
      isLoading: false,
    } as any);

    vi.mocked(notificationHooks.useMarkAsRead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(notificationHooks.useMarkAllAsRead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <StudentNotifications />
      </Wrapper>
    );

    await waitFor(() => {
      const unreadTitle = screen.getByText('Yangi topshiriq');
      const readTitle = screen.getByText('Baho qo\'yildi');

      // Unread notification should have font-bold class
      expect(unreadTitle.className).toContain('font-bold');
      // Read notification should have font-medium class only
      expect(readTitle.className).toContain('font-medium');
      expect(readTitle.className).not.toContain('font-bold');
    });
  });

  it('should filter notifications by type', async () => {
    vi.mocked(notificationHooks.useNotifications).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as any);

    vi.mocked(notificationHooks.useUnreadCount).mockReturnValue({
      data: { count: 2 },
      isLoading: false,
    } as any);

    vi.mocked(notificationHooks.useMarkAsRead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(notificationHooks.useMarkAllAsRead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <StudentNotifications />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Yangi topshiriq')).toBeInTheDocument();
    });

    // Click on "Topshiriq" filter button (find the button specifically)
    const buttons = screen.getAllByRole('button');
    const assignmentFilter = buttons.find(btn => 
      btn.textContent?.includes('Topshiriq') && 
      btn.getAttribute('data-variant') === 'outline'
    );
    
    if (assignmentFilter) {
      fireEvent.click(assignmentFilter);
    
      // Should only show assignment notification
      expect(screen.getByText('Yangi topshiriq')).toBeInTheDocument();
      expect(screen.queryByText('Baho qo\'yildi')).not.toBeInTheDocument();
      expect(screen.queryByText('Test eslatmasi')).not.toBeInTheDocument();
    }
  });
});
