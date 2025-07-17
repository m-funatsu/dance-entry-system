import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { testUsers } from '../utils/test-data'
import { ToastProvider } from '@/contexts/ToastContext'
import ResetPassword from '@/app/auth/reset-password/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/supabase/client')

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
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

// Test wrapper with ToastProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    {children}
  </ToastProvider>
)

describe('Reset Password Page', () => {
  const mockSupabaseClient = {
    auth: {
      resetPasswordForEmail: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue(mockRouter)
    mockCreateClient.mockReturnValue(mockSupabaseClient as any)
  })

  it('should render reset password form', () => {
    render(
      <TestWrapper>
        <ResetPassword />
      </TestWrapper>
    )

    expect(screen.getByText('パスワードリセット')).toBeInTheDocument()
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'リセットメールを送信' })).toBeInTheDocument()
  })

  it('should handle successful password reset request', async () => {
    mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null,
    })

    render(
      <TestWrapper>
        <ResetPassword />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('メールアドレス')
    const submitButton = screen.getByRole('button', { name: 'リセットメールを送信' })

    fireEvent.change(emailInput, { target: { value: testUsers[0].email } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        testUsers[0].email,
        {
          redirectTo: `${window.location.origin}/auth/update-password`,
        }
      )
    })

    await waitFor(() => {
      expect(screen.getByText('パスワードリセットメールを送信しました')).toBeInTheDocument()
    })
  })

  it('should handle reset password error', async () => {
    mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
      data: null,
      error: { message: 'User not found' },
    })

    render(
      <TestWrapper>
        <ResetPassword />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('メールアドレス')
    const submitButton = screen.getByRole('button', { name: 'リセットメールを送信' })

    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('メールアドレスが見つかりません')).toBeInTheDocument()
    })
  })

  it('should validate email format', async () => {
    render(
      <TestWrapper>
        <ResetPassword />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('メールアドレス')
    const submitButton = screen.getByRole('button', { name: 'リセットメールを送信' })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('有効なメールアドレスを入力してください')).toBeInTheDocument()
    })
  })

  it('should validate required email field', async () => {
    render(
      <TestWrapper>
        <ResetPassword />
      </TestWrapper>
    )

    const submitButton = screen.getByRole('button', { name: 'リセットメールを送信' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('メールアドレスを入力してください')).toBeInTheDocument()
    })
  })

  it('should show loading state during reset', async () => {
    let resolveReset: (value: any) => void
    mockSupabaseClient.auth.resetPasswordForEmail.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReset = resolve
        })
    )

    render(
      <TestWrapper>
        <ResetPassword />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('メールアドレス')
    const submitButton = screen.getByRole('button', { name: 'リセットメールを送信' })

    fireEvent.change(emailInput, { target: { value: testUsers[0].email } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('送信中...')).toBeInTheDocument()
    })

    // Complete reset
    resolveReset({
      data: {},
      error: null,
    })
  })

  it('should navigate back to login', () => {
    render(
      <TestWrapper>
        <ResetPassword />
      </TestWrapper>
    )

    const backLink = screen.getByText('ログインに戻る')
    fireEvent.click(backLink)

    expect(mockRouter.push).toHaveBeenCalledWith('/auth/login')
  })

  it('should prevent multiple submissions', async () => {
    mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null,
    })

    render(
      <TestWrapper>
        <ResetPassword />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('メールアドレス')
    const submitButton = screen.getByRole('button', { name: 'リセットメールを送信' })

    fireEvent.change(emailInput, { target: { value: testUsers[0].email } })
    
    // Click multiple times
    fireEvent.click(submitButton)
    fireEvent.click(submitButton)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1)
    })
  })

  it('should handle network errors', async () => {
    mockSupabaseClient.auth.resetPasswordForEmail.mockRejectedValue(
      new Error('Network error')
    )

    render(
      <TestWrapper>
        <ResetPassword />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('メールアドレス')
    const submitButton = screen.getByRole('button', { name: 'リセットメールを送信' })

    fireEvent.change(emailInput, { target: { value: testUsers[0].email } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument()
    })
  })
})