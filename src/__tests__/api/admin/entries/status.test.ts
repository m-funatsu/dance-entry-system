import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/admin/entries/status/route'
import { testEntries, testUsers } from '../../../utils/test-data'

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
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}))

describe('/api/admin/entries/status', () => {
  const mockRequest = (body: any) => 
    new NextRequest('http://localhost:3000/api/admin/entries/status', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

  describe('PUT /api/admin/entries/status', () => {
    it('should update single entry status', async () => {
      const requestBody = {
        entryIds: [testEntries[0].id],
        status: 'selected',
      }

      const request = mockRequest(requestBody)
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
    })

    it('should update multiple entries status', async () => {
      const requestBody = {
        entryIds: [testEntries[0].id, testEntries[1].id],
        status: 'rejected',
      }

      const request = mockRequest(requestBody)
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
    })

    it('should handle invalid status', async () => {
      const requestBody = {
        entryIds: [testEntries[0].id],
        status: 'invalid_status',
      }

      const request = mockRequest(requestBody)
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid status' })
    })

    it('should handle empty entry IDs', async () => {
      const requestBody = {
        entryIds: [],
        status: 'selected',
      }

      const request = mockRequest(requestBody)
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'No entries selected' })
    })

    it('should handle missing request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/entries/status', {
        method: 'POST',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid request body' })
    })

    it('should handle database errors', async () => {
      const { createAdminClient } = require('@/lib/supabase/admin')
      const mockClient = createAdminClient()
      
      mockClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' } 
        }),
      })

      const requestBody = {
        entryIds: [testEntries[0].id],
        status: 'selected',
      }

      const request = mockRequest(requestBody)
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to update entries' })
    })

    it('should validate status values', async () => {
      const validStatuses = ['pending', 'submitted', 'selected', 'rejected']
      
      for (const status of validStatuses) {
        const requestBody = {
          entryIds: [testEntries[0].id],
          status,
        }

        const request = mockRequest(requestBody)
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual({ success: true })
      }
    })

    it('should handle large number of entries', async () => {
      const manyEntryIds = Array.from({ length: 100 }, (_, i) => `entry-${i}`)
      
      const requestBody = {
        entryIds: manyEntryIds,
        status: 'selected',
      }

      const request = mockRequest(requestBody)
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
    })
  })
})