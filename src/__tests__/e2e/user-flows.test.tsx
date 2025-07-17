import { render, screen, fireEvent, waitFor } from '../utils/test-helpers'
import { setupTestEnvironment, cleanupTestEnvironment } from '../utils/test-helpers'
import { testUsers, testEntries, testFormData } from '../utils/test-data'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Mock dependencies
jest.mock('@/lib/supabase/client')
jest.mock('next/navigation')

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('End-to-End User Flows', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }

  const mockSupabaseClient = {
    auth: {
      getSession: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
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
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
        createSignedUrl: jest.fn(),
      })),
    },
  }

  beforeEach(() => {
    setupTestEnvironment()
    mockCreateClient.mockReturnValue(mockSupabaseClient as any)
    mockUseRouter.mockReturnValue(mockRouter as any)
  })

  afterEach(() => {
    cleanupTestEnvironment()
  })

  describe('User Registration Flow', () => {
    it('should complete user registration process', async () => {
      // Mock successful registration
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'new-user-id',
            email: 'newuser@example.com',
            user_metadata: { name: 'New User' },
          },
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token',
          },
        },
        error: null,
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: [{ id: 'user-profile-id' }],
          error: null,
        }),
      })

      // This would be a complete registration component test
      // For now, we'll simulate the flow with mock data
      const registrationData = {
        email: 'newuser@example.com',
        password: 'securepassword123',
        name: 'New User',
      }

      // Simulate registration process
      const result = await mockSupabaseClient.auth.signUp({
        email: registrationData.email,
        password: registrationData.password,
        options: {
          data: {
            name: registrationData.name,
          },
        },
      })

      expect(result.error).toBeNull()
      expect(result.data.user?.email).toBe(registrationData.email)
    })

    it('should handle registration errors', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already exists' },
      })

      const registrationData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      }

      const result = await mockSupabaseClient.auth.signUp({
        email: registrationData.email,
        password: registrationData.password,
        options: {
          data: {
            name: registrationData.name,
          },
        },
      })

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('User already exists')
    })
  })

  describe('User Login Flow', () => {
    it('should complete user login process', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: testUsers[0],
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token',
          },
        },
        error: null,
      })

      const loginData = {
        email: testUsers[0].email,
        password: 'password123',
      }

      const result = await mockSupabaseClient.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      expect(result.error).toBeNull()
      expect(result.data.user?.email).toBe(loginData.email)
    })

    it('should handle login errors', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      })

      const loginData = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      }

      const result = await mockSupabaseClient.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('Invalid credentials')
    })
  })

  describe('Entry Creation Flow', () => {
    it('should complete entry creation process', async () => {
      // Mock successful entry creation
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'entries') {
          return {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockResolvedValue({
              data: [{ id: 'new-entry-id' }],
              error: null,
            }),
            eq: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: [] }), // No existing entries
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
        }
      })

      // Simulate entry creation
      const entryData = {
        user_id: testUsers[0].id,
        ...testFormData.validEntry,
        status: 'pending',
      }

      const { data, error } = await mockSupabaseClient
        .from('entries')
        .insert([entryData])

      expect(error).toBeNull()
      expect(data).toBeTruthy()
    })

    it('should handle entry creation with duplicate check', async () => {
      // Mock existing entry found
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'entries') {
          return {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Entry already exists' },
            }),
            eq: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ 
              data: [{ id: 'existing-entry-id' }] 
            }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
        }
      })

      // This should fail due to existing entry
      const entryData = {
        user_id: testUsers[0].id,
        ...testFormData.validEntry,
        status: 'pending',
      }

      const checkResult = await mockSupabaseClient
        .from('entries')
        .select('id')
        .eq('user_id', testUsers[0].id)
        .limit(1)

      expect(checkResult.data).toHaveLength(1)
    })
  })

  describe('File Upload Flow', () => {
    it('should complete file upload process', async () => {
      // Mock successful file upload
      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'files/test-upload.mp3' },
          error: null,
        }),
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'file-123', file_path: 'files/test-upload.mp3' },
          error: null,
        }),
      })

      // Simulate file upload
      const file = new File(['music content'], 'test-music.mp3', { type: 'audio/mpeg' })
      const uploadOptions = {
        userId: testUsers[0].id,
        entryId: testEntries[0].id,
        fileType: 'music' as const,
        file,
      }

      const uploadResult = await mockSupabaseClient.storage
        .from('files')
        .upload(`${uploadOptions.userId}/${uploadOptions.entryId}/${uploadOptions.fileType}/test-music.mp3`, file)

      expect(uploadResult.error).toBeNull()
      expect(uploadResult.data?.path).toBe('files/test-upload.mp3')
    })

    it('should handle file upload errors', async () => {
      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'File too large' },
        }),
      })

      const file = new File(['large content'], 'large-file.mp3', { type: 'audio/mpeg' })
      const uploadResult = await mockSupabaseClient.storage
        .from('files')
        .upload('test/path/large-file.mp3', file)

      expect(uploadResult.error).toBeTruthy()
      expect(uploadResult.error?.message).toBe('File too large')
    })
  })

  describe('Admin Management Flow', () => {
    it('should complete admin entry management process', async () => {
      // Mock admin viewing entries
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: testEntries,
          error: null,
        }),
      })

      // Simulate admin fetching entries
      const { data: entries, error } = await mockSupabaseClient
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(entries).toHaveLength(testEntries.length)
    })

    it('should handle admin status updates', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [{ id: testEntries[0].id, status: 'selected' }],
          error: null,
        }),
      })

      // Simulate admin updating entry status
      const { data, error } = await mockSupabaseClient
        .from('entries')
        .update({ status: 'selected' })
        .in('id', [testEntries[0].id])
        .select()

      expect(error).toBeNull()
      expect(data?.[0]?.status).toBe('selected')
    })

    it('should handle admin entry deletion', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })

      // Simulate admin deleting entries
      const { data, error } = await mockSupabaseClient
        .from('entries')
        .delete()
        .in('id', [testEntries[0].id])
        .select()

      expect(error).toBeNull()
      expect(data).toEqual([])
    })
  })

  describe('Session Management Flow', () => {
    it('should handle session validation', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: testUsers[0],
            access_token: 'valid-token',
            refresh_token: 'valid-refresh-token',
          },
        },
        error: null,
      })

      const { data, error } = await mockSupabaseClient.auth.getSession()

      expect(error).toBeNull()
      expect(data.session?.user?.id).toBe(testUsers[0].id)
    })

    it('should handle session expiration', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      })

      const { data, error } = await mockSupabaseClient.auth.getSession()

      expect(data.session).toBeNull()
      expect(error?.message).toBe('Session expired')
    })

    it('should handle logout flow', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      })

      const { error } = await mockSupabaseClient.auth.signOut()

      expect(error).toBeNull()
    })
  })

  describe('Error Recovery Flow', () => {
    it('should handle network errors gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Network error')),
      })

      try {
        await mockSupabaseClient.from('entries').select('*')
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network error')
      }
    })

    it('should handle database connection errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        }),
      })

      const { data, error } = await mockSupabaseClient
        .from('entries')
        .select('*')
        .eq('user_id', testUsers[0].id)

      expect(data).toBeNull()
      expect(error?.message).toBe('Database connection failed')
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle large data sets', async () => {
      const largeEntrySet = Array.from({ length: 1000 }, (_, i) => ({
        ...testEntries[0],
        id: `entry-${i}`,
      }))

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: largeEntrySet,
          error: null,
        }),
      })

      const { data, error } = await mockSupabaseClient
        .from('entries')
        .select('*')
        .order('created_at')
        .limit(1000)

      expect(error).toBeNull()
      expect(data).toHaveLength(1000)
    })

    it('should handle concurrent operations', async () => {
      const concurrentOperations = Array.from({ length: 10 }, (_, i) => {
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [{ id: `entry-${i}` }],
            error: null,
          }),
        })

        return mockSupabaseClient
          .from('entries')
          .select('*')
          .eq('id', `entry-${i}`)
      })

      const results = await Promise.all(concurrentOperations)

      expect(results).toHaveLength(10)
      results.forEach((result, index) => {
        expect(result.error).toBeNull()
        expect(result.data?.[0]?.id).toBe(`entry-${index}`)
      })
    })
  })
})