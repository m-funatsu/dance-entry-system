import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ToastProvider } from '@/contexts/ToastContext'

// Custom render function with providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export * from '@testing-library/user-event'

// Override render method
export { customRender as render }

// Common test utilities
export const waitForLoadingToFinish = async () => {
  return new Promise(resolve => setTimeout(resolve, 100))
}

export const createMockFile = (name: string, size: number = 1024, type: string = 'text/plain') => {
  const file = new File(['mock content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

export const createMockFileList = (files: File[]): FileList => {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    [Symbol.iterator]: function* () {
      for (const file of files) {
        yield file
      }
    },
  }
  
  files.forEach((file, index) => {
    fileList[index] = file
  })
  
  return fileList as FileList
}

export const mockNextRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
}

export const mockSupabaseAuth = {
  getSession: jest.fn(),
  signUp: jest.fn(),
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChange: jest.fn(),
}

export const mockSupabaseStorage = {
  from: jest.fn(() => ({
    upload: jest.fn(),
    download: jest.fn(),
    getPublicUrl: jest.fn(),
    remove: jest.fn(),
  })),
}

export const mockSupabaseDatabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  })),
}

// Mock environment variables
export const mockEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key',
}

// Setup and teardown helpers
export const setupTestEnvironment = () => {
  // Mock environment variables
  Object.entries(mockEnvVars).forEach(([key, value]) => {
    process.env[key] = value
  })
  
  // Mock fetch
  global.fetch = jest.fn()
  
  // Mock window methods
  Object.defineProperty(window, 'location', {
    value: { href: 'http://localhost:3000' },
    writable: true,
  })
}

export const cleanupTestEnvironment = () => {
  jest.clearAllMocks()
  jest.resetAllMocks()
}

// Basic test to satisfy Jest requirement
describe('Test helpers', () => {
  it('should export helper functions', () => {
    expect(customRender).toBeDefined()
    expect(waitForLoadingToFinish).toBeDefined()
    expect(createMockFile).toBeDefined()
    expect(createMockFileList).toBeDefined()
    expect(mockNextRouter).toBeDefined()
    expect(mockSupabaseAuth).toBeDefined()
    expect(mockSupabaseStorage).toBeDefined()
    expect(mockSupabaseDatabase).toBeDefined()
  })
})