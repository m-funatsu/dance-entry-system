import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'

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
  
  const { data: preliminaryInfoList, error } = await adminSupabase
    .from('preliminary_info')
    .select(`
      *,
      entries!inner (
        id,
        participant_names,
        status,
        user_id,
        users (
          name,
          email
        )
      ),
      entry_files (
        id,
        file_type,
        file_name,
        file_path,
        purpose
      )
    `)
    .order('created_at', { ascending: false })

  console.log('[PRELIMINARY DEBUG] クエリ実行完了')
  console.log('[PRELIMINARY DEBUG] データ件数:', preliminaryInfoList?.length || 0)
  console.log('[PRELIMINARY DEBUG] エラー:', error)
  console.log('[PRELIMINARY DEBUG] 取得データ:', JSON.stringify(preliminaryInfoList, null, 2))

  if (error) {
    console.error('予選情報取得エラー:', error)
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">予選情報一覧</h1>
          <p className="text-gray-600">エントリーの予選情報をまとめて確認できます</p>
        </div>
        <AdminLink href="/admin/entries">
          エントリー一覧に戻る
        </AdminLink>
      </div>

      {preliminaryInfoList && preliminaryInfoList.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    エントリー名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作品情報
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    楽曲情報
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    振付師情報
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ファイル
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preliminaryInfoList.map((preliminaryInfo) => (
                  <tr key={preliminaryInfo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {(preliminaryInfo.entries as Record<string, unknown> & { users?: { name?: string } })?.users?.name || '不明なユーザー'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(preliminaryInfo.entries as Record<string, unknown> & { participant_names?: string })?.participant_names || 'エントリー名なし'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{preliminaryInfo.work_title || '未入力'}</div>
                        <div className="text-gray-500">{preliminaryInfo.work_title_kana || ''}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {preliminaryInfo.work_story ? 
                            `${preliminaryInfo.work_story.slice(0, 50)}${preliminaryInfo.work_story.length > 50 ? '...' : ''}` 
                            : '未入力'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{preliminaryInfo.music_title || '未入力'}</div>
                        <div className="text-gray-500">{preliminaryInfo.artist || ''}</div>
                        <div className="text-xs text-gray-500">{preliminaryInfo.cd_title || ''}</div>
                        <div className="text-xs text-gray-500">JASRAC: {preliminaryInfo.jasrac_code || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{preliminaryInfo.choreographer1_name || '未入力'}</div>
                        <div className="text-gray-500">{preliminaryInfo.choreographer1_furigana || ''}</div>
                        {preliminaryInfo.choreographer2_name && (
                          <>
                            <div className="font-medium mt-1">{preliminaryInfo.choreographer2_name}</div>
                            <div className="text-gray-500">{preliminaryInfo.choreographer2_furigana || ''}</div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {((preliminaryInfo.entry_files || []) as Array<{ id: string; file_name: string; file_path: string; file_type: string; purpose?: string }>)?.filter(file => 
                          file.purpose === 'preliminary'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              {getFileIcon(file.file_type, file.file_name)} {file.file_name}
                            </a>
                          </div>
                        ))}
                        {!((preliminaryInfo.entry_files || []) as Array<{ id: string; file_name: string; file_path: string; file_type: string; purpose?: string }>)?.some(file => file.purpose === 'preliminary') && (
                          <span className="text-xs text-gray-400">ファイルなし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (preliminaryInfo.entries as Record<string, unknown> & { status?: string })?.status === 'selected' ? 'bg-green-100 text-green-800' :
                        (preliminaryInfo.entries as Record<string, unknown> & { status?: string })?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        (preliminaryInfo.entries as Record<string, unknown> & { status?: string })?.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(preliminaryInfo.entries as Record<string, unknown> & { status?: string })?.status === 'pending' && '審査待ち'}
                        {(preliminaryInfo.entries as Record<string, unknown> & { status?: string })?.status === 'submitted' && '提出済み'}
                        {(preliminaryInfo.entries as Record<string, unknown> & { status?: string })?.status === 'selected' && '選考通過'}
                        {(preliminaryInfo.entries as Record<string, unknown> & { status?: string })?.status === 'rejected' && '不選考'}
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