'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDateLocale } from '@/lib/utils'
import Image from 'next/image'
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

interface ExtendedEntryFile extends EntryFile {
  signed_url?: string
}

interface ExtendedEntry extends Entry {
  team_name?: string
  emergency_contact?: string
  users: {
    name: string
    email: string
  }
  entry_files: ExtendedEntryFile[]
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
  mediaUrls?: Record<string, string | null>
}

export default function EntryDetail({ entry, mediaUrls = {} }: EntryDetailProps) {

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
  const snsInfo = Array.isArray(entry.sns_info) ? entry.sns_info[0] : entry.sns_info


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

  // 各purpose別にファイルを分類
  const getPurposeFiles = (purpose: string) => {
    return entry.entry_files?.filter(f => f.purpose === purpose) || []
  }

  // 予選関連ファイル
  const preliminaryFiles = getPurposeFiles('preliminary')
  const preliminaryVideo = preliminaryFiles.find(f => f.file_type === 'video')

  // 準決勝関連ファイル
  const semifinalsFiles = getPurposeFiles('semifinals')
  const semifinalsMusicFile = semifinalsFiles.find(f => f.file_type === 'audio' && f.file_name?.includes('music'))
  const semifinalsChaserFile = semifinalsFiles.find(f => f.file_type === 'audio' && f.file_name?.includes('chaser'))

  // 決勝関連ファイル  
  const finalsFiles = getPurposeFiles('finals')
  const finalsMusicFile = finalsFiles.find(f => f.file_type === 'audio' && f.file_name?.includes('music'))
  const finalsChaserFile = finalsFiles.find(f => f.file_type === 'audio' && f.file_name?.includes('chaser'))

  // SNS関連ファイル
  const snsFiles = getPurposeFiles('sns')
  
  // ファイル名によるマッチングをより柔軟に
  const practiceVideoFile = snsFiles.find(f => f.file_type === 'video' && 
    (f.file_name?.toLowerCase().includes('practice') || 
     f.file_name?.includes('練習') ||
     f.purpose === 'practice_video'))
  const highlightVideoFile = snsFiles.find(f => f.file_type === 'video' && 
    (f.file_name?.toLowerCase().includes('highlight') || 
     f.file_name?.toLowerCase().includes('introduction') ||
     f.file_name?.includes('紹介') ||
     f.purpose === 'introduction_highlight'))
  // どちらも見つからない場合は、すべての動画を取得
  const allSnsVideos = snsFiles.filter(f => f.file_type === 'video')
  

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
                    基本情報詳細
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
                      <dt className="text-sm font-medium text-gray-500">代表者ローマ字</dt>
                      <dd className="mt-1 text-sm text-gray-900">{basicInfo.representative_romaji || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">代表者メール</dt>
                      <dd className="mt-1 text-sm text-gray-900">{basicInfo.representative_email || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">代表者生年月日</dt>
                      <dd className="mt-1 text-sm text-gray-900">{basicInfo.representative_birthdate || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">本名</dt>
                      <dd className="mt-1 text-sm text-gray-900">{basicInfo.real_name || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">本名カナ</dt>
                      <dd className="mt-1 text-sm text-gray-900">{basicInfo.real_name_kana || '-'}</dd>
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
                        <div>
                          <dt className="text-sm font-medium text-gray-500">パートナーローマ字</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.partner_romaji || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">パートナー生年月日</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.partner_birthdate || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">パートナー本名</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.partner_real_name || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">パートナー本名カナ</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.partner_real_name_kana || '-'}</dd>
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
                    <div>
                      <dt className="text-sm font-medium text-gray-500">ダンスジャンル</dt>
                      <dd className="mt-1 text-sm text-gray-900">{basicInfo.dance_style || '-'}</dd>
                    </div>
                    {basicInfo.choreographer && (
                      <>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">振付師</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.choreographer}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">振付師フリガナ</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.choreographer_furigana || '-'}</dd>
                        </div>
                      </>
                    )}
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
                    {basicInfo.emergency_contact_name_2 && (
                      <>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">緊急連絡先2</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.emergency_contact_name_2}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">緊急連絡先2電話</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.emergency_contact_phone_2}</dd>
                        </div>
                      </>
                    )}
                    {basicInfo.guardian_name && (
                      <>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">保護者名</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.guardian_name}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">保護者電話</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.guardian_phone || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">保護者メール</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.guardian_email || '-'}</dd>
                        </div>
                      </>
                    )}
                    {basicInfo.partner_guardian_name && (
                      <>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">パートナー保護者名</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.partner_guardian_name}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">パートナー保護者電話</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.partner_guardian_phone || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">パートナー保護者メール</dt>
                          <dd className="mt-1 text-sm text-gray-900">{basicInfo.partner_guardian_email || '-'}</dd>
                        </div>
                      </>
                    )}
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">同意事項</h4>
                      <div className="space-y-1">
                        <div>
                          <span className="text-sm text-gray-500">利用規約:</span>
                          <span className="ml-2 text-sm text-gray-900">{basicInfo.agreement_checked ? '同意済み' : '未同意'}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">メディア掲載:</span>
                          <span className="ml-2 text-sm text-gray-900">{basicInfo.media_consent_checked ? '同意済み' : '未同意'}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">プライバシーポリシー:</span>
                          <span className="ml-2 text-sm text-gray-900">{basicInfo.privacy_policy_checked ? '同意済み' : '未同意'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 'preliminary':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  予選情報
                </h2>
                {preliminaryInfo ? (
                  <div className="space-y-6">
                    {/* 作品情報セクション */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">作品情報</h3>
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
                          <dt className="text-sm font-medium text-gray-500">作品キャラクター・ストーリー</dt>
                          <dd className="mt-1 text-sm text-gray-900">{preliminaryInfo.work_story || '-'}</dd>
                        </div>
                      </div>
                    </div>

                    {/* 楽曲情報セクション */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">楽曲著作権情報</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <dd className="mt-1 text-sm text-gray-900">
                            {preliminaryInfo.music_rights_cleared === 'A' && '市販の楽曲を使用する'}
                            {preliminaryInfo.music_rights_cleared === 'B' && '自身で著作権に対し許諾を取った楽曲を使用する'}
                            {preliminaryInfo.music_rights_cleared === 'C' && '独自に製作されたオリジナル楽曲を使用する'}
                            {!preliminaryInfo.music_rights_cleared && '-'}
                          </dd>
                        </div>
                      </div>
                    </div>

                    {/* 振付師情報セクション */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">振付師情報</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">振付師1</dt>
                          <dd className="mt-1 text-sm text-gray-900">{preliminaryInfo.choreographer1_name || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">振付師1 フリガナ</dt>
                          <dd className="mt-1 text-sm text-gray-900">{preliminaryInfo.choreographer1_furigana || '-'}</dd>
                        </div>
                        {preliminaryInfo.choreographer2_name && (
                          <>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">振付師2</dt>
                              <dd className="mt-1 text-sm text-gray-900">{preliminaryInfo.choreographer2_name}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">振付師2 フリガナ</dt>
                              <dd className="mt-1 text-sm text-gray-900">{preliminaryInfo.choreographer2_furigana || '-'}</dd>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 予選動画セクション */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">
                        予選提出動画
                        <span className="ml-2 text-sm font-normal text-gray-600">
                          （動画提出: {preliminaryInfo.video_submitted ? '済み' : '未提出'}）
                        </span>
                      </h3>
                      {preliminaryVideo && preliminaryVideo.signed_url ? (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <video
                            controls
                            className="w-full max-w-3xl mx-auto rounded-lg shadow-lg"
                            src={preliminaryVideo.signed_url}
                          >
                            お使いのブラウザは動画タグをサポートしていません。
                          </video>
                          <div className="mt-3 text-center">
                            <p className="text-sm text-gray-600">ファイル名: {preliminaryVideo.file_name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              アップロード日時: {formatDateLocale(preliminaryVideo.uploaded_at)}
                            </p>
                            <a
                              href={preliminaryVideo.signed_url}
                              download={preliminaryVideo.file_name || '予選動画.mp4'}
                              className="inline-flex items-center px-3 py-1.5 mt-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                              動画をダウンロード
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                          動画が未提出です
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">予選情報はまだ登録されていません</p>
                )}
              </div>
            </div>
          </div>
        )

      case 'program':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  プログラム掲載用情報
                </h2>
                {programInfo ? (
                  <div className="space-y-6">
                    {/* 基本設定 */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">基本設定</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">楽曲数設定</dt>
                          <dd className="mt-1 text-sm text-gray-900">{programInfo.song_count || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">所属教室または所属</dt>
                          <dd className="mt-1 text-sm text-gray-900">{programInfo.affiliation || '登録なし'}</dd>
                        </div>
                      </div>
                    </div>

                    {/* 準決勝用情報 */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">
                        {programInfo.song_count === '1曲' ? '決勝・準決勝用情報' : '準決勝用情報'}
                      </h3>
                      
                      {/* 選手紹介用画像 */}
                      {mediaUrls.player_photo_path && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">選手紹介用画像</h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="relative w-full max-w-md mx-auto">
                              <Image
                                src={mediaUrls.player_photo_path}
                                alt="選手紹介用画像"
                                width={400}
                                height={400}
                                className="rounded-lg shadow-lg"
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-2">
                              プログラムや当日の選手紹介に使用されます
                            </p>
                            <div className="text-center mt-3">
                              <a
                                href={mediaUrls.player_photo_path}
                                download="選手紹介用画像.jpg"
                                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                ダウンロード
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">作品あらすじ・ストーリー（100文字以内）</dt>
                          <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                            {programInfo.semifinal_story || '-'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">作品見所（50文字以内）</dt>
                          <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                            {programInfo.semifinal_highlight || '-'}
                          </dd>
                        </div>
                      </div>

                      {/* 準決勝作品イメージ */}
                      {(mediaUrls.semifinal_image1_path || mediaUrls.semifinal_image2_path || 
                        mediaUrls.semifinal_image3_path || mediaUrls.semifinal_image4_path) && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">作品イメージ画像</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {['semifinal_image1_path', 'semifinal_image2_path', 'semifinal_image3_path', 'semifinal_image4_path'].map((key, index) => (
                              mediaUrls[key] && (
                                <div key={key} className="bg-gray-50 rounded-lg p-2">
                                  <Image
                                    src={mediaUrls[key]}
                                    alt={`準決勝作品イメージ${index + 1}`}
                                    width={300}
                                    height={300}
                                    className="rounded-lg shadow-md w-full"
                                    style={{ objectFit: 'cover' }}
                                  />
                                  <p className="mt-1 text-xs text-gray-600 text-center">イメージ画像 {index + 1}</p>
                                  <div className="text-center mt-2">
                                    <a
                                      href={mediaUrls[key]}
                                      download={`準決勝_イメージ${index + 1}.jpg`}
                                      className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                      </svg>
                                      DL
                                    </a>
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 決勝用情報（2曲の場合） */}
                    {programInfo.song_count === '2曲' && (
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">決勝用情報</h3>
                        
                        {/* 決勝選手紹介用画像 */}
                        {mediaUrls.final_player_photo_path && (
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">決勝用選手紹介画像</h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="relative w-full max-w-md mx-auto">
                                <Image
                                  src={mediaUrls.final_player_photo_path}
                                  alt="決勝選手紹介用画像"
                                  width={400}
                                  height={400}
                                  className="rounded-lg shadow-lg"
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                              <div className="text-center mt-3">
                                <a
                                  href={mediaUrls.final_player_photo_path}
                                  download="決勝選手紹介用画像.jpg"
                                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                  </svg>
                                  ダウンロード
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">決勝所属</dt>
                            <dd className="mt-1 text-sm text-gray-900">{programInfo.final_affiliation || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">決勝作品あらすじ・ストーリー</dt>
                            <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                              {programInfo.final_story || '-'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">決勝作品見所</dt>
                            <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                              {programInfo.final_highlight || '-'}
                            </dd>
                          </div>
                        </div>

                        {/* 決勝作品イメージ */}
                        {(mediaUrls.final_image1_path || mediaUrls.final_image2_path || 
                          mediaUrls.final_image3_path || mediaUrls.final_image4_path) && (
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">決勝作品イメージ画像</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {['final_image1_path', 'final_image2_path', 'final_image3_path', 'final_image4_path'].map((key, index) => (
                                mediaUrls[key] && (
                                  <div key={key} className="bg-gray-50 rounded-lg p-2">
                                    <Image
                                      src={mediaUrls[key]}
                                      alt={`決勝作品イメージ${index + 1}`}
                                      width={300}
                                      height={300}
                                      className="rounded-lg shadow-md w-full"
                                      style={{ objectFit: 'cover' }}
                                    />
                                    <p className="mt-1 text-xs text-gray-600 text-center">イメージ画像 {index + 1}</p>
                                    <div className="text-center mt-2">
                                      <a
                                        href={mediaUrls[key]}
                                        download={`決勝_イメージ${index + 1}.jpg`}
                                        className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                      >
                                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                        </svg>
                                        DL
                                      </a>
                                    </div>
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 備考 */}
                    {programInfo.notes && (
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">備考</h3>
                        <div className="bg-gray-50 p-4 rounded">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{programInfo.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">プログラム情報はまだ登録されていません</p>
                )}
              </div>
            </div>
          </div>
        )

      case 'semifinals':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  準決勝情報
                </h2>
                {
                  <div className="space-y-6">
                    {semifinalsInfo ? (
                      <>
                    {/* 作品・楽曲情報 */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">作品・楽曲情報</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">予選から楽曲変更</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {semifinalsInfo.music_change_from_preliminary ? '変更あり' : '変更なし'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">作品タイトル</dt>
                          <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.work_title || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">作品タイトル（かな）</dt>
                          <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.work_title_kana || '-'}</dd>
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
                          <dd className="mt-1 text-sm text-gray-900">
                            {semifinalsInfo.music_type === 'cd' && 'CD楽曲'}
                            {semifinalsInfo.music_type === 'download' && 'ダウンロード楽曲'}
                            {semifinalsInfo.music_type === 'other' && 'その他（オリジナル曲）'}
                            {!semifinalsInfo.music_type && '-'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">CDタイトル</dt>
                          <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.cd_title || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">レコード番号</dt>
                          <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.record_number || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">JASRAC作品コード</dt>
                          <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.jasrac_code || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">著作権許諾</dt>
                          <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.copyright_permission || '-'}</dd>
                        </div>
                        <div className="md:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">作品キャラクター・ストーリー</dt>
                          <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.work_character_story || '-'}</dd>
                        </div>
                      </div>
                    </div>

                    {/* 振付師情報 */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">振付師情報</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">予選から振付師変更</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {semifinalsInfo.choreographer_change_from_preliminary ? '変更あり' : '変更なし'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">振付師1</dt>
                          <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.choreographer_name || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">振付師1 フリガナ</dt>
                          <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.choreographer_name_kana || '-'}</dd>
                        </div>
                        {semifinalsInfo.choreographer2_name && (
                          <>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">振付師2</dt>
                              <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.choreographer2_name}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">振付師2 フリガナ</dt>
                              <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.choreographer2_furigana || '-'}</dd>
                            </div>
                          </>
                        )}
                        <div>
                          <dt className="text-sm font-medium text-gray-500">小道具の使用</dt>
                          <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.props_usage || '-'}</dd>
                        </div>
                        {semifinalsInfo.props_details && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">使用する小道具</dt>
                            <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.props_details}</dd>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 音楽ファイル */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">音楽データ</h3>
                      
                      {/* メイン楽曲 */}
                      {(mediaUrls.semifinals_music_data_path || semifinalsMusicFile?.signed_url) && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">本番用楽曲データ</h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <audio controls className="w-full">
                              <source src={mediaUrls.semifinals_music_data_path || semifinalsMusicFile?.signed_url} />
                              お使いのブラウザは音声タグをサポートしていません。
                            </audio>
                            <div className="flex items-center justify-between mt-2">
                              {semifinalsMusicFile && (
                                <p className="text-xs text-gray-600">ファイル: {semifinalsMusicFile.file_name}</p>
                              )}
                              <a
                                href={mediaUrls.semifinals_music_data_path || semifinalsMusicFile?.signed_url}
                                download={semifinalsMusicFile?.file_name || '準決勝_楽曲.mp3'}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                ダウンロード
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* チェイサー曲 */}
                      {(mediaUrls.semifinals_chaser_song || semifinalsChaserFile?.signed_url) && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">チェイサー曲</h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <audio controls className="w-full">
                              <source src={mediaUrls.semifinals_chaser_song || semifinalsChaserFile?.signed_url} />
                              お使いのブラウザは音声タグをサポートしていません。
                            </audio>
                            <div className="flex items-center justify-between mt-2">
                              {semifinalsChaserFile && (
                                <p className="text-xs text-gray-600">ファイル: {semifinalsChaserFile.file_name}</p>
                              )}
                              <a
                                href={mediaUrls.semifinals_chaser_song || semifinalsChaserFile?.signed_url}
                                download={semifinalsChaserFile?.file_name || '準決勝_チェイサー.mp3'}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                ダウンロード
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {!mediaUrls.semifinals_music_data_path && !semifinalsMusicFile && (
                        <p className="text-sm text-gray-500">音楽データは未アップロードです</p>
                      )}
                    </div>

                    {/* 音響指示 */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">音響指示書</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">音楽スタートのタイミング</dt>
                          <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.sound_start_timing || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">チェイサー曲の指定</dt>
                          <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.chaser_song_designation || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">フェードアウト開始時間</dt>
                          <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.fade_out_start_time || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">フェードアウト完了時間</dt>
                          <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.fade_out_complete_time || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">音楽使用方法</dt>
                          <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.music_usage_method || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">ダンススタートタイミング</dt>
                          <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.dance_start_timing || '-'}</dd>
                        </div>
                      </div>
                    </div>

                    {/* 照明指示（シーンごとの詳細） */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">照明指示書</h3>
                      {[1, 2, 3, 4, 5].map((num) => {
                        const timeKey = `scene${num}_time` as keyof SemifinalsInfo
                        const triggerKey = `scene${num}_trigger` as keyof SemifinalsInfo
                        const colorKey = `scene${num}_color_type` as keyof SemifinalsInfo
                        const notesKey = `scene${num}_notes` as keyof SemifinalsInfo
                        
                        if (semifinalsInfo[timeKey] || semifinalsInfo[triggerKey]) {
                          return (
                            <div key={num} className="mb-4 p-3 bg-gray-50 rounded-lg">
                              <h4 className="font-medium text-sm text-gray-700 mb-2">シーン{num}</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {semifinalsInfo[timeKey] && (
                                  <div>
                                    <span className="text-gray-500">時間:</span>
                                    <span className="ml-2 text-gray-900">{semifinalsInfo[timeKey] as string}</span>
                                  </div>
                                )}
                                {semifinalsInfo[triggerKey] && (
                                  <div>
                                    <span className="text-gray-500">タイミング:</span>
                                    <span className="ml-2 text-gray-900">{semifinalsInfo[triggerKey] as string}</span>
                                  </div>
                                )}
                                {semifinalsInfo[colorKey] && (
                                  <div>
                                    <span className="text-gray-500">カラー:</span>
                                    <span className="ml-2 text-gray-900">{semifinalsInfo[colorKey] as string}</span>
                                  </div>
                                )}
                                {semifinalsInfo[notesKey] && (
                                  <div className="col-span-2">
                                    <span className="text-gray-500">備考:</span>
                                    <span className="ml-2 text-gray-900">{semifinalsInfo[notesKey] as string}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        }
                        return null
                      })}
                      
                      {/* チェイサー退場シーン */}
                      {(semifinalsInfo.chaser_exit_time || semifinalsInfo.chaser_exit_trigger) && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-sm text-gray-700 mb-2">チェイサー退場</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {semifinalsInfo.chaser_exit_time && (
                              <div>
                                <span className="text-gray-500">時間:</span>
                                <span className="ml-2 text-gray-900">{semifinalsInfo.chaser_exit_time}</span>
                              </div>
                            )}
                            {semifinalsInfo.chaser_exit_trigger && (
                              <div>
                                <span className="text-gray-500">タイミング:</span>
                                <span className="ml-2 text-gray-900">{semifinalsInfo.chaser_exit_trigger}</span>
                              </div>
                            )}
                            {semifinalsInfo.chaser_exit_color_type && (
                              <div>
                                <span className="text-gray-500">カラー:</span>
                                <span className="ml-2 text-gray-900">{semifinalsInfo.chaser_exit_color_type}</span>
                              </div>
                            )}
                            {semifinalsInfo.chaser_exit_notes && (
                              <div className="col-span-2">
                                <span className="text-gray-500">備考:</span>
                                <span className="ml-2 text-gray-900">{semifinalsInfo.chaser_exit_notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 照明シーン画像 */}
                    {(mediaUrls.scene1_image_path || mediaUrls.scene2_image_path || 
                      mediaUrls.scene3_image_path || mediaUrls.scene4_image_path || 
                      mediaUrls.scene5_image_path || mediaUrls.chaser_exit_image_path) && (
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">照明シーン資料画像</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {['scene1_image_path', 'scene2_image_path', 'scene3_image_path', 
                            'scene4_image_path', 'scene5_image_path', 'chaser_exit_image_path'].map((key, index) => (
                            mediaUrls[key] && (
                              <div key={key} className="bg-gray-50 rounded-lg p-2">
                                <Image
                                  src={mediaUrls[key]}
                                  alt={`シーン${index === 5 ? 'チェイサー退場' : index + 1}`}
                                  width={200}
                                  height={200}
                                  className="rounded-lg shadow-md w-full"
                                  style={{ objectFit: 'cover' }}
                                />
                                <p className="mt-1 text-xs text-gray-600 text-center">
                                  {index === 5 ? 'チェイサー退場' : `シーン${index + 1}`}
                                </p>
                                <div className="text-center mt-2">
                                  <a
                                    href={mediaUrls[key]}
                                    download={`${key.includes('finals') ? '決勝' : '準決勝'}_${index === 5 ? 'チェイサー退場' : `シーン${index + 1}`}.jpg`}
                                    className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                  >
                                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    DL
                                  </a>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 銀行口座情報 */}
                    {(semifinalsInfo.bank_name || semifinalsInfo.branch_name || semifinalsInfo.account_number) && (
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">賞金振込先口座</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">銀行名</dt>
                            <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.bank_name || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">支店名</dt>
                            <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.branch_name || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">口座種別</dt>
                            <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.account_type || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">口座番号</dt>
                            <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.account_number || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">口座名義</dt>
                            <dd className="mt-1 text-sm text-gray-900">{semifinalsInfo.account_holder || '-'}</dd>
                          </div>
                        </div>
                      </div>
                    )}
                      </>
                    ) : (
                      <p className="text-gray-500">準決勝情報はまだ登録されていません</p>
                    )}
                    
                    {/* entry_filesから準決勝関連ファイルを表示 */}
                    {!semifinalsInfo && semifinalsFiles.length > 0 && (
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">準決勝関連ファイル</h3>
                        <div className="space-y-4">
                          {semifinalsFiles.map((file) => (
                            <div key={file.id} className="bg-gray-50 rounded-lg p-4">
                              {file.file_type === 'audio' && file.signed_url && (
                                <>
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    {file.file_name?.includes('chaser') ? 'チェイサー曲' : '楽曲データ'}
                                  </h4>
                                  <audio controls className="w-full">
                                    <source src={file.signed_url} />
                                    お使いのブラウザは音声タグをサポートしていません。
                                  </audio>
                                  <p className="text-xs text-gray-600 mt-2">ファイル: {file.file_name}</p>
                                </>
                              )}
                              {file.file_type === 'photo' && file.signed_url && (
                                <>
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">照明シーン画像</h4>
                                  <Image
                                    src={file.signed_url}
                                    alt={file.file_name}
                                    width={300}
                                    height={300}
                                    className="rounded-lg shadow-md"
                                    style={{ objectFit: 'cover' }}
                                  />
                                  <p className="text-xs text-gray-600 mt-2">ファイル: {file.file_name}</p>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                }
              </div>
            </div>
          </div>
        )

      case 'finals':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  決勝情報
                </h2>
                {finalsInfo ? (
                  <div className="space-y-6">
                    {/* 作品・楽曲情報 */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">作品・楽曲情報</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">準決勝から楽曲変更</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {finalsInfo.music_change ? '変更あり' : '変更なし'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">予選楽曲コピー</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {finalsInfo.copy_preliminary_music ? 'コピーする' : 'コピーしない'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">作品タイトル</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.work_title || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">作品タイトル（かな）</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.work_title_kana || '-'}</dd>
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
                          <dt className="text-sm font-medium text-gray-500">CDタイトル</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.cd_title || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">レコード番号</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.record_number || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">JASRAC作品コード</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.jasrac_code || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">楽曲種類</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {finalsInfo.music_type === 'cd' && 'CD楽曲'}
                            {finalsInfo.music_type === 'download' && 'ダウンロード楽曲'}
                            {finalsInfo.music_type === 'other' && 'その他（オリジナル曲）'}
                            {!finalsInfo.music_type && '-'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">著作権許諾</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.copyright_permission || '-'}</dd>
                        </div>
                        <div className="md:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">作品キャラクター・ストーリー</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.work_character_story || '-'}</dd>
                        </div>
                      </div>
                    </div>

                    {/* 振付師情報 */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">振付師情報</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">振付変更</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {finalsInfo.choreographer_change ? '変更あり' : '変更なし'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">振付師1</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.choreographer_name || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">振付師1 フリガナ</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.choreographer_furigana || '-'}</dd>
                        </div>
                        {finalsInfo.choreographer2_name && (
                          <>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">振付師2</dt>
                              <dd className="mt-1 text-sm text-gray-900">{finalsInfo.choreographer2_name}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">振付師2 フリガナ</dt>
                              <dd className="mt-1 text-sm text-gray-900">{finalsInfo.choreographer2_furigana || '-'}</dd>
                            </div>
                          </>
                        )}
                        <div>
                          <dt className="text-sm font-medium text-gray-500">小道具の使用</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.props_usage || '-'}</dd>
                        </div>
                        {finalsInfo.props_details && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">使用する小道具</dt>
                            <dd className="mt-1 text-sm text-gray-900">{finalsInfo.props_details}</dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-sm font-medium text-gray-500">振付師の来場</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.choreographer_attendance || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">振付師写真許諾</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.choreographer_photo_permission || '-'}</dd>
                        </div>
                        {finalsInfo.choreography_change_timing && (
                          <>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">振付変更タイミング</dt>
                              <dd className="mt-1 text-sm text-gray-900">{finalsInfo.choreography_change_timing}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">変更前振付</dt>
                              <dd className="mt-1 text-sm text-gray-900">{finalsInfo.choreography_before_change || '-'}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">変更後振付</dt>
                              <dd className="mt-1 text-sm text-gray-900">{finalsInfo.choreography_after_change || '-'}</dd>
                            </div>
                          </>
                        )}
                      </div>

                      {/* 振付師写真 */}
                      {mediaUrls.choreographer_photo_path && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">振付師写真</h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="relative w-full max-w-sm mx-auto">
                              <Image
                                src={mediaUrls.choreographer_photo_path}
                                alt="振付師写真"
                                width={300}
                                height={300}
                                className="rounded-lg shadow-lg"
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-2">
                              プログラム掲載用振付師写真
                            </p>
                            <div className="flex items-center justify-center space-x-2 mt-3">
                              <button
                                onClick={() => mediaUrls.choreographer_photo_path && window.open(mediaUrls.choreographer_photo_path, '_blank')}
                                className="inline-flex items-center px-3 py-1 border border-blue-300 shadow-sm text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                </svg>
                                プレビュー
                              </button>
                              <a
                                href={mediaUrls.choreographer_photo_path}
                                download="振付師写真.jpg"
                                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                ダウンロード
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 音楽ファイル */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">音楽データ</h3>
                      
                      {/* メイン楽曲 */}
                      {(mediaUrls.finals_music_data_path || finalsMusicFile?.signed_url) && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">決勝用楽曲データ</h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <audio controls className="w-full">
                              <source src={mediaUrls.finals_music_data_path || finalsMusicFile?.signed_url} />
                              お使いのブラウザは音声タグをサポートしていません。
                            </audio>
                            <div className="flex items-center justify-between mt-2">
                              {finalsMusicFile && (
                                <p className="text-xs text-gray-600">ファイル: {finalsMusicFile.file_name}</p>
                              )}
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    const url = mediaUrls.finals_music_data_path || finalsMusicFile?.signed_url;
                                    if (url) window.open(url, '_blank');
                                  }}
                                  className="inline-flex items-center px-3 py-1 border border-blue-300 shadow-sm text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                  </svg>
                                  プレビュー
                                </button>
                                <a
                                  href={mediaUrls.finals_music_data_path || finalsMusicFile?.signed_url}
                                  download={finalsMusicFile?.file_name || '決勝_楽曲.mp3'}
                                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                  </svg>
                                  ダウンロード
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* チェイサー曲 */}
                      {(mediaUrls.finals_chaser_song || finalsChaserFile?.signed_url) && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">チェイサー曲</h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <audio controls className="w-full">
                              <source src={mediaUrls.finals_chaser_song || finalsChaserFile?.signed_url} />
                              お使いのブラウザは音声タグをサポートしていません。
                            </audio>
                            <div className="flex items-center justify-between mt-2">
                              {finalsChaserFile && (
                                <p className="text-xs text-gray-600">ファイル: {finalsChaserFile.file_name}</p>
                              )}
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    const url = mediaUrls.finals_chaser_song || finalsChaserFile?.signed_url;
                                    if (url) window.open(url, '_blank');
                                  }}
                                  className="inline-flex items-center px-3 py-1 border border-blue-300 shadow-sm text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                  </svg>
                                  プレビュー
                                </button>
                                <a
                                  href={mediaUrls.finals_chaser_song || finalsChaserFile?.signed_url}
                                download={finalsChaserFile?.file_name || '決勝_チェイサー.mp3'}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                ダウンロード
                              </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 音響・照明変更 */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">音響・照明指示</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">音響変更（準決勝から）</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {finalsInfo.sound_change_from_semifinals ? '変更あり' : '変更なし'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">照明変更（準決勝から）</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {finalsInfo.lighting_change_from_semifinals ? '変更あり' : '変更なし'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">音楽スタートのタイミング</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.sound_start_timing || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">チェイサー曲の指定</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.chaser_song_designation || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">フェードアウト開始時間</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.fade_out_start_time || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">フェードアウト完了時間</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.fade_out_complete_time || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">音楽使用方法</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.music_usage_method || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">ダンススタートタイミング</dt>
                          <dd className="mt-1 text-sm text-gray-900">{finalsInfo.dance_start_timing || '-'}</dd>
                        </div>
                      </div>
                    </div>

                    {/* 照明指示詳細 */}
                    {finalsInfo.lighting_change_from_semifinals && (
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">照明指示詳細</h3>
                        {[1, 2, 3, 4, 5].map((num) => {
                          const timeKey = `scene${num}_time` as keyof FinalsInfo
                          const triggerKey = `scene${num}_trigger` as keyof FinalsInfo
                          const colorKey = `scene${num}_color_type` as keyof FinalsInfo
                          const notesKey = `scene${num}_notes` as keyof FinalsInfo
                          
                          if (finalsInfo[timeKey] || finalsInfo[triggerKey]) {
                            return (
                              <div key={num} className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-sm text-gray-700 mb-2">シーン{num}</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {finalsInfo[timeKey] && (
                                    <div>
                                      <span className="text-gray-500">時間:</span>
                                      <span className="ml-2 text-gray-900">{finalsInfo[timeKey] as string}</span>
                                    </div>
                                  )}
                                  {finalsInfo[triggerKey] && (
                                    <div>
                                      <span className="text-gray-500">タイミング:</span>
                                      <span className="ml-2 text-gray-900">{finalsInfo[triggerKey] as string}</span>
                                    </div>
                                  )}
                                  {finalsInfo[colorKey] && (
                                    <div>
                                      <span className="text-gray-500">カラー:</span>
                                      <span className="ml-2 text-gray-900">{finalsInfo[colorKey] as string}</span>
                                    </div>
                                  )}
                                  {finalsInfo[notesKey] && (
                                    <div className="col-span-2">
                                      <span className="text-gray-500">備考:</span>
                                      <span className="ml-2 text-gray-900">{finalsInfo[notesKey] as string}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          }
                          return null
                        })}
                        
                        {/* チェイサー退場シーン */}
                        {(finalsInfo.chaser_exit_time || finalsInfo.chaser_exit_trigger) && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-sm text-gray-700 mb-2">チェイサー退場</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {finalsInfo.chaser_exit_time && (
                                <div>
                                  <span className="text-gray-500">時間:</span>
                                  <span className="ml-2 text-gray-900">{finalsInfo.chaser_exit_time}</span>
                                </div>
                              )}
                              {finalsInfo.chaser_exit_trigger && (
                                <div>
                                  <span className="text-gray-500">タイミング:</span>
                                  <span className="ml-2 text-gray-900">{finalsInfo.chaser_exit_trigger}</span>
                                </div>
                              )}
                              {finalsInfo.chaser_exit_color_type && (
                                <div>
                                  <span className="text-gray-500">カラー:</span>
                                  <span className="ml-2 text-gray-900">{finalsInfo.chaser_exit_color_type}</span>
                                </div>
                              )}
                              {finalsInfo.chaser_exit_notes && (
                                <div className="col-span-2">
                                  <span className="text-gray-500">備考:</span>
                                  <span className="ml-2 text-gray-900">{finalsInfo.chaser_exit_notes}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 照明シーン画像 */}
                    {(mediaUrls.finals_scene1_image_path || mediaUrls.finals_scene2_image_path || 
                      mediaUrls.finals_scene3_image_path || mediaUrls.finals_scene4_image_path || 
                      mediaUrls.finals_scene5_image_path || mediaUrls.finals_chaser_exit_image_path) && (
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">照明シーン資料画像（決勝用）</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {['finals_scene1_image_path', 'finals_scene2_image_path', 'finals_scene3_image_path', 
                            'finals_scene4_image_path', 'finals_scene5_image_path', 'finals_chaser_exit_image_path'].map((key, index) => (
                            mediaUrls[key] && (
                              <div key={key} className="bg-gray-50 rounded-lg p-2">
                                <Image
                                  src={mediaUrls[key]}
                                  alt={`シーン${index === 5 ? 'チェイサー退場' : index + 1}`}
                                  width={200}
                                  height={200}
                                  className="rounded-lg shadow-md w-full"
                                  style={{ objectFit: 'cover' }}
                                />
                                <p className="mt-1 text-xs text-gray-600 text-center">
                                  {index === 5 ? 'チェイサー退場' : `シーン${index + 1}`}
                                </p>
                                <div className="flex items-center justify-center space-x-2 mt-2">
                                  <button
                                    onClick={() => {
                                      const url = mediaUrls[key];
                                      if (url) window.open(url, '_blank');
                                    }}
                                    className="inline-flex items-center px-2 py-1 border border-blue-300 shadow-sm text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100"
                                  >
                                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                    </svg>
                                    表示
                                  </button>
                                  <a
                                    href={mediaUrls[key]}
                                    download={`${key.includes('finals') ? '決勝' : '準決勝'}_${index === 5 ? 'チェイサー退場' : `シーン${index + 1}`}.jpg`}
                                    className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                  >
                                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    DL
                                  </a>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">決勝情報はまだ登録されていません</p>
                )}
              </div>
            </div>
          </div>
        )

      case 'applications':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  申込み情報
                </h2>
                {applicationsInfo ? (
                  <div className="space-y-6">
                    {/* 関係者チケット */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">関係者チケット申込み</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">申込み枚数</dt>
                          <dd className="mt-1 text-sm text-gray-900">{applicationsInfo.related_ticket_count || 0}枚</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">合計金額</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {applicationsInfo.related_ticket_total_amount ? 
                              `¥${applicationsInfo.related_ticket_total_amount.toLocaleString()}` : '¥0'}
                          </dd>
                        </div>
                      </div>

                      {/* 関係者詳細 */}
                      {[1, 2, 3, 4, 5].map((num) => {
                        const nameKey = `related${num}_name` as keyof ApplicationsInfo
                        const relationKey = `related${num}_relationship` as keyof ApplicationsInfo
                        const furiganaKey = `related${num}_furigana` as keyof ApplicationsInfo
                        if (applicationsInfo[nameKey]) {
                          return (
                            <div key={num} className="bg-gray-50 rounded-lg p-3 mb-2">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">関係者{num}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <dt className="text-xs text-gray-500">氏名</dt>
                                  <dd className="text-sm text-gray-900">{applicationsInfo[nameKey] as string}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-gray-500">フリガナ</dt>
                                  <dd className="text-sm text-gray-900">{(applicationsInfo[furiganaKey] as string) || '-'}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-gray-500">関係</dt>
                                  <dd className="text-sm text-gray-900">{(applicationsInfo[relationKey] as string) || '-'}</dd>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>

                    {/* 同伴者情報 */}
                    {(applicationsInfo.companion1_name || applicationsInfo.companion2_name || applicationsInfo.companion3_name) && (
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">同伴者申込み</h3>
                        <div className="mb-4">
                          <dt className="text-sm font-medium text-gray-500">同伴者合計金額</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {applicationsInfo.companion_total_amount ? 
                              `¥${applicationsInfo.companion_total_amount.toLocaleString()}` : '¥0'}
                          </dd>
                        </div>
                        {[1, 2, 3].map((num) => {
                          const nameKey = `companion${num}_name` as keyof ApplicationsInfo
                          const furiganaKey = `companion${num}_furigana` as keyof ApplicationsInfo
                          const purposeKey = `companion${num}_purpose` as keyof ApplicationsInfo
                          if (applicationsInfo[nameKey]) {
                            return (
                              <div key={num} className="bg-gray-50 rounded-lg p-3 mb-2">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">同伴者{num}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <dt className="text-xs text-gray-500">氏名</dt>
                                    <dd className="text-sm text-gray-900">{applicationsInfo[nameKey] as string}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs text-gray-500">フリガナ</dt>
                                    <dd className="text-sm text-gray-900">{(applicationsInfo[furiganaKey] as string) || '-'}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs text-gray-500">目的</dt>
                                    <dd className="text-sm text-gray-900">{(applicationsInfo[purposeKey] as string) || '-'}</dd>
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        })}
                      </div>
                    )}

                    {/* 振込明細 */}
                    {mediaUrls.payment_slip_path && (
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">振込明細書</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="relative w-full max-w-3xl mx-auto">
                            <Image
                              src={mediaUrls.payment_slip_path}
                              alt="振込明細"
                              width={800}
                              height={600}
                              className="rounded-lg shadow-lg w-full"
                              style={{ objectFit: 'contain' }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 text-center mt-2">
                            関係者チケット代金の振込明細
                          </p>
                        </div>
                      </div>
                    )}

                    {/* メイク・ヘアメイク（準決勝） */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">メイク・ヘアメイク申込み（準決勝）</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">希望スタイリスト</dt>
                          <dd className="mt-1 text-sm text-gray-900">{applicationsInfo.makeup_preferred_stylist || '指定なし'}</dd>
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
                        <div>
                          <dt className="text-sm font-medium text-gray-500">メイクスタイル1</dt>
                          <dd className="mt-1 text-sm text-gray-900">{applicationsInfo.makeup_style1 || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">メイクスタイル2</dt>
                          <dd className="mt-1 text-sm text-gray-900">{applicationsInfo.makeup_style2 || '-'}</dd>
                        </div>
                        {applicationsInfo.makeup_notes && (
                          <div className="md:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">備考</dt>
                            <dd className="mt-1 text-sm text-gray-900">{applicationsInfo.makeup_notes}</dd>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* メイク・ヘアメイク（決勝） */}
                    {(applicationsInfo.makeup_preferred_stylist_final || applicationsInfo.makeup_name_final) && (
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">メイク・ヘアメイク申込み（決勝）</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">希望スタイリスト</dt>
                            <dd className="mt-1 text-sm text-gray-900">{applicationsInfo.makeup_preferred_stylist_final || '指定なし'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">メイク担当者名</dt>
                            <dd className="mt-1 text-sm text-gray-900">{applicationsInfo.makeup_name_final || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">メイク担当者メール</dt>
                            <dd className="mt-1 text-sm text-gray-900">{applicationsInfo.makeup_email_final || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">メイク担当者電話</dt>
                            <dd className="mt-1 text-sm text-gray-900">{applicationsInfo.makeup_phone_final || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">メイクスタイル1</dt>
                            <dd className="mt-1 text-sm text-gray-900">{applicationsInfo.makeup_style1_final || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">メイクスタイル2</dt>
                            <dd className="mt-1 text-sm text-gray-900">{applicationsInfo.makeup_style2_final || '-'}</dd>
                          </div>
                          {applicationsInfo.makeup_notes_final && (
                            <div className="md:col-span-2">
                              <dt className="text-sm font-medium text-gray-500">備考</dt>
                              <dd className="mt-1 text-sm text-gray-900">{applicationsInfo.makeup_notes_final}</dd>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 申込み備考 */}
                    {applicationsInfo.applications_notes && (
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">申込み備考</h3>
                        <div className="bg-gray-50 p-4 rounded">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{applicationsInfo.applications_notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">申込み情報はまだ登録されていません</p>
                )}
              </div>
            </div>
          </div>
        )

      case 'sns':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  SNS・広報用情報
                </h2>
                {
                  <div className="space-y-6">
                    {/* 練習動画 */}
                    {(mediaUrls.practice_video_path || practiceVideoFile?.signed_url) && (
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">練習風景動画</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <video
                            controls
                            className="w-full max-w-3xl mx-auto rounded-lg shadow-lg"
                            src={mediaUrls.practice_video_path || practiceVideoFile?.signed_url}
                          >
                            お使いのブラウザは動画タグをサポートしていません。
                          </video>
                          <div className="mt-3 text-center">
                            <p className="text-sm text-gray-600">
                              ファイル名: {snsInfo?.practice_video_filename || practiceVideoFile?.file_name || '-'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              SNSでの事前告知に使用される練習風景動画
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 紹介ハイライト動画 */}
                    {(mediaUrls.introduction_highlight_path || highlightVideoFile?.signed_url) && (
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">紹介用ハイライト動画</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <video
                            controls
                            className="w-full max-w-3xl mx-auto rounded-lg shadow-lg"
                            src={mediaUrls.introduction_highlight_path || highlightVideoFile?.signed_url}
                          >
                            お使いのブラウザは動画タグをサポートしていません。
                          </video>
                          <div className="mt-3 text-center">
                            <p className="text-sm text-gray-600">
                              ファイル名: {snsInfo?.introduction_highlight_filename || highlightVideoFile?.file_name || '-'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              大会当日の選手紹介で使用されるハイライト動画
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SNS備考 */}
                    {snsInfo?.sns_notes && (
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">SNS使用に関する備考</h3>
                        <div className="bg-gray-50 p-4 rounded">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{snsInfo?.sns_notes}</p>
                        </div>
                      </div>
                    )}

                    {/* 動画がない場合のentry_filesからのフォールバック */}
                    {!mediaUrls.practice_video_path && !practiceVideoFile && !mediaUrls.introduction_highlight_path && !highlightVideoFile && snsFiles.length > 0 && (
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">SNS用メディアファイル</h3>
                        <div className="space-y-4">
                          {snsFiles.map((file) => (
                            <div key={file.id} className="bg-gray-50 rounded-lg p-4">
                              {file.file_type === 'video' && file.signed_url && (
                                <>
                                  <video
                                    controls
                                    className="w-full max-w-3xl mx-auto rounded-lg shadow-lg mb-2"
                                    src={file.signed_url}
                                  >
                                    お使いのブラウザは動画タグをサポートしていません。
                                  </video>
                                  <p className="text-sm text-gray-600 text-center">ファイル名: {file.file_name}</p>
                                </>
                              )}
                              {file.file_type === 'photo' && file.signed_url && (
                                <>
                                  <Image
                                    src={file.signed_url}
                                    alt={file.file_name}
                                    width={800}
                                    height={600}
                                    className="rounded-lg shadow-lg w-full"
                                    style={{ objectFit: 'contain' }}
                                  />
                                  <p className="text-sm text-gray-600 text-center mt-2">ファイル名: {file.file_name}</p>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* すべてのSNS動画を表示（上記でマッチしなかった場合） */}
                    {!mediaUrls.practice_video_path && !practiceVideoFile && 
                     !mediaUrls.introduction_highlight_path && !highlightVideoFile && 
                     allSnsVideos.length > 0 && (
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-3 border-b pb-2">SNS用動画</h3>
                        <div className="space-y-4">
                          {allSnsVideos.map((file) => (
                            <div key={file.id} className="bg-gray-50 rounded-lg p-4">
                              {file.signed_url && (
                                <>
                                  <video
                                    controls
                                    className="w-full max-w-3xl mx-auto rounded-lg shadow-lg mb-2"
                                    src={file.signed_url}
                                  >
                                    お使いのブラウザは動画タグをサポートしていません。
                                  </video>
                                  <p className="text-sm text-gray-600 text-center">
                                    ファイル名: {file.file_name}
                                    {file.purpose && ` (用途: ${file.purpose})`}
                                  </p>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!mediaUrls.practice_video_path && !practiceVideoFile && 
                     !mediaUrls.introduction_highlight_path && !highlightVideoFile && 
                     allSnsVideos.length === 0 && !snsInfo?.sns_notes && (
                      <p className="text-gray-500">SNS・広報用の情報は登録されていません</p>
                    )}
                  </div>
                }
              </div>
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
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
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
                    {entry.selections[0].comments && (
                      <div className="mt-2">
                        <p className="font-medium">前回のコメント:</p>
                        <p className="mt-1">{entry.selections[0].comments}</p>
                      </div>
                    )}
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
          <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
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
              予選
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
              onClick={() => setActiveTab('sns')}
              className={`${
                activeTab === 'sns'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              SNS
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