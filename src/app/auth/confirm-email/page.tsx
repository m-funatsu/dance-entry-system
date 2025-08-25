'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ConfirmEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="mt-6 text-center font-extrabold leading-tight">
            <div style={{color: 'black', fontSize: '36px'}}>
              2025バルカーカップ
            </div>
          </h1>
          <p className="mt-2 text-center" style={{color: 'black', fontSize: '36px'}}>
            エントリーシステム
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              メールアドレスの確認
            </h2>
            
            <div className="space-y-4 text-left">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>登録が完了しました！</strong>
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  以下のメールアドレスに確認メールをお送りしました：
                </p>
                {email && (
                  <p className="text-sm font-medium text-blue-900 mt-1 break-words">
                    {email}
                  </p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800 font-medium">
                  📧 次の手順を実行してください：
                </p>
                <ol className="text-sm text-yellow-700 mt-2 space-y-1 list-decimal list-inside">
                  <li>メールボックスを確認してください</li>
                  <li>「2025バルカーカップエントリーシステム」からのメールを見つけてください</li>
                  <li>メール内の「アカウントを確認」ボタンをクリックしてください</li>
                  <li>確認完了後、ログインページでログインしてください</li>
                </ol>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <p className="text-xs text-gray-600">
                  <strong>メールが届かない場合：</strong><br />
                  • スパム・迷惑メールフォルダをご確認ください<br />
                  • 5-10分程度お待ちください<br />
                  • それでも届かない場合は、再度新規登録をお試しください
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/auth/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ログインページに戻る
              </Link>
              
              <Link
                href="/auth/register"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                新規登録に戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  )
}