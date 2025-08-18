import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 公開ルートの定義
  const publicRoutes = [
    '/',
    '/login',
    '/auth/login',
    '/auth/register',
    '/auth/logout',
    '/auth/reset-password',
    '/auth/update-password',
    '/api/admin/favicon', // ファビコン取得は公開
    '/api/admin/background' // 背景画像取得は公開
  ]

  // 管理者専用ルート
  const adminRoutes = [
    '/admin',
    '/api/admin'
  ]

  // 公開ルートはスキップ
  if (publicRoutes.includes(pathname) || 
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/admin/favicon') ||
      pathname.startsWith('/api/admin/background')) {
    return supabaseResponse
  }

  // 認証チェック
  if (!user) {
    // APIルートの場合は401を返す
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }
    // 通常のページはログインページへリダイレクト
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // 管理者権限チェック
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    // ユーザー情報を取得して権限を確認
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      // APIルートの場合は403を返す
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: '管理者権限が必要です' },
          { status: 403 }
        )
      }
      // 通常のページはダッシュボードへリダイレクト
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}