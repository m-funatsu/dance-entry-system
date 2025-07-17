import { render, screen, fireEvent, waitFor } from '../utils/test-helpers'
import EntryForm from '@/app/dashboard/entry/EntryForm'
import { testUsers, testEntries, testFormData } from '../utils/test-data'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Mock dependencies
jest.mock('@/lib/supabase/client')
jest.mock('next/navigation')

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('EntryForm Component', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }

  const mockSupabaseClient = {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [] }),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'photos/test.jpg' } }),
        getPublicUrl: jest.fn().mockReturnValue({ 
          data: { publicUrl: 'https://example.com/photo.jpg' } 
        }),
      })),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabaseClient as any)
    mockUseRouter.mockReturnValue(mockRouter as any)
  })

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<EntryForm userId={testUsers[0].id} />)
      
      expect(screen.getByLabelText('ダンスジャンル *')).toBeInTheDocument()
      expect(screen.getByLabelText('ペア名 *')).toBeInTheDocument()
      expect(screen.getByLabelText('参加者名 *')).toBeInTheDocument()
      expect(screen.getByLabelText('電話番号 *')).toBeInTheDocument()
      expect(screen.getByLabelText('緊急連絡先 *')).toBeInTheDocument()
      expect(screen.getByLabelText('写真 *')).toBeInTheDocument()
    })

    it('should render with existing entry data', () => {
      const existingEntry = testEntries[0]
      
      render(<EntryForm userId={testUsers[0].id} existingEntry={existingEntry} />)
      
      expect(screen.getByDisplayValue(existingEntry.dance_style)).toBeInTheDocument()
      expect(screen.getByDisplayValue(existingEntry.team_name || '')).toBeInTheDocument()
      expect(screen.getByDisplayValue(existingEntry.participant_names)).toBeInTheDocument()
      expect(screen.getByDisplayValue(existingEntry.phone_number || '')).toBeInTheDocument()
      expect(screen.getByDisplayValue(existingEntry.emergency_contact || '')).toBeInTheDocument()
    })

    it('should show photo preview when photo_url exists', () => {
      const existingEntry = {
        ...testEntries[0],
        photo_url: 'https://example.com/photo.jpg',
      }
      
      render(<EntryForm userId={testUsers[0].id} existingEntry={existingEntry} />)
      
      expect(screen.getByAltText('アップロード済み写真')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should have required fields marked as required', () => {
      render(<EntryForm userId={testUsers[0].id} />)
      
      expect(screen.getByLabelText('ダンスジャンル *')).toBeRequired()
      expect(screen.getByLabelText('ペア名 *')).toBeRequired()
      expect(screen.getByLabelText('参加者名 *')).toBeRequired()
      expect(screen.getByLabelText('電話番号 *')).toBeRequired()
      expect(screen.getByLabelText('緊急連絡先 *')).toBeRequired()
    })

    it('should show dance style options', () => {
      render(<EntryForm userId={testUsers[0].id} />)
      
      const danceStyleSelect = screen.getByLabelText('ダンスジャンル *')
      
      expect(danceStyleSelect).toContainHTML('<option value="社交ダンス">社交ダンス</option>')
      expect(danceStyleSelect).toContainHTML('<option value="バレエ・コンテンポラリーダンス">バレエ・コンテンポラリーダンス</option>')
      expect(danceStyleSelect).toContainHTML('<option value="ジャズダンス">ジャズダンス</option>')
      expect(danceStyleSelect).toContainHTML('<option value="ストリートダンス全般">ストリートダンス全般</option>')
    })
  })

  describe('Form Input Handling', () => {
    it('should update form data when inputs change', () => {
      render(<EntryForm userId={testUsers[0].id} />)
      
      const danceStyleSelect = screen.getByLabelText('ダンスジャンル *')
      const teamNameInput = screen.getByLabelText('ペア名 *')
      const participantNamesInput = screen.getByLabelText('参加者名 *')
      
      fireEvent.change(danceStyleSelect, { target: { value: 'ジャズダンス' } })
      fireEvent.change(teamNameInput, { target: { value: 'テストチーム' } })
      fireEvent.change(participantNamesInput, { target: { value: 'テスト太郎' } })
      
      expect(danceStyleSelect).toHaveValue('ジャズダンス')
      expect(teamNameInput).toHaveValue('テストチーム')
      expect(participantNamesInput).toHaveValue('テスト太郎')
    })

    it('should handle photo file selection', () => {
      render(<EntryForm userId={testUsers[0].id} />)
      
      const photoInput = screen.getByLabelText('写真 *')
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })
      
      fireEvent.change(photoInput, { target: { files: [file] } })
      
      expect(photoInput.files?.[0]).toBe(file)
    })
  })

  describe('Form Submission', () => {
    it('should create new entry when no existing entry', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [] }),
      })

      render(<EntryForm userId={testUsers[0].id} />)
      
      // Fill form
      fireEvent.change(screen.getByLabelText('ダンスジャンル *'), { 
        target: { value: testFormData.validEntry.dance_style } 
      })
      fireEvent.change(screen.getByLabelText('ペア名 *'), { 
        target: { value: testFormData.validEntry.team_name } 
      })
      fireEvent.change(screen.getByLabelText('参加者名 *'), { 
        target: { value: testFormData.validEntry.participant_names } 
      })
      fireEvent.change(screen.getByLabelText('電話番号 *'), { 
        target: { value: testFormData.validEntry.phone_number } 
      })
      fireEvent.change(screen.getByLabelText('緊急連絡先 *'), { 
        target: { value: testFormData.validEntry.emergency_contact } 
      })
      
      // Submit form
      fireEvent.click(screen.getByText('保存'))
      
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('entries')
      })
    })

    it('should update existing entry when entry exists', async () => {
      const existingEntry = testEntries[0]
      
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockResolvedValue({ data: null, error: null }),
        eq: jest.fn().mockReturnThis(),
      })

      render(<EntryForm userId={testUsers[0].id} existingEntry={existingEntry} />)
      
      // Submit form
      fireEvent.click(screen.getByText('保存'))
      
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('entries')
      })
    })

    it('should show loading state during submission', async () => {
      let resolvePromise: (value: any) => void
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockImplementation(() => new Promise(resolve => {
          resolvePromise = resolve
        })),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [] }),
      })

      render(<EntryForm userId={testUsers[0].id} />)
      
      // Fill required fields
      fireEvent.change(screen.getByLabelText('ダンスジャンル *'), { 
        target: { value: 'ジャズダンス' } 
      })
      fireEvent.change(screen.getByLabelText('ペア名 *'), { 
        target: { value: 'テストチーム' } 
      })
      fireEvent.change(screen.getByLabelText('参加者名 *'), { 
        target: { value: 'テスト太郎' } 
      })
      fireEvent.change(screen.getByLabelText('電話番号 *'), { 
        target: { value: '090-1234-5678' } 
      })
      fireEvent.change(screen.getByLabelText('緊急連絡先 *'), { 
        target: { value: 'テスト母 090-9876-5432' } 
      })
      
      // Submit form
      fireEvent.click(screen.getByText('保存'))
      
      expect(screen.getByText('保存中...')).toBeInTheDocument()
      
      // Complete the promise
      resolvePromise!({ data: null, error: null })
    })

    it('should handle photo upload during submission', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [] }),
      })

      render(<EntryForm userId={testUsers[0].id} />)
      
      // Fill form and add photo
      const photoInput = screen.getByLabelText('写真 *')
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })
      
      fireEvent.change(photoInput, { target: { files: [file] } })
      fireEvent.change(screen.getByLabelText('ダンスジャンル *'), { 
        target: { value: 'ジャズダンス' } 
      })
      fireEvent.change(screen.getByLabelText('ペア名 *'), { 
        target: { value: 'テストチーム' } 
      })
      fireEvent.change(screen.getByLabelText('参加者名 *'), { 
        target: { value: 'テスト太郎' } 
      })
      fireEvent.change(screen.getByLabelText('電話番号 *'), { 
        target: { value: '090-1234-5678' } 
      })
      fireEvent.change(screen.getByLabelText('緊急連絡先 *'), { 
        target: { value: 'テスト母 090-9876-5432' } 
      })
      
      // Submit form
      fireEvent.click(screen.getByText('保存'))
      
      await waitFor(() => {
        expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('entries')
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error when submission fails', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' } 
        }),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [] }),
      })

      render(<EntryForm userId={testUsers[0].id} />)
      
      // Fill and submit form
      fireEvent.change(screen.getByLabelText('ダンスジャンル *'), { 
        target: { value: 'ジャズダンス' } 
      })
      fireEvent.change(screen.getByLabelText('ペア名 *'), { 
        target: { value: 'テストチーム' } 
      })
      fireEvent.change(screen.getByLabelText('参加者名 *'), { 
        target: { value: 'テスト太郎' } 
      })
      fireEvent.change(screen.getByLabelText('電話番号 *'), { 
        target: { value: '090-1234-5678' } 
      })
      fireEvent.change(screen.getByLabelText('緊急連絡先 *'), { 
        target: { value: 'テスト母 090-9876-5432' } 
      })
      
      fireEvent.click(screen.getByText('保存'))
      
      await waitFor(() => {
        expect(screen.getByText('基本情報の登録に失敗しました')).toBeInTheDocument()
      })
    })

    it('should show error when entry already exists', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [{ id: 'existing-entry' }] }),
      })

      render(<EntryForm userId={testUsers[0].id} />)
      
      // Fill and submit form
      fireEvent.change(screen.getByLabelText('ダンスジャンル *'), { 
        target: { value: 'ジャズダンス' } 
      })
      fireEvent.change(screen.getByLabelText('ペア名 *'), { 
        target: { value: 'テストチーム' } 
      })
      fireEvent.change(screen.getByLabelText('参加者名 *'), { 
        target: { value: 'テスト太郎' } 
      })
      fireEvent.change(screen.getByLabelText('電話番号 *'), { 
        target: { value: '090-1234-5678' } 
      })
      fireEvent.change(screen.getByLabelText('緊急連絡先 *'), { 
        target: { value: 'テスト母 090-9876-5432' } 
      })
      
      fireEvent.click(screen.getByText('保存'))
      
      await waitFor(() => {
        expect(screen.getByText('既にエントリーが存在します。ページを再読み込みしてください。')).toBeInTheDocument()
      })
    })

    it('should handle photo upload failure', async () => {
      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: { message: 'Upload failed' } }),
      })

      render(<EntryForm userId={testUsers[0].id} />)
      
      // Add photo and fill form
      const photoInput = screen.getByLabelText('写真 *')
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })
      
      fireEvent.change(photoInput, { target: { files: [file] } })
      fireEvent.change(screen.getByLabelText('ダンスジャンル *'), { 
        target: { value: 'ジャズダンス' } 
      })
      fireEvent.change(screen.getByLabelText('ペア名 *'), { 
        target: { value: 'テストチーム' } 
      })
      fireEvent.change(screen.getByLabelText('参加者名 *'), { 
        target: { value: 'テスト太郎' } 
      })
      fireEvent.change(screen.getByLabelText('電話番号 *'), { 
        target: { value: '090-1234-5678' } 
      })
      fireEvent.change(screen.getByLabelText('緊急連絡先 *'), { 
        target: { value: 'テスト母 090-9876-5432' } 
      })
      
      fireEvent.click(screen.getByText('保存'))
      
      await waitFor(() => {
        expect(screen.getByText('写真のアップロードに失敗しました')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate to dashboard on cancel', () => {
      render(<EntryForm userId={testUsers[0].id} />)
      
      fireEvent.click(screen.getByText('キャンセル'))
      
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })

    it('should navigate to dashboard on successful submission', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [] }),
      })

      render(<EntryForm userId={testUsers[0].id} />)
      
      // Fill and submit form
      fireEvent.change(screen.getByLabelText('ダンスジャンル *'), { 
        target: { value: 'ジャズダンス' } 
      })
      fireEvent.change(screen.getByLabelText('ペア名 *'), { 
        target: { value: 'テストチーム' } 
      })
      fireEvent.change(screen.getByLabelText('参加者名 *'), { 
        target: { value: 'テスト太郎' } 
      })
      fireEvent.change(screen.getByLabelText('電話番号 *'), { 
        target: { value: '090-1234-5678' } 
      })
      fireEvent.change(screen.getByLabelText('緊急連絡先 *'), { 
        target: { value: 'テスト母 090-9876-5432' } 
      })
      
      fireEvent.click(screen.getByText('保存'))
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard?message=基本情報を保存しました')
      })
    })
  })
})