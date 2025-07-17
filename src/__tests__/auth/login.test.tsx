import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { testUsers, mockApiResponses } from '../utils/test-data'
import { ToastProvider } from '@/contexts/ToastContext'
import Login from '@/app/auth/login/page'

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

describe('Login Page', () => {
  const mockSupabaseClient = {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue(mockRouter)
    mockCreateClient.mockReturnValue(mockSupabaseClient as any)
  })

  it('should render login form', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    expect(screen.getByText('ログイン')).toBeInTheDocument()
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument()
  })

  it('should handle successful login', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: testUsers[0],
        session: mockApiResponses.successfulAuth.session,
      },
      error: null,
    })

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: testUsers[0],
        error: null,
      }),
    })

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByLabelText('パスワード')
    const submitButton = screen.getByRole('button', { name: 'ログイン' })

    fireEvent.change(emailInput, { target: { value: testUsers[0].email } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: testUsers[0].email,
        password: 'password123',
      })
    })

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should handle admin login redirect', async () => {
    const adminUser = testUsers[2] // admin user
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: adminUser,
        session: mockApiResponses.successfulAuth.session,
      },
      error: null,
    })

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: adminUser,
        error: null,
      }),
    })

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByLabelText('パスワード')
    const submitButton = screen.getByRole('button', { name: 'ログイン' })

    fireEvent.change(emailInput, { target: { value: adminUser.email } })
    fireEvent.change(passwordInput, { target: { value: 'adminpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should handle login error', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    })

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByLabelText('パスワード')
    const submitButton = screen.getByRole('button', { name: 'ログイン' })

    fireEvent.change(emailInput, { target: { value: 'invalid@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('ログインに失敗しました')).toBeInTheDocument()
    })
  })

  it('should validate email format', async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByLabelText('パスワード')
    const submitButton = screen.getByRole('button', { name: 'ログイン' })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('有効なメールアドレスを入力してください')).toBeInTheDocument()
    })
  })

  it('should validate required fields', async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const submitButton = screen.getByRole('button', { name: 'ログイン' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('メールアドレスを入力してください')).toBeInTheDocument()
      expect(screen.getByText('パスワードを入力してください')).toBeInTheDocument()
    })
  })

  it('should show loading state during login', async () => {
    let resolveLogin: (value: any) => void
    mockSupabaseClient.auth.signInWithPassword.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve
        })
    )

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByLabelText('パスワード')
    const submitButton = screen.getByRole('button', { name: 'ログイン' })

    fireEvent.change(emailInput, { target: { value: testUsers[0].email } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('ログイン中...')).toBeInTheDocument()
    })

    // Complete login
    resolveLogin({
      data: {
        user: testUsers[0],
        session: mockApiResponses.successfulAuth.session,
      },
      error: null,
    })
  })

  it('should navigate to register page', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const registerLink = screen.getByText('新規登録')
    fireEvent.click(registerLink)

    expect(mockRouter.push).toHaveBeenCalledWith('/auth/register')
  })

  it('should navigate to password reset page', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const resetLink = screen.getByText('パスワードを忘れた方はこちら')
    fireEvent.click(resetLink)

    expect(mockRouter.push).toHaveBeenCalledWith('/auth/reset-password')
  })

  it('should prevent multiple submissions', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: testUsers[0],
        session: mockApiResponses.successfulAuth.session,
      },
      error: null,
    })

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByLabelText('パスワード')
    const submitButton = screen.getByRole('button', { name: 'ログイン' })

    fireEvent.change(emailInput, { target: { value: testUsers[0].email } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    // Click multiple times
    fireEvent.click(submitButton)
    fireEvent.click(submitButton)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledTimes(1)
    })
  })
})