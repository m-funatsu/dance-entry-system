import { render, screen, fireEvent, waitFor } from '../utils/test-helpers'
import FileUpload from '@/components/FileUpload'
import { testUsers, testEntries, mockFiles } from '../utils/test-data'
import { uploadFile } from '@/lib/storage'
import { createClient } from '@/lib/supabase/client'

// Mock dependencies
jest.mock('@/lib/storage')
jest.mock('@/lib/supabase/client')

const mockUploadFile = uploadFile as jest.MockedFunction<typeof uploadFile>
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('FileUpload Component', () => {
  const defaultProps = {
    userId: testUsers[0].id,
    entryId: testEntries[0].id,
    fileType: 'music' as const,
    onUploadComplete: jest.fn(),
    onUploadError: jest.fn(),
  }

  const mockSupabaseClient = {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [] }),
    })),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabaseClient as any)
    mockUploadFile.mockResolvedValue({
      success: true,
      fileId: 'file-123',
      filePath: 'files/test.mp3',
    })
  })

  describe('Rendering', () => {
    it('should render file upload component with correct file type', async () => {
      render(<FileUpload {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('楽曲をアップロード')).toBeInTheDocument()
      })
    })

    it('should show loading state initially', () => {
      render(<FileUpload {...defaultProps} />)
      
      expect(screen.getByRole('generic')).toHaveClass('animate-pulse')
    })

    it('should render different file type labels', async () => {
      const { rerender } = render(<FileUpload {...defaultProps} fileType="video" />)
      
      await waitFor(() => {
        expect(screen.getByText('動画をアップロード')).toBeInTheDocument()
      })

      rerender(<FileUpload {...defaultProps} fileType="photo" />)
      await waitFor(() => {
        expect(screen.getByText('写真をアップロード')).toBeInTheDocument()
      })
    })

    it('should show correct accepted file types', async () => {
      render(<FileUpload {...defaultProps} fileType="music" />)
      
      await waitFor(() => {
        expect(screen.getByText('MP3, WAV, AAC形式 (最大100MB)')).toBeInTheDocument()
      })
    })
  })

  describe('File Selection', () => {
    it('should handle file selection via input', async () => {
      render(<FileUpload {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('楽曲をアップロード')).toBeInTheDocument()
      })

      const fileInput = screen.container?.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFiles.music] } })
      }

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalledWith({
          userId: defaultProps.userId,
          entryId: defaultProps.entryId,
          fileType: 'music',
          file: mockFiles.music,
        })
      })
    })

    it('should handle drag and drop', async () => {
      render(<FileUpload {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('楽曲をアップロード')).toBeInTheDocument()
      })

      const dropZone = screen.getByRole('generic')
      
      // Simulate drag over
      fireEvent.dragOver(dropZone, {
        dataTransfer: { files: [mockFiles.music] }
      })

      // Simulate drop
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [mockFiles.music] }
      })

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalledWith({
          userId: defaultProps.userId,
          entryId: defaultProps.entryId,
          fileType: 'music',
          file: mockFiles.music,
        })
      })
    })

    it('should show drag over state', async () => {
      render(<FileUpload {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('楽曲をアップロード')).toBeInTheDocument()
      })

      const dropZone = screen.getByRole('generic')
      
      fireEvent.dragOver(dropZone)
      
      expect(dropZone).toHaveClass('border-indigo-500', 'bg-indigo-50')
    })
  })

  describe('Upload Process', () => {
    it('should show upload progress', async () => {
      mockUploadFile.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve({
            success: true,
            fileId: 'file-123',
            filePath: 'files/test.mp3',
          }), 100)
        })
      )

      render(<FileUpload {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('楽曲をアップロード')).toBeInTheDocument()
      })

      const fileInput = screen.container?.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFiles.music] } })
      }

      await waitFor(() => {
        expect(screen.getByText(/アップロード中/)).toBeInTheDocument()
      })
    })

    it('should call onUploadComplete on success', async () => {
      render(<FileUpload {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('楽曲をアップロード')).toBeInTheDocument()
      })

      const fileInput = screen.container?.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFiles.music] } })
      }

      await waitFor(() => {
        expect(defaultProps.onUploadComplete).toHaveBeenCalledWith(
          'file-123',
          'files/test.mp3'
        )
      })
    })

    it('should handle upload error', async () => {
      mockUploadFile.mockResolvedValue({
        success: false,
        error: 'File too large',
      })

      render(<FileUpload {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('楽曲をアップロード')).toBeInTheDocument()
      })

      const fileInput = screen.container?.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFiles.music] } })
      }

      await waitFor(() => {
        expect(defaultProps.onUploadError).toHaveBeenCalledWith('File too large')
      })
    })
  })

  describe('Existing File Handling', () => {
    it('should check for existing files on mount', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [{ id: 'existing-file' }] }),
      })

      render(<FileUpload {...defaultProps} />)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('entry_files')
      })
    })

    it('should show warning when file already exists', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [{ id: 'existing-file' }] }),
      })

      render(<FileUpload {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/楽曲は1つまでしかアップロードできません/)).toBeInTheDocument()
      })
    })

    it('should disable upload when file already exists for single-file types', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [{ id: 'existing-file' }] }),
      })

      render(<FileUpload {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('アップロード済み')).toBeInTheDocument()
      })

      const dropZone = screen.container?.querySelector('.border-2')
      expect(dropZone).toHaveClass('cursor-not-allowed')
    })
  })

  describe('File Type Validation', () => {
    it('should accept correct file types', () => {
      const { container } = render(<FileUpload {...defaultProps} fileType="music" />)
      const fileInput = container.querySelector('input[type="file"]')
      
      expect(fileInput).toHaveAttribute('accept', '.mp3,.wav,.aac')
    })

    it('should show correct file size limits', async () => {
      const { rerender } = render(<FileUpload {...defaultProps} fileType="video" />)
      
      await waitFor(() => {
        expect(screen.getByText('MP4, MOV, AVI形式 (最大200MB)')).toBeInTheDocument()
      })

      rerender(<FileUpload {...defaultProps} fileType="photo" />)
      
      await waitFor(() => {
        expect(screen.getByText('JPG, PNG形式 (最大100MB)')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle upload exceptions', async () => {
      mockUploadFile.mockRejectedValue(new Error('Network error'))

      render(<FileUpload {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('楽曲をアップロード')).toBeInTheDocument()
      })

      const fileInput = screen.container?.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFiles.music] } })
      }

      await waitFor(() => {
        expect(defaultProps.onUploadError).toHaveBeenCalledWith('アップロードに失敗しました')
      })
    })

    it('should prevent multiple uploads during upload', async () => {
      let resolveUpload: (value: any) => void
      mockUploadFile.mockImplementation(() => 
        new Promise(resolve => {
          resolveUpload = resolve
        })
      )

      render(<FileUpload {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('楽曲をアップロード')).toBeInTheDocument()
      })

      const fileInput = screen.container?.querySelector('input[type="file"]') as HTMLInputElement
      
      // Start first upload
      fireEvent.change(fileInput, { target: { files: [mockFiles.music] } })
      
      // Try to start second upload
      fireEvent.change(fileInput, { target: { files: [mockFiles.music] } })

      // Should only call uploadFile once
      expect(mockUploadFile).toHaveBeenCalledTimes(1)

      // Complete the upload
      resolveUpload!({
        success: true,
        fileId: 'file-123',
        filePath: 'files/test.mp3',
      })
    })
  })
})