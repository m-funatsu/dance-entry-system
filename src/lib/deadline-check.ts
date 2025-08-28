import { createClient } from '@/lib/supabase/server'

export async function getDeadlineInfo(deadline: string | null) {
  if (!deadline || deadline === '') return null
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
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
    isExpired: diffDays < 0,
    isUrgent: diffDays >= 0 && diffDays <= 3
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

  const deadline = await getDeadlineInfo(settingsMap[deadlineKey])
  return !deadline || !deadline.isExpired
}

// JSX要素は各ページで実装するため、この関数は削除