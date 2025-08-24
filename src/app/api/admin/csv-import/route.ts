import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    // リクエストボディからデータを取得
    const { csvData } = await request.json()
    
    if (!csvData || !Array.isArray(csvData)) {
      return NextResponse.json({ error: '無効なデータ形式です' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    let successCount = 0
    let failedCount = 0
    const errors: string[] = []

    // データを処理
    console.log('受信したCSVデータ:', csvData)
    
    for (let i = 0; i < csvData.length; i++) {
      const rowData = csvData[i]
      console.log(`API処理 - 行${i + 1}:`, rowData)
      
      try {
        const [danceGenre, categoryDivision, representativeName, representativeFurigana, representativeEmail, phoneNumber, partnerName, partnerFurigana] = rowData
        
        console.log('API抽出データ:', {
          danceGenre,
          categoryDivision,
          representativeName,
          representativeFurigana,
          representativeEmail: `"${representativeEmail}"`,
          phoneNumber,
          partnerName,
          partnerFurigana
        })
        
        // 文字列のトリムとクリーンアップ
        const cleanEmail = String(representativeEmail || '').trim().replace(/["\r\n]/g, '')
        const cleanName = String(representativeName || '').trim().replace(/["\r\n]/g, '')
        const cleanCategory = String(categoryDivision || '').trim().replace(/["\r\n]/g, '')
        const cleanGenre = String(danceGenre || '').trim().replace(/["\r\n]/g, '')
        
        console.log('クリーンアップ後:', {
          cleanEmail: `"${cleanEmail}"`,
          cleanName: `"${cleanName}"`,
          cleanCategory: `"${cleanCategory}"`
        })
        
        if (!cleanEmail || !cleanName || !cleanCategory) {
          errors.push(`行${i + 1}: 代表者メール、代表者名、カテゴリー区分は必須です`)
          failedCount++
          continue
        }
        
        if (!cleanEmail.includes('@')) {
          errors.push(`行${i + 1}: 無効なメールアドレス形式です (受信値: "${cleanEmail}")`)
          failedCount++
          continue
        }
        
        // ユーザーを検索または作成
        let { data: targetUser } = await adminSupabase
          .from('users')
          .select('id')
          .eq('email', cleanEmail)
          .single()
        
        if (!targetUser) {
          // ユーザーが存在しない場合は新規作成
          const { data: newUser, error: userError } = await adminSupabase
            .from('users')
            .insert({
              email: cleanEmail,
              name: cleanName,
              role: 'participant'
            })
            .select()
            .single()
          
          if (userError) {
            errors.push(`行${i + 1}: ユーザー作成エラー - ${userError.message}`)
            failedCount++
            continue
          }
          targetUser = newUser
        }
        
        if (!targetUser) {
          errors.push(`行${i + 1}: ユーザー情報が取得できませんでした`)
          failedCount++
          continue
        }
        
        // エントリーを作成  
        const cleanPartnerName = String(partnerName || '').trim().replace(/["\r\n]/g, '')
        const participantNames = cleanPartnerName ? `${cleanName} & ${cleanPartnerName}` : cleanName
        
        const { data: newEntry, error: entryError } = await adminSupabase
          .from('entries')
          .insert({
            user_id: targetUser.id,
            participant_names: participantNames,
            status: 'pending'
          })
          .select()
          .single()
        
        if (entryError || !newEntry) {
          errors.push(`行${i + 1}: エントリー作成エラー - ${entryError?.message || '不明なエラー'}`)
          failedCount++
          continue
        }
        
        // 基本情報を作成
        const { error: basicInfoError } = await adminSupabase
          .from('basic_info')
          .insert({
            entry_id: newEntry.id,
            dance_style: cleanGenre,
            category_division: cleanCategory,
            representative_name: cleanName,
            representative_furigana: String(representativeFurigana || '').trim().replace(/["\r\n]/g, ''),
            representative_email: cleanEmail,
            phone_number: String(phoneNumber || '').trim().replace(/["\r\n]/g, ''),
            partner_name: cleanPartnerName,
            partner_furigana: String(partnerFurigana || '').trim().replace(/["\r\n]/g, '')
          })
        
        if (basicInfoError) {
          errors.push(`行${i + 1}: 基本情報作成エラー - ${basicInfoError.message}`)
          failedCount++
        } else {
          successCount++
        }
      } catch (error) {
        errors.push(`行${i + 1}: 処理中にエラーが発生しました - ${error instanceof Error ? error.message : '不明なエラー'}`)
        failedCount++
      }
    }

    return NextResponse.json({ 
      success: successCount, 
      failed: failedCount,
      errors: errors.slice(0, 10) // 最初の10個のエラーのみ返す
    })
  } catch (error) {
    console.error('CSV import API error:', error)
    return NextResponse.json({ 
      error: 'インポート処理中にエラーが発生しました',
      details: error instanceof Error ? error.message : '不明なエラー'
    }, { status: 500 })
  }
}