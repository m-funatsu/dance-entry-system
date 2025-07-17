import '@testing-library/jest-dom'

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
  })),
}))

// Mock file operations
global.File = class MockFile {
  constructor(fileParts, fileName, options) {
    this.name = fileName
    this.size = options?.size || 0
    this.type = options?.type || ''
    this.lastModified = Date.now()
  }
}

global.FormData = class MockFormData {
  constructor() {
    this.data = new Map()
  }
  
  append(key, value) {
    this.data.set(key, value)
  }
  
  get(key) {
    return this.data.get(key)
  }
}

// Mock window.URL
global.URL = {
  createObjectURL: jest.fn(() => 'mock-url'),
  revokeObjectURL: jest.fn(),
}

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
})

// Mock fetch
global.fetch = jest.fn()

// Mock Web APIs for Node.js environment
global.Request = global.Request || class MockRequest {
  constructor(url, options = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this.headers = options.headers || {}
    this.body = options.body
  }
  
  async json() {
    return this.body ? JSON.parse(this.body) : {}
  }
}

global.Response = global.Response || class MockResponse {
  constructor(body, options = {}) {
    this.body = body
    this.status = options.status || 200
    this.headers = options.headers || {}
  }
  
  async json() {
    return this.body ? JSON.parse(this.body) : {}
  }
}

// Suppress console.warn for test runs
const originalWarn = console.warn
beforeAll(() => {
  console.warn = jest.fn()
})

afterAll(() => {
  console.warn = originalWarn
})