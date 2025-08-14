import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EntryDetail from './EntryDetail'
import type { EntryFile } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EntryDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  console.log('[DEBUG] EntryDetailPage - Entry ID:', resolvedParams.id)
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!userProfile || userProfile.role !== 'admin') {
    redirect('/dashboard')
  }

  // 管理者クライアントでエントリーデータを取得
  const adminSupabase = createAdminClient()
  const { data: entry, error: entryError } = await adminSupabase
    .from('entries')
    .select(`
      *,
      users(name, email),
      entry_files(*),
      selections(*, users!selections_admin_id_fkey(name)),
      basic_info(*),
      preliminary_info(*),
      program_info(*),
      semifinals_info(*),
      finals_info(*),
      applications_info(*),
      sns_info(*)
    `)
    .eq('id', resolvedParams.id)
    .single()

  console.log('[DEBUG] Entry fetch error:', entryError)
  console.log('[DEBUG] Entry data:', {
    id: entry?.id,
    hasUsers: !!entry?.users,
    entryFilesCount: entry?.entry_files?.length || 0,
    hasBasicInfo: !!entry?.basic_info,
    hasPreliminaryInfo: !!entry?.preliminary_info,
    hasProgramInfo: !!entry?.program_info,
    hasSemifinalsInfo: !!entry?.semifinals_info,
    hasFinalsInfo: !!entry?.finals_info,
    hasApplicationsInfo: !!entry?.applications_info,
    hasSnsInfo: !!entry?.sns_info
  })
  
  if (entry?.sns_info) {
    console.log('[DEBUG] SNS Info details:', entry.sns_info)
  }
  if (entry?.semifinals_info) {
    console.log('[DEBUG] Semifinals Info details:', entry.semifinals_info)
  }
  if (entry?.entry_files && entry.entry_files.length > 0) {
    console.log('[DEBUG] Entry files:', entry.entry_files.map((f: EntryFile) => ({
      name: f.file_name,
      type: f.file_type,
      purpose: f.purpose,
      path: f.file_path
    })))
  }

  if (!entry) {
    notFound()
  }

  // 管理者クライアントを使用してもユーザー情報が取得できない場合のフォールバック
  if (!entry.users && entry.user_id) {
    const { data: userData } = await adminSupabase
      .from('users')
      .select('name, email')
      .eq('id', entry.user_id)
      .single()
    
    entry.users = userData ? {
      name: userData.name || '不明なユーザー',
      email: userData.email || 'メールアドレス不明'
    } : {
      name: '不明なユーザー',
      email: 'メールアドレス不明'
    }
  } else if (!entry.users) {
    entry.users = {
      name: '不明なユーザー',
      email: 'メールアドレス不明'
    }
  }

  // 署名付きURLを生成する関数
  const generateSignedUrl = async (path: string | null | undefined) => {
    if (!path) return null
    try {
      const { data } = await adminSupabase.storage
        .from('files')
        .createSignedUrl(path, 3600) // 1時間有効
      return data?.signedUrl || null
    } catch (error) {
      console.error('Error generating signed URL:', error)
      return null
    }
  }

  // メディアファイルの署名付きURLを生成
  const mediaUrls: Record<string, string | null> = {}

  // プログラム情報の画像
  if (entry.program_info?.[0] || entry.program_info) {
    const programInfo = Array.isArray(entry.program_info) ? entry.program_info[0] : entry.program_info
    if (programInfo) {
      mediaUrls.player_photo_path = await generateSignedUrl(programInfo.player_photo_path)
      mediaUrls.semifinal_image1_path = await generateSignedUrl(programInfo.semifinal_image1_path)
      mediaUrls.semifinal_image2_path = await generateSignedUrl(programInfo.semifinal_image2_path)
      mediaUrls.semifinal_image3_path = await generateSignedUrl(programInfo.semifinal_image3_path)
      mediaUrls.semifinal_image4_path = await generateSignedUrl(programInfo.semifinal_image4_path)
      mediaUrls.final_player_photo_path = await generateSignedUrl(programInfo.final_player_photo_path)
      mediaUrls.final_image1_path = await generateSignedUrl(programInfo.final_image1_path)
      mediaUrls.final_image2_path = await generateSignedUrl(programInfo.final_image2_path)
      mediaUrls.final_image3_path = await generateSignedUrl(programInfo.final_image3_path)
      mediaUrls.final_image4_path = await generateSignedUrl(programInfo.final_image4_path)
    }
  }

  // 準決勝情報のファイル
  if (entry.semifinals_info?.[0] || entry.semifinals_info) {
    const semifinalsInfo = Array.isArray(entry.semifinals_info) ? entry.semifinals_info[0] : entry.semifinals_info
    if (semifinalsInfo) {
      mediaUrls.semifinals_music_data_path = await generateSignedUrl(semifinalsInfo.music_data_path)
      mediaUrls.semifinals_chaser_song = await generateSignedUrl(semifinalsInfo.chaser_song)
      mediaUrls.scene1_image_path = await generateSignedUrl(semifinalsInfo.scene1_image_path)
      mediaUrls.scene2_image_path = await generateSignedUrl(semifinalsInfo.scene2_image_path)
      mediaUrls.scene3_image_path = await generateSignedUrl(semifinalsInfo.scene3_image_path)
      mediaUrls.scene4_image_path = await generateSignedUrl(semifinalsInfo.scene4_image_path)
      mediaUrls.scene5_image_path = await generateSignedUrl(semifinalsInfo.scene5_image_path)
      mediaUrls.chaser_exit_image_path = await generateSignedUrl(semifinalsInfo.chaser_exit_image_path)
    }
  }

  // 決勝情報のファイル
  if (entry.finals_info?.[0] || entry.finals_info) {
    const finalsInfo = Array.isArray(entry.finals_info) ? entry.finals_info[0] : entry.finals_info
    if (finalsInfo) {
      mediaUrls.finals_music_data_path = await generateSignedUrl(finalsInfo.music_data_path)
      mediaUrls.finals_chaser_song = await generateSignedUrl(finalsInfo.chaser_song)
      mediaUrls.finals_scene1_image_path = await generateSignedUrl(finalsInfo.scene1_image_path)
      mediaUrls.finals_scene2_image_path = await generateSignedUrl(finalsInfo.scene2_image_path)
      mediaUrls.finals_scene3_image_path = await generateSignedUrl(finalsInfo.scene3_image_path)
      mediaUrls.finals_scene4_image_path = await generateSignedUrl(finalsInfo.scene4_image_path)
      mediaUrls.finals_scene5_image_path = await generateSignedUrl(finalsInfo.scene5_image_path)
      mediaUrls.finals_chaser_exit_image_path = await generateSignedUrl(finalsInfo.chaser_exit_image_path)
      mediaUrls.choreographer_photo_path = await generateSignedUrl(finalsInfo.choreographer_photo_path)
    }
  }

  // 申込み情報のファイル
  if (entry.applications_info?.[0] || entry.applications_info) {
    const applicationsInfo = Array.isArray(entry.applications_info) ? entry.applications_info[0] : entry.applications_info
    if (applicationsInfo) {
      mediaUrls.payment_slip_path = await generateSignedUrl(applicationsInfo.payment_slip_path)
    }
  }

  // SNS情報のファイル
  console.log('[DEBUG] Processing SNS info...')
  if (entry.sns_info?.[0] || entry.sns_info) {
    const snsInfo = Array.isArray(entry.sns_info) ? entry.sns_info[0] : entry.sns_info
    console.log('[DEBUG] SNS Info object:', snsInfo)
    if (snsInfo) {
      console.log('[DEBUG] practice_video_path:', snsInfo.practice_video_path)
      console.log('[DEBUG] introduction_highlight_path:', snsInfo.introduction_highlight_path)
      
      mediaUrls.practice_video_path = await generateSignedUrl(snsInfo.practice_video_path)
      mediaUrls.introduction_highlight_path = await generateSignedUrl(snsInfo.introduction_highlight_path)
      
      console.log('[DEBUG] Generated practice_video URL:', mediaUrls.practice_video_path)
      console.log('[DEBUG] Generated introduction_highlight URL:', mediaUrls.introduction_highlight_path)
    }
  } else {
    console.log('[DEBUG] No SNS info found')
  }

  // entry_filesの署名付きURLも生成
  console.log('[DEBUG] Processing entry_files...')
  if (entry.entry_files && entry.entry_files.length > 0) {
    console.log('[DEBUG] Found', entry.entry_files.length, 'entry files')
    for (const file of entry.entry_files) {
      console.log('[DEBUG] Processing file:', {
        name: file.file_name,
        path: file.file_path,
        type: file.file_type,
        purpose: file.purpose
      })
      const signedUrl = await generateSignedUrl(file.file_path)
      if (signedUrl) {
        file.signed_url = signedUrl
        console.log('[DEBUG] Generated signed URL for', file.file_name)
      } else {
        console.log('[DEBUG] Failed to generate signed URL for', file.file_name)
      }
    }
  } else {
    console.log('[DEBUG] No entry files found')
  }

  console.log('[DEBUG] Final mediaUrls:', Object.keys(mediaUrls).filter(key => mediaUrls[key]))

  console.log('[DEBUG] Rendering with entry:', entry?.id, 'and mediaUrls count:', Object.keys(mediaUrls).filter(key => mediaUrls[key]).length)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin/entries" className="text-indigo-600 hover:text-indigo-900">
                ← エントリー一覧に戻る
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                エントリー詳細
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {userProfile.name}さん（管理者）
              </span>
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  ログアウト
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <EntryDetail entry={entry} mediaUrls={mediaUrls} />
        </div>
      </main>
    </div>
  )
}