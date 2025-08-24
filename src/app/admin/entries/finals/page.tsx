import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'

export default async function FinalsInfoListPage() {
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

  // 管理者クライアントで決勝情報を取得
  const adminSupabase = createAdminClient()
  
  const { data: finalsInfoList, error } = await adminSupabase
    .from('finals_info')
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

  if (error) {
    console.error('決勝情報取得エラー:', error)
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
          <h1 className="text-2xl font-bold text-gray-900">決勝情報一覧</h1>
          <p className="text-gray-600">エントリーの決勝情報をまとめて確認できます</p>
        </div>
        <AdminLink href="/admin/entries">
          エントリー一覧に戻る
        </AdminLink>
      </div>

      {finalsInfoList && finalsInfoList.length > 0 ? (
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
                    楽曲・音響情報
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
                {finalsInfoList.map((finalsInfo) => (
                  <tr key={finalsInfo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {(finalsInfo.entries as Record<string, unknown>)?.users?.name || '不明なユーザー'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(finalsInfo.entries as Record<string, unknown>)?.participant_names || 'エントリー名なし'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{finalsInfo.work_title || '未入力'}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {finalsInfo.work_character_story ? 
                            `${finalsInfo.work_character_story.slice(0, 50)}${finalsInfo.work_character_story.length > 50 ? '...' : ''}` 
                            : '未入力'}
                        </div>
                        <div className="text-xs text-gray-500">
                          小道具: {finalsInfo.props_usage || '未選択'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{finalsInfo.music_title || '未入力'}</div>
                        <div className="text-gray-500">{finalsInfo.artist || ''}</div>
                        <div className="text-xs text-gray-500">
                          楽曲変更: {finalsInfo.music_change ? 'あり' : 'なし'}
                        </div>
                        <div className="text-xs text-gray-500">
                          音響変更: {finalsInfo.sound_change_from_semifinals ? 'あり' : 'なし'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{finalsInfo.choreographer_name || '未入力'}</div>
                        <div className="text-gray-500">{finalsInfo.choreographer_furigana || ''}</div>
                        <div className="text-xs text-gray-500">
                          振付変更: {finalsInfo.choreographer_change ? 'あり' : 'なし'}
                        </div>
                        <div className="text-xs text-gray-500">
                          出席: {finalsInfo.choreographer_attendance || '未選択'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {(finalsInfo.entry_files as Record<string, unknown>[])?.filter(file => 
                          file.purpose?.includes('finals')
                        ).map((file: Record<string, unknown>) => (
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
                        {!(finalsInfo.entry_files as Record<string, unknown>[])?.some(file => file.purpose?.includes('finals')) && (
                          <span className="text-xs text-gray-400">ファイルなし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (finalsInfo.entries as Record<string, unknown>)?.status === 'selected' ? 'bg-green-100 text-green-800' :
                        (finalsInfo.entries as Record<string, unknown>)?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        (finalsInfo.entries as Record<string, unknown>)?.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(finalsInfo.entries as Record<string, unknown>)?.status === 'pending' && '審査待ち'}
                        {(finalsInfo.entries as Record<string, unknown>)?.status === 'submitted' && '提出済み'}
                        {(finalsInfo.entries as Record<string, unknown>)?.status === 'selected' && '選考通過'}
                        {(finalsInfo.entries as Record<string, unknown>)?.status === 'rejected' && '不選考'}
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
          <div className="text-gray-500">決勝情報が登録されていません</div>
        </div>
      )}
    </div>
  )
}