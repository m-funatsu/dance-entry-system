import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const adminSupabase = createAdminClient()
    
    const { data: setting } = await adminSupabase
      .from('settings')
      .select('value')
      .eq('key', 'favicon_url')
      .maybeSingle()

    return NextResponse.json({ 
      favicon_url: setting?.value || null
    })
  } catch (error) {
    console.error('ファビコン取得エラー:', error)
    return NextResponse.json({ favicon_url: null })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 管理者権限チェック
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    // FormDataからファイルを取得
    const formData = await request.formData()
    const file = formData.get('favicon') as File

    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 })
    }

    // ファイル形式チェック
    const allowedTypes = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/ico']
    const isValidType = allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.ico')
    
    if (!isValidType) {
      return NextResponse.json({ error: 'ICOまたはPNG形式のファイルのみ許可されています' }, { status: 400 })
    }

    // ファイルサイズチェック（1MB以下）
    if (file.size > 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズは1MB以下にしてください' }, { status: 400 })
    }

    // ファイル名を生成（timestampを使用してユニークにする）
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'ico'
    const fileName = `favicon_${timestamp}.${fileExtension}`

    // Supabase Storageにアップロード
    const adminSupabase = createAdminClient()
    const { error: uploadError } = await adminSupabase.storage
      .from('files')
      .upload(`favicons/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      console.error('ファビコンアップロードエラー:', uploadError)
      return NextResponse.json({ error: 'ファイルのアップロードに失敗しました' }, { status: 500 })
    }

    // 公開URLを取得
    const { data: urlData } = adminSupabase.storage
      .from('files')
      .getPublicUrl(`favicons/${fileName}`)

    if (!urlData.publicUrl) {
      return NextResponse.json({ error: '公開URLの取得に失敗しました' }, { status: 500 })
    }

    // 設定にファビコンURLを保存
    const { error: settingsError } = await adminSupabase
      .from('settings')
      .upsert({
        key: 'favicon_url',
        value: urlData.publicUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      })

    if (settingsError) {
      console.error('設定保存エラー:', settingsError)
      // ファイルは既にアップロードされているので、設定の保存に失敗してもURLは返す
    }

    return NextResponse.json({ 
      success: true,
      url: urlData.publicUrl,
      message: 'ファビコンをアップロードしました'
    })
  } catch (error) {
    console.error('ファビコンアップロード API エラー:', error)
    return NextResponse.json(
      { error: 'システムエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 管理者権限チェック
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    // 現在のファビコンURLを取得
    const adminSupabase = createAdminClient()
    const { data: currentSetting } = await adminSupabase
      .from('settings')
      .select('value')
      .eq('key', 'favicon_url')
      .single()

    if (currentSetting?.value) {
      // ファイル名を抽出してStorageから削除
      const urlParts = currentSetting.value.split('/')
      const fileName = urlParts[urlParts.length - 1]
      
      if (fileName && fileName.startsWith('favicon_')) {
        await adminSupabase.storage
          .from('files')
          .remove([`favicons/${fileName}`])
      }
    }

    // 設定からファビコンURLを削除
    const { error } = await adminSupabase
      .from('settings')
      .delete()
      .eq('key', 'favicon_url')

    if (error) {
      console.error('ファビコン設定削除エラー:', error)
      return NextResponse.json({ error: 'ファビコンの削除に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'ファビコンを削除しました'
    })
  } catch (error) {
    console.error('ファビコン削除 API エラー:', error)
    return NextResponse.json(
      { error: 'システムエラーが発生しました' },
      { status: 500 }
    )
  }
}