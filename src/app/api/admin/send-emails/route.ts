import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface EmailData {
  to: string
  subject: string
  body: string
  entryId: string
}

interface RequestBody {
  emails: EmailData[]
}

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 管理者権限チェック
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body: RequestBody = await request.json()
    const { emails } = body

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email data' },
        { status: 400 }
      )
    }

    // メール送信の実装（現在はダミー実装）
    // 実際の環境では、SendGrid、Amazon SES、Resendなどのメールサービスを使用
    const results = []
    
    for (const email of emails) {
      try {
        // TODO: 実際のメール送信処理を実装
        // 例: SendGridの場合
        // await sendGridClient.send({
        //   to: email.to,
        //   from: 'noreply@example.com',
        //   subject: email.subject,
        //   text: email.body,
        // })

        // 開発環境用：コンソールにログ出力
        console.log('=== EMAIL SENT ===')
        console.log('To:', email.to)
        console.log('Subject:', email.subject)
        console.log('Body:', email.body)
        console.log('Entry ID:', email.entryId)
        console.log('==================')

        // メール送信ログをデータベースに記録
        const adminSupabase = createAdminClient()
        await adminSupabase
          .from('email_logs')
          .insert({
            entry_id: email.entryId,
            recipient_email: email.to,
            subject: email.subject,
            body: email.body,
            sent_by: user.id,
            sent_at: new Date().toISOString(),
            status: 'sent'
          })

        results.push({
          to: email.to,
          status: 'sent',
          entryId: email.entryId
        })
      } catch (error) {
        console.error('Failed to send email to', email.to, error)
        results.push({
          to: email.to,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          entryId: email.entryId
        })
      }
    }

    // 成功・失敗の集計
    const sentCount = results.filter(r => r.status === 'sent').length
    const failedCount = results.filter(r => r.status === 'failed').length

    return NextResponse.json({
      success: true,
      message: `メール送信完了: 成功 ${sentCount}件, 失敗 ${failedCount}件`,
      results,
      summary: {
        total: emails.length,
        sent: sentCount,
        failed: failedCount
      }
    })

  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}