import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'

export default async function ProgramInfoListPage() {
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

  // 管理者クライアントでプログラム情報を取得
  const adminSupabase = createAdminClient()
  
  const { data: programInfoList, error } = await adminSupabase
    .from('program_info')
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
    console.error('プログラム情報取得エラー:', error)
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
          <h1 className="text-2xl font-bold text-gray-900">プログラム掲載用情報一覧</h1>
          <p className="text-gray-600">エントリーのプログラム掲載用情報をまとめて確認できます</p>
        </div>
        <AdminLink href="/admin/entries">
          エントリー一覧に戻る
        </AdminLink>
      </div>

      {programInfoList && programInfoList.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    エントリー名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    楽曲数
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    準決勝情報
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    決勝情報
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
                {programInfoList.map((programInfo) => (
                  <tr key={programInfo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {(programInfo.entries as Record<string, unknown> & { users?: { name?: string } })?.users?.name || '不明なユーザー'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(programInfo.entries as Record<string, unknown> & { participant_names?: string })?.participant_names || 'エントリー名なし'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{programInfo.song_count || '未選択'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="text-xs text-gray-500">ストーリー:</div>
                        <div className="text-xs">
                          {programInfo.semifinal_story ? 
                            `${programInfo.semifinal_story.slice(0, 30)}${programInfo.semifinal_story.length > 30 ? '...' : ''}` 
                            : '未入力'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">見所:</div>
                        <div className="text-xs">
                          {programInfo.semifinal_highlight ? 
                            `${programInfo.semifinal_highlight.slice(0, 30)}${programInfo.semifinal_highlight.length > 30 ? '...' : ''}` 
                            : '未入力'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {programInfo.song_count === '2曲' ? (
                          <>
                            <div className="text-xs text-gray-500">ストーリー:</div>
                            <div className="text-xs">
                              {programInfo.final_story ? 
                                `${programInfo.final_story.slice(0, 30)}${programInfo.final_story.length > 30 ? '...' : ''}` 
                                : '未入力'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">見所:</div>
                            <div className="text-xs">
                              {programInfo.final_highlight ? 
                                `${programInfo.final_highlight.slice(0, 30)}${programInfo.final_highlight.length > 30 ? '...' : ''}` 
                                : '未入力'}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">1曲のため不要</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {((programInfo.entry_files || []) as Array<{ id: string; file_name: string; file_path: string; file_type: string; purpose?: string }>)?.filter(file => 
                          file.purpose?.includes('program') || 
                          file.purpose?.includes('semifinal') || 
                          file.purpose?.includes('final')
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
                        {!((programInfo.entry_files || []) as Array<{ id: string; file_name: string; file_path: string; file_type: string; purpose?: string }>)?.some(file => 
                          file.purpose?.includes('program') || 
                          file.purpose?.includes('semifinal') || 
                          file.purpose?.includes('final')
                        ) && (
                          <span className="text-xs text-gray-400">ファイルなし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (programInfo.entries as Record<string, unknown> & { status?: string })?.status === 'selected' ? 'bg-green-100 text-green-800' :
                        (programInfo.entries as Record<string, unknown> & { status?: string })?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        (programInfo.entries as Record<string, unknown> & { status?: string })?.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(programInfo.entries as Record<string, unknown> & { status?: string })?.status === 'pending' && '審査待ち'}
                        {(programInfo.entries as Record<string, unknown> & { status?: string })?.status === 'submitted' && '提出済み'}
                        {(programInfo.entries as Record<string, unknown> & { status?: string })?.status === 'selected' && '選考通過'}
                        {(programInfo.entries as Record<string, unknown> & { status?: string })?.status === 'rejected' && '不選考'}
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
          <div className="text-gray-500">プログラム掲載用情報が登録されていません</div>
        </div>
      )}
    </div>
  )
}