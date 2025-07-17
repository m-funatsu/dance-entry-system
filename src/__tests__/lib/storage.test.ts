import { uploadFile, getFileUrl, deleteFile, formatFileSize, getFileIcon } from '@/lib/storage'
import { createClient } from '@/lib/supabase/client'
import { testUsers, testEntries, testEntryFiles, mockFiles } from '../utils/test-data'

// Mock Supabase client
jest.mock('@/lib/supabase/client')

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('Storage utility functions', () => {
  const mockSupabaseClient = {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        remove: jest.fn(),
        createSignedUrl: jest.fn(),
      })),
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabaseClient as any)
  })

  describe('uploadFile', () => {
    const validUploadOptions = {
      userId: testUsers[0].id,
      entryId: testEntries[0].id,
      fileType: 'music' as const,
      file: mockFiles.music,
    }

    it('should successfully upload a file', async () => {
      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test/path/file.mp3' },
          error: null,
        }),
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'file-123', file_path: 'test/path/file.mp3' },
          error: null,
        }),
      })

      const result = await uploadFile(validUploadOptions)

      expect(result).toEqual({
        success: true,
        fileId: 'file-123',
        filePath: 'test/path/file.mp3',
      })
    })

    it('should fail when no file is provided', async () => {
      const options = {
        ...validUploadOptions,
        file: null as any,
      }

      const result = await uploadFile(options)

      expect(result).toEqual({
        success: false,
        error: 'ファイルが選択されていません。ファイルを選択してからアップロードしてください。',
      })
    })

    it('should fail when file is too large', async () => {
      const largeFile = new File(['x'.repeat(300 * 1024 * 1024)], 'large.mp3', { type: 'audio/mpeg' })
      Object.defineProperty(largeFile, 'size', { value: 300 * 1024 * 1024 })

      const options = {
        ...validUploadOptions,
        file: largeFile,
      }

      const result = await uploadFile(options)

      expect(result).toEqual({
        success: false,
        error: 'ファイルサイズが100MBを超えています。ファイルサイズを確認してください。',
      })
    })

    it('should fail when file type is not allowed', async () => {
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' })

      const options = {
        ...validUploadOptions,
        file: invalidFile,
      }

      const result = await uploadFile(options)

      expect(result).toEqual({
        success: false,
        error: '許可されていないファイル形式です。対応形式をご確認ください。',
      })
    })

    it('should sanitize file names', async () => {
      const fileWithSpecialChars = new File(['content'], '日本語ファイル名!@#$%^&*().mp3', { type: 'audio/mpeg' })

      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockImplementation((filePath) => {
          // Check that the file path does not contain special characters
          expect(filePath).not.toContain('日本語')
          expect(filePath).not.toContain('!@#$%^&*()')
          // The sanitized name should end with .mp3
          expect(filePath).toContain('.mp3')
          return Promise.resolve({
            data: { path: filePath },
            error: null,
          })
        }),
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'file-123', file_path: 'test/path/file.mp3' },
          error: null,
        }),
      })

      const options = {
        ...validUploadOptions,
        file: fileWithSpecialChars,
      }

      await uploadFile(options)
    })

    it('should handle storage upload error', async () => {
      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage error' },
        }),
      })

      const result = await uploadFile(validUploadOptions)

      expect(result.success).toBe(false)
      expect(result.error).toContain('ファイルのアップロードに失敗しました')
    })

    it('should handle database insert error', async () => {
      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test/path/file.mp3' },
          error: null,
        }),
        remove: jest.fn().mockResolvedValue({ error: null }),
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      })

      const result = await uploadFile(validUploadOptions)

      expect(result).toEqual({
        success: false,
        error: 'ファイル情報の保存に失敗しました。しばらく時間をおいて再度お試しください。',
      })
    })

    it('should handle 413 error correctly', async () => {
      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: { statusCode: '413', message: 'Payload too large' },
        }),
      })

      const result = await uploadFile(validUploadOptions)

      expect(result.success).toBe(false)
      expect(result.error).toContain('ファイルサイズが大きすぎます')
    })

    it('should handle different file types correctly', async () => {
      const fileTypes = ['music', 'audio', 'photo', 'video'] as const
      const files = [mockFiles.music, mockFiles.music, mockFiles.photo, mockFiles.video]

      for (let i = 0; i < fileTypes.length; i++) {
        mockSupabaseClient.storage.from.mockReturnValue({
          upload: jest.fn().mockResolvedValue({
            data: { path: `test/path/file.${fileTypes[i]}` },
            error: null,
          }),
        })

        mockSupabaseClient.from.mockReturnValue({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'file-123', file_path: `test/path/file.${fileTypes[i]}` },
            error: null,
          }),
        })

        const options = {
          ...validUploadOptions,
          fileType: fileTypes[i],
          file: files[i],
        }

        const result = await uploadFile(options)
        expect(result.success).toBe(true)
      }
    })
  })

  describe('getFileUrl', () => {
    it('should return signed URL for valid file path', async () => {
      mockSupabaseClient.storage.from.mockReturnValue({
        createSignedUrl: jest.fn().mockResolvedValue({
          data: { signedUrl: 'https://example.com/signed-url' },
          error: null,
        }),
      })

      const result = await getFileUrl('test/path/file.mp3')

      expect(result).toBe('https://example.com/signed-url')
    })

    it('should return null when URL creation fails', async () => {
      mockSupabaseClient.storage.from.mockReturnValue({
        createSignedUrl: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'File not found' },
        }),
      })

      const result = await getFileUrl('test/path/nonexistent.mp3')

      expect(result).toBe(null)
    })

    it('should handle exceptions gracefully', async () => {
      mockSupabaseClient.storage.from.mockReturnValue({
        createSignedUrl: jest.fn().mockRejectedValue(new Error('Network error')),
      })

      const result = await getFileUrl('test/path/file.mp3')

      expect(result).toBe(null)
    })
  })

  describe('deleteFile', () => {
    it('should successfully delete a file', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        delete: jest.fn().mockResolvedValue({ error: null }),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { file_path: 'test/path/file.mp3' },
          error: null,
        }),
      })

      mockSupabaseClient.storage.from.mockReturnValue({
        remove: jest.fn().mockResolvedValue({ error: null }),
      })

      const result = await deleteFile('file-123')

      expect(result).toBe(true)
    })

    it('should return false when file not found', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'File not found' },
        }),
      })

      const result = await deleteFile('nonexistent-file')

      expect(result).toBe(false)
    })

    it('should handle storage delete error gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        delete: jest.fn().mockResolvedValue({ error: null }),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { file_path: 'test/path/file.mp3' },
          error: null,
        }),
      })

      mockSupabaseClient.storage.from.mockReturnValue({
        remove: jest.fn().mockResolvedValue({ error: { message: 'Storage error' } }),
      })

      const result = await deleteFile('file-123')

      expect(result).toBe(true) // Should still succeed even if storage deletion fails
    })

    it('should return false when database delete fails', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        delete: jest.fn().mockResolvedValue({ error: { message: 'Database error' } }),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { file_path: 'test/path/file.mp3' },
          error: null,
        }),
      })

      mockSupabaseClient.storage.from.mockReturnValue({
        remove: jest.fn().mockResolvedValue({ error: null }),
      })

      const result = await deleteFile('file-123')

      expect(result).toBe(false)
    })
  })

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(1048576 * 1.5)).toBe('1.5 MB')
    })

    it('should handle large file sizes', () => {
      expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatFileSize(1024 * 1024 * 500)).toBe('500 MB')
    })

    it('should handle small file sizes', () => {
      expect(formatFileSize(1)).toBe('1 Bytes')
      expect(formatFileSize(512)).toBe('512 Bytes')
      expect(formatFileSize(1023)).toBe('1023 Bytes')
    })
  })

  describe('getFileIcon', () => {
    it('should return correct icons for different file types', () => {
      expect(getFileIcon('music')).toBe('🎵')
      expect(getFileIcon('audio')).toBe('🎵')
      expect(getFileIcon('photo')).toBe('📷')
      expect(getFileIcon('video')).toBe('🎬')
      expect(getFileIcon('unknown')).toBe('📄')
    })

    it('should handle null and undefined input', () => {
      expect(getFileIcon('')).toBe('📄')
      expect(getFileIcon(null as any)).toBe('📄')
      expect(getFileIcon(undefined as any)).toBe('📄')
    })
  })
})