import { createClient } from '@/lib/supabase/server'

export async function getDeadlineInfo(deadline: string | null) {
  if (!deadline || deadline === '') return null
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  // より正確な期限切れ判定：現在時刻が期限を過ぎているかで判定
  const isExpired = now > deadlineDate
  
  return {
    date: deadlineDate.toLocaleDateString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    daysLeft: diffDays,
    isExpired: isExpired, // より確実な期限切れ判定
    isUrgent: !isExpired && diffDays <= 3
  }
}

export async function isFormEditable(deadlineKey: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: settings } = await supabase
    .from('settings')
    .select('*')

  const settingsMap = settings?.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {} as Record<string, string>) || {}

  // より直接的な期限チェック
  const deadlineValue = settingsMap[deadlineKey]
  if (!deadlineValue || deadlineValue === '') return true
  
  const now = new Date()
  const deadlineDate = new Date(deadlineValue)
  const isExpired = now > deadlineDate
  
  console.log(`[DEADLINE CHECK] ${deadlineKey}: 現在=${now.toISOString()}, 期限=${deadlineDate.toISOString()}, 期限切れ=${isExpired}`)
  
  return !isExpired
}

// JSX要素は各ページで実装するため、この関数は削除