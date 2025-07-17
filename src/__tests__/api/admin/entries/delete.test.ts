import { NextRequest } from 'next/server'
import { DELETE } from '@/app/api/admin/entries/delete/route'
import { testEntries, testEntryFiles } from '../../../utils/test-data'

// Mock global Request for Node.js environment
global.Request = global.Request || class MockRequest {
  constructor(public url: string, public options?: any) {}
  json() { return Promise.resolve(this.options?.body ? JSON.parse(this.options.body) : {}) }
}

// Mock Supabase clients
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null,
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      }),
    })),
  })),
}))

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
    storage: {
      from: jest.fn(() => ({
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  })),
}))

describe('/api/admin/entries/delete', () => {
  const mockRequest = (body: any) => 
    new NextRequest('http://localhost:3000/api/admin/entries/delete', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

  describe('DELETE /api/admin/entries/delete', () => {
    it('should delete single entry', async () => {
      const requestBody = {
        entryIds: [testEntries[0].id],
      }

      const request = mockRequest(requestBody)
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
    })

    it('should delete multiple entries', async () => {
      const requestBody = {
        entryIds: [testEntries[0].id, testEntries[1].id],
      }

      const request = mockRequest(requestBody)
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
    })

    it('should handle empty entry IDs', async () => {
      const requestBody = {
        entryIds: [],
      }

      const request = mockRequest(requestBody)
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'No entries selected' })
    })

    it('should handle missing request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/entries/delete', {
        method: 'POST',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid request body' })
    })

    it('should delete associated files', async () => {
      const { createAdminClient } = require('@/lib/supabase/admin')
      const mockClient = createAdminClient()
      
      // Mock finding associated files
      const mockFilesQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ 
          data: [testEntryFiles[0]], 
          error: null 
        }),
      }

      mockClient.from.mockImplementation((table: string) => {
        if (table === 'entry_files') {
          return mockFilesQuery
        }
        return {
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({ data: [], error: null }),
        }
      })

      const requestBody = {
        entryIds: [testEntries[0].id],
      }

      const request = mockRequest(requestBody)
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
      expect(mockClient.storage.from).toHaveBeenCalledWith('files')
    })

    it('should handle database errors', async () => {
      const { createAdminClient } = require('@/lib/supabase/admin')
      const mockClient = createAdminClient()
      
      mockClient.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' } 
        }),
      })

      const requestBody = {
        entryIds: [testEntries[0].id],
      }

      const request = mockRequest(requestBody)
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to delete entries' })
    })

    it('should handle storage errors gracefully', async () => {
      const { createAdminClient } = require('@/lib/supabase/admin')
      const mockClient = createAdminClient()
      
      // Mock successful file query but failed storage deletion
      mockClient.from.mockImplementation((table: string) => {
        if (table === 'entry_files') {
          return {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({ 
              data: [testEntryFiles[0]], 
              error: null 
            }),
          }
        }
        return {
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({ data: [], error: null }),
        }
      })

      mockClient.storage.from.mockReturnValue({
        remove: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Storage error' } 
        }),
      })

      const requestBody = {
        entryIds: [testEntries[0].id],
      }

      const request = mockRequest(requestBody)
      const response = await DELETE(request)
      const data = await response.json()

      // Should still succeed even if storage deletion fails
      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
    })

    it('should handle invalid entry IDs', async () => {
      const requestBody = {
        entryIds: ['invalid-id'],
      }

      const request = mockRequest(requestBody)
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
    })

    it('should handle large number of entries', async () => {
      const manyEntryIds = Array.from({ length: 100 }, (_, i) => `entry-${i}`)
      
      const requestBody = {
        entryIds: manyEntryIds,
      }

      const request = mockRequest(requestBody)
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
    })
  })
})