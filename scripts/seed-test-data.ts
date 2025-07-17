#!/usr/bin/env tsx
/**
 * テストデータ投入スクリプト
 * 手動テスト用のリアルなデータを本番DB（またはテスト環境）に投入します
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/types'

// 環境変数確認
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('必要な環境変数: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// テストユーザーデータ
const testUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'test-participant1@example.com',
    name: '田中花音',
    role: 'participant' as const,
    has_seed: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'test-participant2@example.com', 
    name: '佐藤拓海',
    role: 'participant' as const,
    has_seed: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'test-participant3@example.com',
    name: '鈴木愛美',
    role: 'participant' as const,
    has_seed: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'test-admin@example.com',
    name: 'システム管理者',
    role: 'admin' as const,
    has_seed: true
  }
]

// テストエントリーデータ
const testEntries = [
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    dance_style: 'ジャズダンス',
    team_name: 'プリズムダンサーズ',
    participant_names: '田中花音\n山田麗華',
    phone_number: '090-1234-5678',
    emergency_contact: '田中母 090-9876-5432',
    music_title: 'Fly Me to the Moon',
    choreographer: '田中花音',
    story: '月への憧れと夢を表現した、エレガントで情熱的なジャズダンス。二人の息の合った動きで観客を魅了します。',
    status: 'submitted' as const
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    user_id: '550e8400-e29b-41d4-a716-446655440002',
    dance_style: 'ストリートダンス全般',
    team_name: 'ブレイク・マスターズ',
    participant_names: '佐藤拓海\n高橋健一\n田村誠',
    phone_number: '080-2345-6789',
    emergency_contact: '佐藤父 080-8765-4321',
    music_title: 'Apache (Incredible Bongo Band)',
    choreographer: '佐藤拓海',
    story: 'ストリートカルチャーの原点に立ち返り、3人のB-Boyが繰り出すパワフルなブレイクダンス。観客との一体感を重視したパフォーマンス。',
    status: 'selected' as const
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440003',
    user_id: '550e8400-e29b-41d4-a716-446655440003',
    dance_style: 'バレエ・コンテンポラリーダンス',
    team_name: '',
    participant_names: '鈴木愛美',
    phone_number: '070-3456-7890',
    emergency_contact: '鈴木母 070-6543-2109',
    music_title: 'Clair de Lune (Debussy)',
    choreographer: '鈴木愛美',
    story: 'ドビュッシーの月の光に込められた繊細な感情を、モダンバレエの技法で表現。静寂の中にある力強さを描きます。',
    status: 'pending' as const
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440004',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    dance_style: '社交ダンス',
    team_name: 'エレガント・カップル',
    participant_names: '田中花音\n中村大輔',
    phone_number: '090-1234-5678',
    emergency_contact: '田中母 090-9876-5432',
    music_title: 'Por Una Cabeza',
    choreographer: '中村大輔',
    story: 'アルゼンチンタンゴの情熱的なリズムに合わせて、愛と別れを表現した大人のダンス。衣装と音楽にもこだわった作品。',
    status: 'rejected' as const
  }
]

// テスト選考データ
const testSelections = [
  {
    id: '770e8400-e29b-41d4-a716-446655440001',
    entry_id: '660e8400-e29b-41d4-a716-446655440002',
    admin_id: '550e8400-e29b-41d4-a716-446655440004',
    score: 92,
    comments: '技術的に非常に優れており、観客との一体感も素晴らしい。ストリートダンスの本質を捉えた優秀な作品。',
    status: 'selected' as const
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440002',
    entry_id: '660e8400-e29b-41d4-a716-446655440001',
    admin_id: '550e8400-e29b-41d4-a716-446655440004',
    score: 78,
    comments: '美しい表現力と技術力。さらなる練習で上位入賞も期待できる。',
    status: 'pending' as const
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440003',
    entry_id: '660e8400-e29b-41d4-a716-446655440004',
    admin_id: '550e8400-e29b-41d4-a716-446655440004',
    score: 65,
    comments: '基本的な技術は身についているが、表現力とパートナーとの息の合わせ方に課題あり。',
    status: 'rejected' as const
  }
]

async function seedTestData() {
  try {
    console.log('🌱 テストデータの投入を開始します...')

    // 既存のテストデータを削除
    console.log('📋 既存のテストデータを確認・削除中...')
    
    await supabase.from('selections').delete().eq('admin_id', '550e8400-e29b-41d4-a716-446655440004')
    await supabase.from('entry_files').delete().in('entry_id', testEntries.map(e => e.id))
    await supabase.from('entries').delete().eq('has_seed', true)
    await supabase.from('users').delete().eq('has_seed', true)

    // ユーザーデータ投入
    console.log('👥 テストユーザーを作成中...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert(testUsers)
      .select()

    if (userError) {
      console.error('❌ ユーザー作成エラー:', userError)
      throw userError
    }

    console.log(`✅ ${userData.length} 人のテストユーザーを作成しました`)
    userData.forEach(user => {
      console.log(`   - ${user.name} (${user.role}): ${user.email}`)
    })

    // エントリーデータ投入
    console.log('\n🎭 テストエントリーを作成中...')
    const { data: entryData, error: entryError } = await supabase
      .from('entries')
      .insert(testEntries.map(entry => ({
        ...entry,
        has_seed: true
      })))
      .select()

    if (entryError) {
      console.error('❌ エントリー作成エラー:', entryError)
      throw entryError
    }

    console.log(`✅ ${entryData.length} 件のテストエントリーを作成しました`)
    entryData.forEach(entry => {
      console.log(`   - ${entry.team_name || entry.dance_style} (${entry.status})`)
    })

    // 選考データ投入
    console.log('\n📊 テスト選考データを作成中...')
    const { data: selectionData, error: selectionError } = await supabase
      .from('selections')
      .insert(testSelections)
      .select()

    if (selectionError) {
      console.error('❌ 選考データ作成エラー:', selectionError)
      throw selectionError
    }

    console.log(`✅ ${selectionData.length} 件の選考データを作成しました`)

    console.log('\n🎉 テストデータの投入が完了しました！')
    console.log('\n📋 作成されたテストアカウント:')
    console.log('┌─────────────────────────────────────────────────────────────┐')
    console.log('│ 参加者アカウント:                                            │')
    console.log('│   test-participant1@example.com (田中花音)                   │')
    console.log('│   test-participant2@example.com (佐藤拓海)                   │') 
    console.log('│   test-participant3@example.com (鈴木愛美)                   │')
    console.log('│                                                             │')
    console.log('│ 管理者アカウント:                                            │')
    console.log('│   test-admin@example.com (システム管理者)                    │')
    console.log('│                                                             │')
    console.log('│ パスワード: testpassword123 (Supabaseで設定)                │')
    console.log('└─────────────────────────────────────────────────────────────┘')

  } catch (error) {
    console.error('❌ テストデータ投入に失敗しました:', error)
    process.exit(1)
  }
}

async function cleanupTestData() {
  try {
    console.log('🧹 テストデータをクリーンアップ中...')
    
    await supabase.from('selections').delete().eq('admin_id', '550e8400-e29b-41d4-a716-446655440004')
    await supabase.from('entry_files').delete().in('entry_id', testEntries.map(e => e.id))
    await supabase.from('entries').delete().eq('has_seed', true)
    await supabase.from('users').delete().eq('has_seed', true)
    
    console.log('✅ テストデータのクリーンアップが完了しました')
  } catch (error) {
    console.error('❌ クリーンアップに失敗しました:', error)
  }
}

// コマンドライン引数を確認
const command = process.argv[2]

if (command === 'cleanup') {
  cleanupTestData()
} else {
  seedTestData()
}

export { testUsers, testEntries, testSelections }