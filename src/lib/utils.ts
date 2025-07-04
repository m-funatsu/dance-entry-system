export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    // ISO文字列を使用してサーバーとクライアントで一致させる
    return date.toISOString().slice(0, 19).replace('T', ' ')
  } catch (error) {
    return dateString
  }
}

export function formatDateLocale(dateString: string): string {
  try {
    const date = new Date(dateString)
    // 常に一貫したフォーマットを使用してHydrationエラーを防ぐ
    return date.toISOString().slice(0, 19).replace('T', ' ')
  } catch (error) {
    return dateString
  }
}