import { createClient } from '@/lib/supabase/server'

type BackgroundPage = 'login' | 'dashboard' | 'entry' | 'music'

export async function getBackgroundImage(page: BackgroundPage): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', `${page}_background_image`)
      .single()
    
    return setting?.value || null
  } catch {
    return null
  }
}

export function getBackgroundStyle(imageUrl: string | null): React.CSSProperties {
  if (!imageUrl) {
    return {}
  }
  
  return {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }
}