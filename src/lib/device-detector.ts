// デバイス環境検知ユーティリティ

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  platform: string
  browser: string
  touchEnabled: boolean
  screenSize: {
    width: number
    height: number
    devicePixelRatio: number
  }
  viewport: {
    width: number
    height: number
  }
  connectionType?: string
  userAgent: string
  timestamp: string
}

export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent
  
  // モバイル判定
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  const isTablet = /iPad|Android.*Tablet|Windows.*Touch/i.test(userAgent)
  const isDesktop = !isMobile && !isTablet
  
  // プラットフォーム判定
  let platform = 'Unknown'
  if (/Windows/i.test(userAgent)) platform = 'Windows'
  else if (/Mac/i.test(userAgent)) platform = 'Mac'
  else if (/Android/i.test(userAgent)) platform = 'Android'
  else if (/iPhone|iPad|iPod/i.test(userAgent)) platform = 'iOS'
  else if (/Linux/i.test(userAgent)) platform = 'Linux'
  
  // ブラウザ判定
  let browser = 'Unknown'
  if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) browser = 'Chrome'
  else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari'
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox'
  else if (/Edge/i.test(userAgent)) browser = 'Edge'
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    platform,
    browser,
    touchEnabled: 'ontouchstart' in window,
    screenSize: {
      width: window.screen.width,
      height: window.screen.height,
      devicePixelRatio: window.devicePixelRatio || 1
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    connectionType: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType || 'unknown',
    userAgent,
    timestamp: new Date().toISOString()
  }
}

export function logDeviceInfo(context: string) {
  const deviceInfo = getDeviceInfo()
  console.log(`[${context}] === デバイス環境情報 ===`)
  console.log(`[${context}] デバイスタイプ:`, {
    isMobile: deviceInfo.isMobile,
    isTablet: deviceInfo.isTablet,
    isDesktop: deviceInfo.isDesktop
  })
  console.log(`[${context}] プラットフォーム:`, deviceInfo.platform)
  console.log(`[${context}] ブラウザ:`, deviceInfo.browser)
  console.log(`[${context}] 画面情報:`, deviceInfo.screenSize)
  console.log(`[${context}] ビューポート:`, deviceInfo.viewport)
  console.log(`[${context}] タッチ対応:`, deviceInfo.touchEnabled)
  console.log(`[${context}] 接続タイプ:`, deviceInfo.connectionType)
  
  return deviceInfo
}

// PC/モバイル固有の問題を追跡
export function trackBehaviorDifference(
  context: string, 
  action: string, 
  result: 'success' | 'error', 
  details?: Record<string, unknown>
) {
  const deviceInfo = getDeviceInfo()
  console.log(`[${context}] === PC/モバイル挙動追跡 ===`)
  console.log(`[${context}] アクション:`, action)
  console.log(`[${context}] 結果:`, result)
  console.log(`[${context}] デバイス:`, deviceInfo.isMobile ? 'Mobile' : 'Desktop')
  console.log(`[${context}] プラットフォーム:`, deviceInfo.platform)
  console.log(`[${context}] ブラウザ:`, deviceInfo.browser)
  if (details) {
    console.log(`[${context}] 詳細:`, details)
  }
}