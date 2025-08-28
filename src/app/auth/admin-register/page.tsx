import { createAdminUser } from './actions'
import { ClientForm } from './client-form'

export default function AdminRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            管理者アカウント作成
          </h2>
          <p className="mt-2 text-center text-sm text-red-600">
            ⚠️ 開発用のページです。本番環境では削除してください。
          </p>
          <p className="mt-1 text-center text-xs text-gray-600">
            サーバーアクションを使用して安全に作成します。
          </p>
        </div>
        <ClientForm createAdminUser={createAdminUser} />
      </div>
    </div>
  )
}