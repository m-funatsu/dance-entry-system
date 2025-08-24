import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'

export default async function SemifinalsInfoListPage() {
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

  // 管理者クライアントで準決勝情報を取得
  const adminSupabase = createAdminClient()
  
  const { data: semifinalsInfoList, error } = await adminSupabase
    .from('semifinals_info')
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
    console.error('準決勝情報取得エラー:', error)
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
          <h1 className="text-2xl font-bold text-gray-900">準決勝情報一覧</h1>
          <p className="text-gray-600">エントリーの準決勝情報をまとめて確認できます</p>
        </div>
        <AdminLink href="/admin/entries">
          エントリー一覧に戻る
        </AdminLink>
      </div>

      {semifinalsInfoList && semifinalsInfoList.length > 0 ? (
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
                    振付師・銀行情報
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
                {semifinalsInfoList.map((semifinalsInfo) => (
                  <tr key={semifinalsInfo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {(semifinalsInfo.entries as Record<string, unknown>)?.users?.name || '不明なユーザー'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(semifinalsInfo.entries as Record<string, unknown>)?.participant_names || 'エントリー名なし'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{semifinalsInfo.work_title || '未入力'}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {semifinalsInfo.work_character_story ? 
                            `${semifinalsInfo.work_character_story.slice(0, 50)}${semifinalsInfo.work_character_story.length > 50 ? '...' : ''}` 
                            : '未入力'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{semifinalsInfo.music_title || '未入力'}</div>
                        <div className="text-gray-500">{semifinalsInfo.artist || ''}</div>
                        <div className="text-xs text-gray-500">
                          {semifinalsInfo.music_type || ''} | JASRAC: {semifinalsInfo.jasrac_code || '未入力'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{semifinalsInfo.choreographer_name || '未入力'}</div>
                        <div className="text-gray-500">{semifinalsInfo.choreographer_furigana || ''}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {semifinalsInfo.bank_name ? 
                            `${semifinalsInfo.bank_name} ${semifinalsInfo.branch_name || ''}`
                            : '銀行情報未入力'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {(semifinalsInfo.entry_files as Record<string, unknown>[])?.filter(file => 
                          file.purpose?.includes('semifinals')
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
                        {!(semifinalsInfo.entry_files as Record<string, unknown>[])?.some(file => file.purpose?.includes('semifinals')) && (
                          <span className="text-xs text-gray-400">ファイルなし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (semifinalsInfo.entries as Record<string, unknown>)?.status === 'selected' ? 'bg-green-100 text-green-800' :
                        (semifinalsInfo.entries as Record<string, unknown>)?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        (semifinalsInfo.entries as Record<string, unknown>)?.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(semifinalsInfo.entries as Record<string, unknown>)?.status === 'pending' && '審査待ち'}
                        {(semifinalsInfo.entries as Record<string, unknown>)?.status === 'submitted' && '提出済み'}
                        {(semifinalsInfo.entries as Record<string, unknown>)?.status === 'selected' && '選考通過'}
                        {(semifinalsInfo.entries as Record<string, unknown>)?.status === 'rejected' && '不選考'}
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
          <div className="text-gray-500">準決勝情報が登録されていません</div>
        </div>
      )}
    </div>
  )
}