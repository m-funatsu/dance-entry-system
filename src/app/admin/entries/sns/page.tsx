import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'
import DownloadButton from '@/components/admin/DownloadButton'

export default async function SnsInfoListPage() {
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

  // 管理者クライアントでSNS情報を取得
  const adminSupabase = createAdminClient()
  
  const { data: snsInfoList, error } = await adminSupabase
    .from('sns_info')
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
    console.error('SNS情報取得エラー:', error)
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
            data={(snsInfoList || []).map(item => [
              item.id,
              item.entry_id,
              ((item.entries as Record<string, unknown> & { users?: { name?: string } })?.users?.name || '不明なユーザー'),
              ((item.entries as Record<string, unknown> & { participant_names?: string })?.participant_names || 'エントリー名なし'),
              item.practice_video_path ? 'あり' : 'なし',
              item.introduction_highlight_path ? 'あり' : 'なし',
              item.sns_notes || '',
              ((item.entries as Record<string, unknown> & { status?: string })?.status || '')
            ])}
            headers={['ID', 'エントリーID', 'ユーザー名', 'エントリー名', '練習風景動画', '選手紹介動画', 'SNS備考', 'ステータス']}
            filename="sns_info"
          />
        </div>
      </div>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">SNS情報一覧</h1>
        <p className="text-gray-600">エントリーのSNS情報をまとめて確認できます（{snsInfoList?.length || 0}件）</p>
      </div>

      {snsInfoList && snsInfoList.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    エントリー名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    動画情報
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    備考
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
                {snsInfoList.map((snsInfo) => (
                  <tr key={snsInfo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {(snsInfo.entries as Record<string, unknown> & { users?: { name?: string } })?.users?.name || '不明なユーザー'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(snsInfo.entries as Record<string, unknown> & { participant_names?: string })?.participant_names || 'エントリー名なし'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="font-medium">練習風景:</span>
                            <span className={snsInfo.practice_video_path ? 'text-green-600' : 'text-red-600'}>
                              {snsInfo.practice_video_path ? ' ✓ あり' : ' ✗ なし'}
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="font-medium">選手紹介:</span>
                            <span className={snsInfo.introduction_highlight_path ? 'text-green-600' : 'text-red-600'}>
                              {snsInfo.introduction_highlight_path ? ' ✓ あり' : ' ✗ なし'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {snsInfo.sns_notes ? 
                          `${snsInfo.sns_notes.slice(0, 100)}${snsInfo.sns_notes.length > 100 ? '...' : ''}` 
                          : '備考なし'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {((snsInfo.entry_files || []) as Array<{ id: string; file_name: string; file_path: string; file_type: string; purpose?: string }>)?.filter(file => 
                          file.purpose?.includes('sns')
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
                        {!((snsInfo.entry_files || []) as Array<{ id: string; file_name: string; file_path: string; file_type: string; purpose?: string }>)?.some(file => file.purpose?.includes('sns')) && (
                          <span className="text-xs text-gray-400">ファイルなし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (snsInfo.entries as Record<string, unknown> & { status?: string })?.status === 'selected' ? 'bg-green-100 text-green-800' :
                        (snsInfo.entries as Record<string, unknown> & { status?: string })?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        (snsInfo.entries as Record<string, unknown> & { status?: string })?.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(snsInfo.entries as Record<string, unknown> & { status?: string })?.status === 'pending' && '審査待ち'}
                        {(snsInfo.entries as Record<string, unknown> & { status?: string })?.status === 'submitted' && '提出済み'}
                        {(snsInfo.entries as Record<string, unknown> & { status?: string })?.status === 'selected' && '選考通過'}
                        {(snsInfo.entries as Record<string, unknown> & { status?: string })?.status === 'rejected' && '不選考'}
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
          <div className="text-gray-500">SNS情報が登録されていません</div>
        </div>
      )}
    </div>
  )
}