import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request: NextRequest) {
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

    const body = await request.json()
    const { entryIds, userIds } = body

    console.log('🗑️ [DELETE API] 削除リクエスト:', {
      entryIds,
      userIds,
      hasEntryIds: entryIds && Array.isArray(entryIds) && entryIds.length > 0,
      hasUserIds: userIds && Array.isArray(userIds) && userIds.length > 0
    })

    // 入力値検証 - エントリーIDまたはユーザーIDのどちらかが必要
    if ((!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) && 
        (!userIds || !Array.isArray(userIds) || userIds.length === 0)) {
      return NextResponse.json(
        { error: 'Entry IDs or User IDs are required' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()
    let totalDeleted = 0
    const deletionSummary: string[] = []

    // エントリー削除処理
    if (entryIds && entryIds.length > 0) {
      console.log('🗑️ [DELETE API] エントリー削除開始:', entryIds)

      // 削除前に関連データを取得
      const { data: entriesData } = await adminSupabase
        .from('entries')
        .select('id, user_id, entry_files(id, file_path)')
        .in('id', entryIds)

      console.log('📂 [DELETE API] 削除対象エントリーデータ:', entriesData)

      if (entriesData && entriesData.length > 0) {
        // 削除処理をトランザクション的に実行
        const deletePromises = []

        // 1. 関連する選考結果を削除
        deletePromises.push(
          adminSupabase
            .from('selections')
            .delete()
            .in('entry_id', entryIds)
        )

        // 2. 関連するファイル情報を削除
        deletePromises.push(
          adminSupabase
            .from('entry_files')
            .delete()
            .in('entry_id', entryIds)
        )

        // 3. 関連フォームデータを削除
        deletePromises.push(
          adminSupabase.from('basic_info').delete().in('entry_id', entryIds)
        )
        deletePromises.push(
          adminSupabase.from('preliminary_info').delete().in('entry_id', entryIds)
        )
        deletePromises.push(
          adminSupabase.from('program_info').delete().in('entry_id', entryIds)
        )
        deletePromises.push(
          adminSupabase.from('semifinals_info').delete().in('entry_id', entryIds)
        )
        deletePromises.push(
          adminSupabase.from('finals_info').delete().in('entry_id', entryIds)
        )
        deletePromises.push(
          adminSupabase.from('applications_info').delete().in('entry_id', entryIds)
        )
        deletePromises.push(
          adminSupabase.from('sns_info').delete().in('entry_id', entryIds)
        )

        // 4. エントリーを削除
        deletePromises.push(
          adminSupabase
            .from('entries')
            .delete()
            .in('id', entryIds)
        )

        console.log('🗑️ [DELETE API] エントリー関連データ削除実行')
        const results = await Promise.all(deletePromises)

        // エラーチェック
        for (const result of results) {
          if (result.error) {
            console.error('❌ [DELETE API] エントリー削除エラー:', result.error)
            return NextResponse.json(
              { error: 'Failed to delete entries' },
              { status: 500 }
            )
          }
        }

        console.log('✅ [DELETE API] エントリー削除成功')
        totalDeleted += entryIds.length
        deletionSummary.push(`エントリー ${entryIds.length}件`)
      } else {
        console.log('ℹ️ [DELETE API] 削除対象のエントリーが見つかりません')
      }
    }

    // ユーザー削除処理
    if (userIds && userIds.length > 0) {
      console.log('👤 [DELETE API] ユーザー削除開始:', userIds)

      // ユーザー削除（認証ユーザーとusersテーブル両方）
      for (const userId of userIds) {
        try {
          console.log(`👤 [DELETE API] ユーザー削除処理: ${userId}`)
          
          // 認証システムからユーザーを削除
          const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(userId)
          if (authDeleteError) {
            console.error(`❌ [DELETE API] 認証ユーザー削除エラー (${userId}):`, authDeleteError)
          } else {
            console.log(`✅ [DELETE API] 認証ユーザー削除成功 (${userId})`)
          }

          // usersテーブルからもユーザーを削除
          const { error: userDeleteError } = await adminSupabase
            .from('users')
            .delete()
            .eq('id', userId)

          if (userDeleteError) {
            console.error(`❌ [DELETE API] usersテーブル削除エラー (${userId}):`, userDeleteError)
          } else {
            console.log(`✅ [DELETE API] usersテーブル削除成功 (${userId})`)
          }

          totalDeleted++
          
        } catch (userError) {
          console.error(`💥 [DELETE API] ユーザー削除で予期しないエラー (${userId}):`, userError)
        }
      }
      
      deletionSummary.push(`ユーザー ${userIds.length}件`)
    }

    // ファイルストレージからの削除処理は、エントリーがある場合のみ実行
    let fileDeleteResults: { data: unknown; error: unknown }[] = []
    if (entryIds && entryIds.length > 0) {
      // 削除前に関連データを再取得（ファイル削除用）
      const { data: entriesDataForFiles } = await adminSupabase
        .from('entries')
        .select('id, user_id, entry_files(id, file_path)')
        .in('id', entryIds)

      const fileDeletePromises: Promise<{ data: unknown; error: unknown }>[] = []
      const filePaths: string[] = []
      
      if (entriesDataForFiles) {
        for (const entry of entriesDataForFiles) {
          if (entry.entry_files && entry.entry_files.length > 0) {
            for (const file of entry.entry_files) {
              if (file.file_path) {
                filePaths.push(file.file_path)
                fileDeletePromises.push(
                  adminSupabase.storage
                    .from('files')
                    .remove([file.file_path])
                )
              }
            }
          }
        }
      }

      if (fileDeletePromises.length > 0) {
        try {
          console.log(`📁 [DELETE API] ファイルストレージ削除開始: ${fileDeletePromises.length}ファイル`)
          fileDeleteResults = await Promise.all(fileDeletePromises)
          
          // 削除結果を詳細にログ
          let successCount = 0
          let failCount = 0
          
          fileDeleteResults.forEach((result, index) => {
            if (result.error) {
              console.error(`❌ [DELETE API] ファイル削除エラー ${filePaths[index]}:`, result.error)
              failCount++
            } else {
              console.log(`✅ [DELETE API] ファイル削除成功 ${filePaths[index]}`)
              successCount++
            }
          })
          
          console.log(`📁 [DELETE API] ファイル削除サマリー: ${successCount}成功, ${failCount}失敗`)
        } catch (error) {
          console.warn('⚠️ [DELETE API] ファイル削除警告:', error)
        }
      }
    }

    // 削除結果のサマリーを作成
    const successFiles = fileDeleteResults.filter(r => !r.error).length
    const failedFiles = fileDeleteResults.filter(r => r.error).length
    
    console.log('🎉 [DELETE API] 削除処理完了:', {
      totalDeleted,
      deletionSummary,
      filesAttempted: fileDeleteResults.length,
      filesSucceeded: successFiles,
      filesFailed: failedFiles
    })
    
    return NextResponse.json({ 
      success: true, 
      message: `${totalDeleted} items deleted successfully`,
      deletedCount: totalDeleted,
      deletionSummary: deletionSummary.join(', '),
      filesDeletionSummary: {
        attempted: fileDeleteResults.length,
        succeeded: successFiles,
        failed: failedFiles,
        details: fileDeleteResults.length > 0 ? 
          `${successFiles} files deleted from storage, ${failedFiles} failed` :
          'No files to delete'
      }
    })

  } catch (error) {
    console.error('Entry deletion error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}