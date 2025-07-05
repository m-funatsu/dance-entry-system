import { redirect } from 'next/navigation'

export default function AdminRootPage() {
  // 管理者ルートページは自動的にダッシュボードにリダイレクト
  redirect('/admin/dashboard')
}