import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'
import DownloadButton from '@/components/admin/DownloadButton'
import { getStatusLabel, getStatusColor } from '@/lib/status-labels'


export default async function PreliminaryInfoListPage() {
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

  // 管理者クライアントで予選情報を取得
  const adminSupabase = createAdminClient()
  
  console.log('[PRELIMINARY DEBUG] === 予選情報一覧データ取得開始 ===')
  
  // 予選情報を取得
  const { data: preliminaryInfoList, error: preliminaryError } = await adminSupabase
    .from('preliminary_info')
    .select('*')
    .order('created_at', { ascending: false })

  console.log('[PRELIMINARY DEBUG] 予選情報取得完了')
  console.log('[PRELIMINARY DEBUG] 予選情報件数:', preliminaryInfoList?.length || 0)
  console.log('[PRELIMINARY DEBUG] 予選情報エラー:', preliminaryError)

  if (preliminaryError) {
    console.error('予選情報取得エラー:', preliminaryError)
    return <div>予選情報の取得に失敗しました</div>
  }

  // エントリー情報を取得
  const { data: entriesList, error: entriesError } = await adminSupabase
    .from('entries')
    .select('*')

  console.log('[PRELIMINARY DEBUG] エントリー情報取得完了')
  console.log('[PRELIMINARY DEBUG] エントリー件数:', entriesList?.length || 0)
  console.log('[PRELIMINARY DEBUG] エントリーエラー:', entriesError)

  // ユーザー情報を取得
  const { data: usersList, error: usersError } = await adminSupabase
    .from('users')
    .select('*')

  console.log('[PRELIMINARY DEBUG] ユーザー情報取得完了')
  console.log('[PRELIMINARY DEBUG] ユーザー件数:', usersList?.length || 0)
  console.log('[PRELIMINARY DEBUG] ユーザーエラー:', usersError)

  // ファイル情報を取得
  const { data: filesList, error: filesError } = await adminSupabase
    .from('entry_files')
    .select('*')

  console.log('[PRELIMINARY DEBUG] ファイル情報取得完了')
  console.log('[PRELIMINARY DEBUG] ファイル件数:', filesList?.length || 0)
  console.log('[PRELIMINARY DEBUG] ファイルエラー:', filesError)

  // 基本情報を取得（ダンスジャンル用）
  const { data: basicInfoList, error: basicInfoError } = await adminSupabase
    .from('basic_info')
    .select('*')

  console.log('[PRELIMINARY DEBUG] 基本情報取得完了')
  console.log('[PRELIMINARY DEBUG] 基本情報件数:', basicInfoList?.length || 0)
  console.log('[PRELIMINARY DEBUG] 基本情報エラー:', basicInfoError)

  // データをマッピング（全データを表示）
  const mappedPreliminaryInfoList = preliminaryInfoList?.map(preliminaryInfo => {
    const relatedEntry = entriesList?.find(entry => entry.id === preliminaryInfo.entry_id)
    const relatedUser = usersList?.find(user => user.id === relatedEntry?.user_id)
    const relatedFiles = filesList?.filter(file => file.entry_id === preliminaryInfo.entry_id)
    const relatedBasicInfo = basicInfoList?.find(basicInfo => basicInfo.entry_id === preliminaryInfo.entry_id)
    
    console.log(`[PRELIMINARY DEBUG] エントリーID ${preliminaryInfo.entry_id}:`, {
      hasEntry: !!relatedEntry,
      hasUser: !!relatedUser,
      fileCount: relatedFiles?.length || 0
    })
    
    return {
      ...preliminaryInfo,
      entries: relatedEntry ? {
        ...relatedEntry,
        users: relatedUser || { name: '不明なユーザー', email: '不明' }
      } : { 
        id: '', 
        participant_names: 'エントリー情報なし', 
        status: 'unknown',
        users: { name: '不明なユーザー', email: '不明' }
      },
      entry_files: relatedFiles || [],
      basic_info: relatedBasicInfo || null
    }
  })
  // ダンスジャンルでソート
  .sort((a, b) => {
    const genreA = a.basic_info?.dance_style || 'ZZZ' // 未設定は最後に
    const genreB = b.basic_info?.dance_style || 'ZZZ'
    return genreA.localeCompare(genreB, 'ja')
  }) || []

  console.log('[PRELIMINARY DEBUG] マッピング完了')
  console.log('[PRELIMINARY DEBUG] マッピング後データ件数:', mappedPreliminaryInfoList?.length || 0)
  console.log('[PRELIMINARY DEBUG] マッピング後データ:', JSON.stringify(mappedPreliminaryInfoList, null, 2))

  // コード値を名称に変換する関数
  const getMusicRightsLabel = (code: string) => {
    switch (code) {
      case 'A': return 'A.市販の楽曲を使用する'
      case 'B': return 'B.権利者から楽曲使用許諾を受けている楽曲を使用する'
      case 'C': return 'C.自作楽曲を使用する'
      default: return code || '未入力'
    }
  }

  const getMusicTypeLabel = (code: string) => {
    switch (code) {
      case 'cd': return 'CD楽曲'
      case 'download': return 'データダウンロード楽曲'
      case 'other': return 'その他（オリジナル曲）'
      default: return code || '未入力'
    }
  }

  // ファイルダウンロード用のパブリックURL生成
  const getFileUrl = (filePath: string) => {
    const { data } = adminSupabase.storage.from('files').getPublicUrl(filePath)
    return data.publicUrl
  }

  const getFileIcon = (fileType: string, fileName: string) => {
    if (fileType === 'video' || fileName.includes('.mp4') || fileName.includes('.mov')) {
      return '🎬'
    } else if (fileType === 'music' || fileType === 'audio') {
      return '🎵'
    } else if (fileType === 'photo') {
      return '📸'
    } else if (fileType === 'pdf') {
      return '📄'
    }
    return '📎'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <AdminLink href="/admin/entries">
          ← エントリー一覧に戻る
        </AdminLink>
        <div className="flex space-x-4">
          <DownloadButton
            data={mappedPreliminaryInfoList.map(item => [
              item.id,
              item.entry_id,
              item.entries?.users?.name || '不明なユーザー',
              item.basic_info?.dance_style || '未入力',
              item.work_title || '',
              item.work_title_kana || '',
              item.work_story || '',
              item.music_title || '',
              item.artist || '',
              item.cd_title || '',
              item.jasrac_code || '',
              getMusicRightsLabel(item.music_rights_cleared || ''),
              item.record_number || '',
              getMusicTypeLabel(item.music_type || ''),
              item.choreographer1_name || '',
              item.choreographer1_furigana || '',
              item.choreographer2_name || '',
              item.choreographer2_furigana || '',
              getStatusLabel(item.entries?.status)
            ])}
            headers={['ID', 'エントリーID', 'システム利用者名', 'ダンスジャンル', '作品タイトル', '作品タイトルカナ', '作品ストーリー', '楽曲タイトル', 'アーティスト', 'CDタイトル', 'JASRAC作品コード', '楽曲著作権許諾', 'レコード番号', '楽曲種類', '振付師1名前', '振付師1フリガナ', '振付師2名前', '振付師2フリガナ', '選考ステータス']}
            filename="preliminary_info"
          />
        </div>
      </div>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">予選情報一覧</h1>
        <p className="text-gray-600">エントリーの予選情報をまとめて確認できます（{mappedPreliminaryInfoList?.length || 0}件）</p>
      </div>

      {mappedPreliminaryInfoList && mappedPreliminaryInfoList.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    システム利用者名
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ダンスジャンル
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作品情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    楽曲情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    振付師1
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    振付師2
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    その他詳細
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    予選提出動画
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    選考ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappedPreliminaryInfoList.map((preliminaryInfo) => (
                  <tr key={preliminaryInfo.id} className="hover:bg-gray-50">
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {preliminaryInfo.entries?.users?.name || '不明なユーザー'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {preliminaryInfo.entries?.participant_names || 'エントリー名なし'}
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {preliminaryInfo.basic_info?.dance_style || '未入力'}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">{preliminaryInfo.work_title || '未入力'}</div>
                        <div className="text-gray-500">{preliminaryInfo.work_title_kana || ''}</div>
                        <div className="text-gray-500 mt-1">
                          {preliminaryInfo.work_story ? 
                            `${preliminaryInfo.work_story.slice(0, 50)}${preliminaryInfo.work_story.length > 50 ? '...' : ''}` 
                            : '未入力'}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">使用楽曲タイトル: {preliminaryInfo.music_title || '未入力'}</div>
                        <div className="text-gray-500">アーティスト: {preliminaryInfo.artist || '未入力'}</div>
                        <div className="text-gray-500">収録アルバムタイトル: {preliminaryInfo.cd_title || '未入力'}</div>
                        <div className="text-gray-500">JASRAC: {preliminaryInfo.jasrac_code || '未入力'}</div>
                        <div className="text-gray-500">楽曲著作権許諾: {getMusicRightsLabel(preliminaryInfo.music_rights_cleared)}</div>
                        <div className="text-gray-500">レコード番号: {preliminaryInfo.record_number || '未入力'}</div>
                        <div className="text-gray-500">楽曲種類: {getMusicTypeLabel(preliminaryInfo.music_type)}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">{preliminaryInfo.choreographer1_name || '未入力'}</div>
                        <div className="text-gray-500">{preliminaryInfo.choreographer1_furigana || ''}</div>
                        {preliminaryInfo.choreographer1_copyright && (
                          <div className="text-gray-500 text-xs">著作権: {preliminaryInfo.choreographer1_copyright}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        {preliminaryInfo.choreographer2_name ? (
                          <>
                            <div className="font-medium">{preliminaryInfo.choreographer2_name}</div>
                            <div className="text-gray-500">{preliminaryInfo.choreographer2_furigana || ''}</div>
                            {preliminaryInfo.choreographer2_copyright && (
                              <div className="text-gray-500 text-xs">著作権: {preliminaryInfo.choreographer2_copyright}</div>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">未入力</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">作成日: {preliminaryInfo.created_at ? new Date(preliminaryInfo.created_at).toLocaleDateString('ja-JP') : '不明'}</div>
                        <div className="text-gray-500">更新日: {preliminaryInfo.updated_at ? new Date(preliminaryInfo.updated_at).toLocaleDateString('ja-JP') : '不明'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(preliminaryInfo.entry_files) && preliminaryInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) =>
                          file.purpose === 'preliminary' || file.purpose === 'preliminary_1' || file.purpose === 'preliminary_2' || file.purpose === 'preliminary_3'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }, index: number) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              {getFileIcon(file.file_type, file.file_name)}
                              {file.purpose === 'preliminary_1' || file.purpose === 'preliminary_2' || file.purpose === 'preliminary_3' ?
                                `動画${file.purpose.split('_')[1]}: ` : ''}
                              {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(preliminaryInfo.entry_files) || !preliminaryInfo.entry_files.some((file: { purpose?: string }) =>
                          file.purpose === 'preliminary' || file.purpose === 'preliminary_1' || file.purpose === 'preliminary_2' || file.purpose === 'preliminary_3'
                        )) && (
                          <span className="text-xs text-gray-400">ファイルなし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(preliminaryInfo.entries?.status)}`}>
                        {getStatusLabel(preliminaryInfo.entries?.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500">予選情報が登録されていません</div>
        </div>
      )}
    </div>
  )
}