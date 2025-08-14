'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDateLocale } from '@/lib/utils'
import FileList from '@/components/FileList'
import type { 
  Entry, 
  BasicInfo, 
  PreliminaryInfo, 
  ProgramInfo, 
  SemifinalsInfo, 
  FinalsInfo, 
  ApplicationsInfo,
  SnsInfo,
  EntryFile,
  Selection 
} from '@/lib/types'

interface ExtendedEntry extends Entry {
  team_name?: string
  emergency_contact?: string
  users: {
    name: string
    email: string
  }
  entry_files: EntryFile[]
  selections?: (Selection & {
    users?: {
      name: string
    }
  })[]
  basic_info?: BasicInfo | BasicInfo[]
  preliminary_info?: PreliminaryInfo | PreliminaryInfo[]
  program_info?: ProgramInfo | ProgramInfo[]
  semifinals_info?: SemifinalsInfo | SemifinalsInfo[]
  finals_info?: FinalsInfo | FinalsInfo[]
  applications_info?: ApplicationsInfo | ApplicationsInfo[]
  sns_info?: SnsInfo | SnsInfo[]
}

interface EntryDetailProps {
  entry: ExtendedEntry
}

export default function EntryDetail({ entry }: EntryDetailProps) {
  const [comments, setComments] = useState(entry.selections?.[0]?.comments || '')
  const [status, setStatus] = useState<'pending' | 'selected' | 'rejected'>(
    (entry.selections?.[0]?.status as 'pending' | 'selected' | 'rejected') || 'pending'
  )
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('basic')
  const router = useRouter()

  // 配列の場合は最初の要素を取得
  const basicInfo = Array.isArray(entry.basic_info) ? entry.basic_info[0] : entry.basic_info
  const preliminaryInfo = Array.isArray(entry.preliminary_info) ? entry.preliminary_info[0] : entry.preliminary_info
  const programInfo = Array.isArray(entry.program_info) ? entry.program_info[0] : entry.program_info
  const semifinalsInfo = Array.isArray(entry.semifinals_info) ? entry.semifinals_info[0] : entry.semifinals_info
  const finalsInfo = Array.isArray(entry.finals_info) ? entry.finals_info[0] : entry.finals_info
  const applicationsInfo = Array.isArray(entry.applications_info) ? entry.applications_info[0] : entry.applications_info

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            審査待ち
          </span>
        )
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            提出済み
          </span>
        )
      case 'selected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            選考通過
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            不選考
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            未設定
          </span>
        )
    }
  }

  const handleSaveSelection = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(`/api/admin/entries/${entry.id}/selection`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comments,
          status,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setMessage(errorData.error || '選考結果の保存に失敗しました')
        return
      }

      setMessage('選考結果を保存しました')
      // ページをリフレッシュして最新データを取得
      router.refresh()
    } catch (error) {
      console.error('Selection save error:', error)
      setMessage('選考結果の保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  参加者情報
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">参加者名</dt>
                    <dd className="mt-1 text-sm text-gray-900">{entry.users?.name || '不明なユーザー'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                    <dd className="mt-1 text-sm text-gray-900">{entry.users?.email || 'メールアドレス不明'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ダンスジャンル</dt>
                    <dd className="mt-1 text-sm text-gray-900">{entry.dance_style}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">チーム名</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {entry.team_name || '個人参加'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">電話番号</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {entry.phone_number || '未入力'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">緊急連絡先</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {entry.emergency_contact || '未入力'}
                    </dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">参加者詳細</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {entry.participant_names}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">エントリー日時</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDateLocale(entry.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">現在のステータス</dt>
                    <dd className="mt-1">{getStatusBadge(entry.status)}</dd>
                  </div>
                </div>
              </div>
            </div>

            {basicInfo && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    基本情報
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">代表者名</dt>
                      <dd className="mt-1 text-sm text-gray-900">{basicInfo.representative_name || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">代表者フリガナ</dt>
                      <dd className="mt-1 text-sm text-gray-900">{basicInfo.representative_furigana || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">代表者メール</dt>
                      <dd className="mt-1 text-sm text-gray-900">{basicInfo.representative_email || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">代表者生年月日</dt>
                      <dd className="mt-1 text-sm text-gray-900">{basicInfo.representative_birthdate || '-'}</dd>
                    </div>
                    {basicInfo.partner_name && (
                      <>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">パートナー名</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.partner_name}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">パートナーフリガナ</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.partner_furigana || '-'}</dd>
                        </div>
                      </>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">電話番号</dt>
                      <dd className="mt-1 text-sm text-gray-900">{basicInfo.phone_number || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">カテゴリー</dt>
                      <dd className="mt-1 text-sm text-gray-900">{basicInfo.category_division || '-'}</dd>
                    </div>
                    {basicInfo.emergency_contact_name_1 && (
                      <>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">緊急連絡先1</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.emergency_contact_name_1}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">緊急連絡先1電話</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.emergency_contact_phone_1}</dd>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 'preliminary':
        return (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                予選情報
              </h2>
              {preliminaryInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">作品タイトル</dt>
                    <dd className="mt-1 text-sm text-gray-900">{preliminaryInfo.work_title || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">作品タイトル（かな）</dt>
                    <dd className="mt-1 text-sm text-gray-900">{preliminaryInfo.work_title_kana || '-'}</dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">作品ストーリー</dt>
                    <dd className="mt-1 text-sm text-gray-900">{preliminaryInfo.work_story || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">楽曲タイトル</dt>
                    <dd className="mt-1 text-sm text-gray-900">{preliminaryInfo.music_title || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">CDタイトル</dt>
                    <dd className="mt-1 text-sm text-gray-900">{preliminaryInfo.cd_title || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">アーティスト</dt>
                    <dd className="mt-1 text-sm text-gray-900">{preliminaryInfo.artist || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">レコード番号</dt>
                    <dd className="mt-1 text-sm text-gray-900">{preliminaryInfo.record_number || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">JASRAC作品コード</dt>
                    <dd className="mt-1 text-sm text-gray-900">{preliminaryInfo.jasrac_code || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">楽曲種類</dt>
                    <dd className="mt-1 text-sm text-gray-900">{preliminaryInfo.music_type || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">著作権許諾</dt>
                    <dd className="mt-1 text-sm text-gray-900">{preliminaryInfo.music_rights_cleared || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">振付師1</dt>
                    <dd className="mt-1 text-sm text-gray-900">{preliminaryInfo.choreographer1_name || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">振付師2</dt>
                    <dd className="mt-1 text-sm text-gray-900">{preliminaryInfo.choreographer2_name || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">動画提出</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {preliminaryInfo.video_submitted ? '提出済み' : '未提出'}
                    </dd>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">予選情報はまだ登録されていません</p>
              )}
            </div>
          </div>
        )

      case 'program':
        return (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                プログラム情報
              </h2>
              {programInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">楽曲数</dt>
                    <dd className="mt-1 text-sm text-gray-900">{programInfo.song_count || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">所属</dt>
                    <dd className="mt-1 text-sm text-gray-900">{programInfo.affiliation || '-'}</dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">準決勝ストーリー</dt>
                    <dd className="mt-1 text-sm text-gray-900">{programInfo.semifinal_story || '-'}</dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">準決勝見所</dt>
                    <dd className="mt-1 text-sm text-gray-900">{programInfo.semifinal_highlight || '-'}</dd>
                  </div>
                  {programInfo.final_story && (
                    <>
                      <div className="md:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">決勝ストーリー</dt>
                        <dd className="mt-1 text-sm text-gray-900">{programInfo.final_story}</dd>
                      </div>
                      <div className="md:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">決勝見所</dt>
                        <dd className="mt-1 text-sm text-gray-900">{programInfo.final_highlight || '-'}</dd>
                      </div>
                    </>
                  )}
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">備考</dt>
                    <dd className="mt-1 text-sm text-gray-900">{programInfo.notes || '-'}</dd>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">プログラム情報はまだ登録されていません</p>
              )}
            </div>
          </div>
        )

      case 'semifinals':
        return (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                準決勝情報
              </h2>
              {semifinalsInfo ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">作品タイトル</dt>
                      <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.work_title || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">楽曲タイトル</dt>
                      <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.music_title || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">アーティスト</dt>
                      <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.artist || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">楽曲種類</dt>
                      <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.music_type || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">振付師</dt>
                      <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.choreographer_name || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">振付師2</dt>
                      <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.choreographer2_name || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">小道具</dt>
                      <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.props_usage || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">小道具詳細</dt>
                      <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.props_details || '-'}</dd>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-2">音響情報</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">音楽開始タイミング</dt>
                        <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.sound_start_timing || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">チェイサー曲指定</dt>
                        <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.chaser_song_designation || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">フェードアウト開始</dt>
                        <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.fade_out_start_time || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">フェードアウト完了</dt>
                        <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.fade_out_complete_time || '-'}</dd>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">準決勝情報はまだ登録されていません</p>
              )}
            </div>
          </div>
        )

      case 'finals':
        return (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                決勝情報
              </h2>
              {finalsInfo ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">作品タイトル</dt>
                      <dd className="mt-1 text-sm text-gray-900">{finalsInfo.work_title || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">楽曲タイトル</dt>
                      <dd className="mt-1 text-sm text-gray-900">{finalsInfo.music_title || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">アーティスト</dt>
                      <dd className="mt-1 text-sm text-gray-900">{finalsInfo.artist || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">楽曲種類</dt>
                      <dd className="mt-1 text-sm text-gray-900">{finalsInfo.music_type || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">楽曲変更</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {finalsInfo.music_change ? '変更あり' : '変更なし'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">振付師</dt>
                      <dd className="mt-1 text-sm text-gray-900">{finalsInfo.choreographer_name || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">振付師2</dt>
                      <dd className="mt-1 text-sm text-gray-900">{finalsInfo.choreographer2_name || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">小道具</dt>
                      <dd className="mt-1 text-sm text-gray-900">{finalsInfo.props_usage || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">小道具詳細</dt>
                      <dd className="mt-1 text-sm text-gray-900">{finalsInfo.props_details || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">振付師来場</dt>
                      <dd className="mt-1 text-sm text-gray-900">{finalsInfo.choreographer_attendance || '-'}</dd>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-2">音響情報</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">音響変更</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {finalsInfo.sound_change_from_semifinals ? '変更あり' : '変更なし'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">音楽開始タイミング</dt>
                        <dd className="mt-1 text-sm text-gray-900">{finalsInfo.sound_start_timing || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">チェイサー曲指定</dt>
                        <dd className="mt-1 text-sm text-gray-900">{finalsInfo.chaser_song_designation || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">照明変更</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {finalsInfo.lighting_change_from_semifinals ? '変更あり' : '変更なし'}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">決勝情報はまだ登録されていません</p>
              )}
            </div>
          </div>
        )

      case 'applications':
        return (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                申込み情報
              </h2>
              {applicationsInfo ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-2">関係者チケット</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">関係者チケット枚数</dt>
                        <dd className="mt-1 text-sm text-gray-900">{applicationsInfo.related_ticket_count || 0}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">合計金額</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {applicationsInfo.related_ticket_total_amount ? `¥${applicationsInfo.related_ticket_total_amount.toLocaleString()}` : '-'}
                        </dd>
                      </div>
                    </div>
                    {[1, 2, 3, 4, 5].map((num) => {
                      const nameKey = `related${num}_name` as keyof ApplicationsInfo
                      const relationKey = `related${num}_relationship` as keyof ApplicationsInfo
                      if (applicationsInfo[nameKey]) {
                        return (
                          <div key={num} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div>
                              <dt className="text-sm font-medium text-gray-500">関係者{num} 名前</dt>
                              <dd className="mt-1 text-sm text-gray-900">{applicationsInfo[nameKey] as string}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">関係者{num} 関係</dt>
                              <dd className="mt-1 text-sm text-gray-900">{applicationsInfo[relationKey] as string || '-'}</dd>
                            </div>
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-2">メイク・ヘアメイク</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">希望スタイリスト</dt>
                        <dd className="mt-1 text-sm text-gray-900">{applicationsInfo.makeup_preferred_stylist || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">メイク担当者名</dt>
                        <dd className="mt-1 text-sm text-gray-900">{applicationsInfo.makeup_name || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">メイク担当者メール</dt>
                        <dd className="mt-1 text-sm text-gray-900">{applicationsInfo.makeup_email || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">メイク担当者電話</dt>
                        <dd className="mt-1 text-sm text-gray-900">{applicationsInfo.makeup_phone || '-'}</dd>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">申込み情報はまだ登録されていません</p>
              )}
            </div>
          </div>
        )

      case 'files':
        return (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                アップロードファイル
              </h2>
              {entry.entry_files && entry.entry_files.length > 0 ? (
                <FileList entryId={entry.id} editable={false} />
              ) : (
                <p className="text-gray-500">アップロードされたファイルはありません</p>
              )}
            </div>
          </div>
        )

      case 'selection':
        return (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                選考評価
              </h2>
              
              {message && (
                <div className={`mb-4 p-4 rounded-md ${
                  message.includes('失敗') 
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-green-50 border border-green-200 text-green-700'
                }`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSaveSelection} className="space-y-6">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    選考結果 *
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'pending' | 'selected' | 'rejected')}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="pending">審査待ち</option>
                    <option value="selected">選考通過</option>
                    <option value="rejected">不選考</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
                    コメント・フィードバック
                  </label>
                  <textarea
                    id="comments"
                    rows={4}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="選考に関するコメントやフィードバックを入力"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/entries')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    戻る
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? '保存中...' : '選考結果を保存'}
                  </button>
                </div>
              </form>

              {entry.selections && entry.selections.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">評価履歴</h3>
                  <div className="text-sm text-gray-500">
                    <p>評価者: {entry.selections[0].users?.name}</p>
                    <p>評価日時: {formatDateLocale(entry.selections[0].created_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* タブナビゲーション */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('basic')}
              className={`${
                activeTab === 'basic'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              基本情報
            </button>
            <button
              onClick={() => setActiveTab('preliminary')}
              className={`${
                activeTab === 'preliminary'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              予選情報
            </button>
            <button
              onClick={() => setActiveTab('program')}
              className={`${
                activeTab === 'program'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              プログラム
            </button>
            <button
              onClick={() => setActiveTab('semifinals')}
              className={`${
                activeTab === 'semifinals'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              準決勝
            </button>
            <button
              onClick={() => setActiveTab('finals')}
              className={`${
                activeTab === 'finals'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              決勝
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`${
                activeTab === 'applications'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              申込み
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`${
                activeTab === 'files'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              ファイル
            </button>
            <button
              onClick={() => setActiveTab('selection')}
              className={`${
                activeTab === 'selection'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              選考評価
            </button>
          </nav>
        </div>
      </div>

      {/* タブコンテンツ */}
      {renderTabContent()}
    </div>
  )
}