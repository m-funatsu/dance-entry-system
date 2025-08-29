/**
 * 選考ステータスのラベル統一ユーティリティ
 */

export function getStatusLabel(status: string | undefined | null): string {
  switch (status) {
    case 'pending':
    case 'submitted':
      return '選考前'
    case 'selected':
      return '予選通過'
    case 'rejected':
      return '予選敗退'
    default:
      return '選考前'
  }
}

export function getStatusColor(status: string | undefined | null): string {
  switch (status) {
    case 'pending':
    case 'submitted':
      return 'bg-yellow-100 text-yellow-800' // 選考前 - 黄色
    case 'selected':
      return 'bg-green-100 text-green-800'  // 予選通過 - 緑色
    case 'rejected':
      return 'bg-red-100 text-red-800'      // 予選敗退 - 赤色
    default:
      return 'bg-yellow-100 text-yellow-800' // デフォルト - 黄色
  }
}