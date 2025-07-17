import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ToastProvider } from '@/contexts/ToastContext'
import UpdatePassword from '@/app/auth/update-password/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

jest.mock('@/lib/supabase/client')

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// Mock router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
}

// Mock search params
const mockSearchParams = {
  get: jest.fn(),
  getAll: jest.fn(),
  has: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
  entries: jest.fn(),
  forEach: jest.fn(),
  toString: jest.fn(),
}

// Test wrapper with ToastProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    {children}
  </ToastProvider>
)

describe('Update Password Page', () => {
  const mockSupabaseClient = {
    auth: {
      updateUser: jest.fn(),
      getSession: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue(mockRouter)
    mockUseSearchParams.mockReturnValue(mockSearchParams as any)
    mockCreateClient.mockReturnValue(mockSupabaseClient as any)
    
    // Mock valid session
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    })
  })

  it('should render update password form', () => {
    render(
      <TestWrapper>
        <UpdatePassword />
      </TestWrapper>
    )

    expect(screen.getByText('パスワード更新')).toBeInTheDocument()
    expect(screen.getByLabelText('新しいパスワード')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード確認')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'パスワードを更新' })).toBeInTheDocument()
  })

  it('should handle successful password update', async () => {
    mockSupabaseClient.auth.updateUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    render(
      <TestWrapper>
        <UpdatePassword />
      </TestWrapper>
    )

    const passwordInput = screen.getByLabelText('新しいパスワード')
    const confirmInput = screen.getByLabelText('パスワード確認')
    const submitButton = screen.getByRole('button', { name: 'パスワードを更新' })

    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
    fireEvent.change(confirmInput, { target: { value: 'newpassword123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('パスワードが更新されました')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/login')
    })
  })

  it('should handle password update error', async () => {
    mockSupabaseClient.auth.updateUser.mockResolvedValue({
      data: null,
      error: { message: 'Password update failed' },
    })

    render(
      <TestWrapper>
        <UpdatePassword />
      </TestWrapper>
    )

    const passwordInput = screen.getByLabelText('新しいパスワード')
    const confirmInput = screen.getByLabelText('パスワード確認')
    const submitButton = screen.getByRole('button', { name: 'パスワードを更新' })

    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
    fireEvent.change(confirmInput, { target: { value: 'newpassword123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('パスワードの更新に失敗しました')).toBeInTheDocument()
    })
  })

  it('should validate password match', async () => {
    render(
      <TestWrapper>
        <UpdatePassword />
      </TestWrapper>
    )

    const passwordInput = screen.getByLabelText('新しいパスワード')
    const confirmInput = screen.getByLabelText('パスワード確認')
    const submitButton = screen.getByRole('button', { name: 'パスワードを更新' })

    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmInput, { target: { value: 'different123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument()
    })
  })

  it('should validate password length', async () => {
    render(
      <TestWrapper>
        <UpdatePassword />
      </TestWrapper>
    )

    const passwordInput = screen.getByLabelText('新しいパスワード')
    const confirmInput = screen.getByLabelText('パスワード確認')
    const submitButton = screen.getByRole('button', { name: 'パスワードを更新' })

    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.change(confirmInput, { target: { value: '123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('パスワードは6文字以上で入力してください')).toBeInTheDocument()
    })
  })

  it('should validate required fields', async () => {
    render(
      <TestWrapper>
        <UpdatePassword />
      </TestWrapper>
    )

    const submitButton = screen.getByRole('button', { name: 'パスワードを更新' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('新しいパスワードを入力してください')).toBeInTheDocument()
      expect(screen.getByText('パスワード確認を入力してください')).toBeInTheDocument()
    })
  })

  it('should show loading state during update', async () => {
    let resolveUpdate: (value: any) => void
    mockSupabaseClient.auth.updateUser.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve
        })
    )

    render(
      <TestWrapper>
        <UpdatePassword />
      </TestWrapper>
    )

    const passwordInput = screen.getByLabelText('新しいパスワード')
    const confirmInput = screen.getByLabelText('パスワード確認')
    const submitButton = screen.getByRole('button', { name: 'パスワードを更新' })

    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
    fireEvent.change(confirmInput, { target: { value: 'newpassword123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('更新中...')).toBeInTheDocument()
    })

    // Complete update
    resolveUpdate({
      data: { user: { id: 'user-1' } },
      error: null,
    })
  })

  it('should handle no session error', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    render(
      <TestWrapper>
        <UpdatePassword />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('セッションが無効です')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/login')
    })
  })

  it('should prevent multiple submissions', async () => {
    mockSupabaseClient.auth.updateUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    render(
      <TestWrapper>
        <UpdatePassword />
      </TestWrapper>
    )

    const passwordInput = screen.getByLabelText('新しいパスワード')
    const confirmInput = screen.getByLabelText('パスワード確認')
    const submitButton = screen.getByRole('button', { name: 'パスワードを更新' })

    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
    fireEvent.change(confirmInput, { target: { value: 'newpassword123' } })
    
    // Click multiple times
    fireEvent.click(submitButton)
    fireEvent.click(submitButton)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledTimes(1)
    })
  })

  it('should handle network errors', async () => {
    mockSupabaseClient.auth.updateUser.mockRejectedValue(
      new Error('Network error')
    )

    render(
      <TestWrapper>
        <UpdatePassword />
      </TestWrapper>
    )

    const passwordInput = screen.getByLabelText('新しいパスワード')
    const confirmInput = screen.getByLabelText('パスワード確認')
    const submitButton = screen.getByRole('button', { name: 'パスワードを更新' })

    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
    fireEvent.change(confirmInput, { target: { value: 'newpassword123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument()
    })
  })
})