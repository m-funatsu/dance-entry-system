import { NextResponse } from 'next/server'
import { createCSRFToken } from '@/lib/csrf'

export async function GET() {
  try {
    const token = await createCSRFToken()
    
    return NextResponse.json({
      token
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate'
      }
    })
  } catch {
    return NextResponse.json({
      error: 'CSRFトークンの生成に失敗しました'
    }, {
      status: 500
    })
  }
}