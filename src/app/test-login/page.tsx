'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function TestLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')
  const supabase = createClient()

  const testLogin = async () => {
    setResult('テスト中...')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setResult(`エラー: ${error.message}`)
      } else {
        setResult(`成功: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (err) {
      setResult(`例外: ${err}`)
    }
  }

  const testConfig = () => {
    setResult(`
設定チェック:
URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}
Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}
    `)
  }

  const testProfile = async () => {
    setResult('プロフィールテスト中...')
    
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        setResult('ユーザーがログインしていません')
        return
      }

      // プロフィール確認
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        setResult(`プロフィール取得エラー: ${profileError.message}`)
        return
      }

      if (!profile) {
        // プロフィール作成
        const userName = user.user.user_metadata?.name || user.user.email?.split('@')[0] || 'ユーザー'
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: user.user.id,
              email: user.user.email,
              name: userName,
              role: 'participant',
            },
          ])
          .select()
          .single()

        if (insertError) {
          setResult(`プロフィール作成エラー: ${insertError.message}`)
        } else {
          setResult(`プロフィール作成成功: ${JSON.stringify(newProfile, null, 2)}`)
        }
      } else {
        setResult(`既存プロフィール: ${JSON.stringify(profile, null, 2)}`)
      }
    } catch (err) {
      setResult(`例外: ${err}`)
    }
  }

  const testEntry = async () => {
    setResult('エントリーテスト中...')
    
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        setResult('ユーザーがログインしていません')
        return
      }

      // テストエントリー作成
      const { data: entry, error: entryError } = await supabase
        .from('entries')
        .insert([
          {
            user_id: user.user.id,
            dance_style: 'hip-hop',
            team_name: 'テストチーム',
            participant_names: 'テスト参加者',
            phone_number: '090-1234-5678',
            emergency_contact: 'テスト緊急連絡先',
            status: 'pending',
          }
        ])
        .select()
        .single()

      if (entryError) {
        setResult(`エントリー作成エラー: ${entryError.message}\nCode: ${entryError.code}\nDetails: ${entryError.details}`)
      } else {
        setResult(`エントリー作成成功: ${JSON.stringify(entry, null, 2)}`)
      }
    } catch (err) {
      setResult(`例外: ${err}`)
    }
  }

  const checkExistingEntry = async () => {
    setResult('既存エントリー確認中...')
    
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        setResult('ユーザーがログインしていません')
        return
      }

      // 既存エントリーを確認
      const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.user.id)

      if (entriesError) {
        setResult(`エントリー取得エラー: ${entriesError.message}\nCode: ${entriesError.code}`)
      } else {
        setResult(`エントリー取得成功:\n件数: ${entries.length}\nデータ: ${JSON.stringify(entries, null, 2)}`)
      }
    } catch (err) {
      setResult(`例外: ${err}`)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Supabaseテスト</h1>
      
      <div className="space-y-4 mb-6">
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full p-2 border rounded"
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full p-2 border rounded"
        />
        <button
          onClick={testLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          ログインテスト
        </button>
        <button
          onClick={testConfig}
          className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
        >
          設定チェック
        </button>
        <button
          onClick={testProfile}
          className="bg-green-500 text-white px-4 py-2 rounded mr-2"
        >
          プロフィールテスト
        </button>
        <button
          onClick={testEntry}
          className="bg-purple-500 text-white px-4 py-2 rounded mr-2"
        >
          エントリーテスト
        </button>
        <button
          onClick={checkExistingEntry}
          className="bg-orange-500 text-white px-4 py-2 rounded"
        >
          既存エントリー確認
        </button>
      </div>

      <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
        {result}
      </pre>
    </div>
  )
}