import { User, Entry, EntryFile, Selection } from '@/lib/types'

// Test Users
export const testUsers: User[] = [
  {
    id: 'user-1',
    email: 'participant1@example.com',
    name: '田中太郎',
    role: 'participant',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 'user-2',
    email: 'participant2@example.com',
    name: '佐藤花子',
    role: 'participant',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'システム管理者',
    role: 'admin',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
]

// Test Entries
export const testEntries: Entry[] = [
  {
    id: 'entry-1',
    user_id: 'user-1',
    dance_style: 'ヒップホップ',
    team_name: 'ダンスチーム東京',
    participant_names: '田中太郎, 鈴木次郎',
    phone_number: '090-1234-5678',
    emergency_contact: '田中母 090-9876-5432',
    photo_url: 'https://example.com/photo1.jpg',
    music_title: 'Beat It',
    choreographer: '田中太郎',
    story: '友情をテーマにした情熱的なダンス',
    status: 'submitted',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'entry-2',
    user_id: 'user-2',
    dance_style: 'ジャズ',
    participant_names: '佐藤花子',
    phone_number: '080-2345-6789',
    emergency_contact: '佐藤父 080-8765-4321',
    music_title: 'Fly Me to the Moon',
    choreographer: '佐藤花子',
    story: '月への憧れを表現したエレガントなダンス',
    status: 'pending',
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'entry-3',
    user_id: 'user-1',
    dance_style: 'ブレイクダンス',
    team_name: 'B-Boy Crew',
    participant_names: '田中太郎, 高橋三郎, 伊藤四郎',
    phone_number: '090-1234-5678',
    emergency_contact: '田中母 090-9876-5432',
    music_title: 'Apache',
    choreographer: '田中太郎',
    story: 'ストリートカルチャーの魂を込めたパフォーマンス',
    status: 'selected',
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z',
  },
]

// Test Entry Files
export const testEntryFiles: EntryFile[] = [
  {
    id: 'file-1',
    entry_id: 'entry-1',
    file_type: 'music',
    file_name: 'beat_it.mp3',
    file_path: 'files/entry-1/beat_it.mp3',
    file_size: 5242880, // 5MB
    mime_type: 'audio/mpeg',
    uploaded_at: '2024-01-15T11:00:00Z',
  },
  {
    id: 'file-2',
    entry_id: 'entry-1',
    file_type: 'video',
    file_name: 'dance_performance.mp4',
    file_path: 'files/entry-1/dance_performance.mp4',
    file_size: 52428800, // 50MB
    mime_type: 'video/mp4',
    uploaded_at: '2024-01-15T11:30:00Z',
  },
  {
    id: 'file-3',
    entry_id: 'entry-2',
    file_type: 'photo',
    file_name: 'team_photo.jpg',
    file_path: 'files/entry-2/team_photo.jpg',
    file_size: 1048576, // 1MB
    mime_type: 'image/jpeg',
    uploaded_at: '2024-01-16T11:00:00Z',
  },
]

// Test Selections
export const testSelections: Selection[] = [
  {
    id: 'selection-1',
    entry_id: 'entry-3',
    admin_id: 'admin-1',
    score: 85,
    comments: '技術的に優れており、表現力も豊か',
    status: 'selected',
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
  },
  {
    id: 'selection-2',
    entry_id: 'entry-1',
    admin_id: 'admin-1',
    score: 75,
    comments: '良いパフォーマンスですが、さらなる練習が必要',
    status: 'pending',
    created_at: '2024-01-20T11:00:00Z',
    updated_at: '2024-01-20T11:00:00Z',
  },
]

// Mock file objects for testing
export const mockFiles = {
  music: new File(['mock music content'], 'test_music.mp3', { type: 'audio/mpeg' }),
  video: new File(['mock video content'], 'test_video.mp4', { type: 'video/mp4' }),
  photo: new File(['mock photo content'], 'test_photo.jpg', { type: 'image/jpeg' }),
}

// Test form data
export const testFormData = {
  validEntry: {
    dance_style: 'ヒップホップ',
    team_name: 'テストチーム',
    participant_names: 'テスト太郎, テスト花子',
    phone_number: '090-1234-5678',
    emergency_contact: 'テスト母 090-9876-5432',
    music_title: 'Test Song',
    choreographer: 'テスト太郎',
    story: 'テスト用のストーリー',
  },
  invalidEntry: {
    dance_style: '',
    participant_names: '',
    phone_number: 'invalid-phone',
    emergency_contact: '',
  },
}

// Test API responses
export const mockApiResponses = {
  successfulAuth: {
    user: testUsers[0],
    session: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
    },
  },
  authError: {
    error: {
      message: 'Invalid credentials',
      status: 401,
    },
  },
  entriesResponse: {
    data: testEntries,
    count: testEntries.length,
  },
  fileUploadSuccess: {
    data: {
      path: 'files/entry-1/test_file.mp3',
      id: 'file-upload-id',
      fullPath: 'files/entry-1/test_file.mp3',
    },
  },
  fileUploadError: {
    error: {
      message: 'File too large',
      statusCode: '413',
    },
  },
}

// Database mock helpers
export const createMockSupabaseClient = () => ({
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
    })),
  },
})

// Test utilities
export const createTestUser = (overrides: Partial<User> = {}): User => ({
  ...testUsers[0],
  ...overrides,
})

export const createTestEntry = (overrides: Partial<Entry> = {}): Entry => ({
  ...testEntries[0],
  ...overrides,
})

export const createTestFile = (overrides: Partial<EntryFile> = {}): EntryFile => ({
  ...testEntryFiles[0],
  ...overrides,
})

export const createTestSelection = (overrides: Partial<Selection> = {}): Selection => ({
  ...testSelections[0],
  ...overrides,
})