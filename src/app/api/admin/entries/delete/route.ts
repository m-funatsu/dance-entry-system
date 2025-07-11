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
    const { entryIds } = body

    // 入力値検証
    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return NextResponse.json(
        { error: 'Entry IDs are required' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // 削除前に関連データを取得
    const { data: entriesData } = await adminSupabase
      .from('entries')
      .select('id, user_id, entry_files(id, file_path)')
      .in('id', entryIds)

    if (!entriesData || entriesData.length === 0) {
      return NextResponse.json(
        { error: 'No entries found to delete' },
        { status: 404 }
      )
    }

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

    // 3. エントリーを削除
    deletePromises.push(
      adminSupabase
        .from('entries')
        .delete()
        .in('id', entryIds)
    )

    // 全ての削除処理を実行
    const results = await Promise.all(deletePromises)

    // エラーチェック
    for (const result of results) {
      if (result.error) {
        console.error('Delete error:', result.error)
        return NextResponse.json(
          { error: 'Failed to delete entries' },
          { status: 500 }
        )
      }
    }

    // ファイルストレージからの削除（失敗しても処理を続行）
    const fileDeletePromises: Promise<any>[] = []
    const filePaths: string[] = []
    
    for (const entry of entriesData) {
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

    let fileDeleteResults: any[] = []
    if (fileDeletePromises.length > 0) {
      try {
        console.log(`Attempting to delete ${fileDeletePromises.length} files from storage:`, filePaths)
        fileDeleteResults = await Promise.all(fileDeletePromises)
        
        // 削除結果を詳細にログ
        let successCount = 0
        let failCount = 0
        
        fileDeleteResults.forEach((result, index) => {
          if (result.error) {
            console.error(`Failed to delete file ${filePaths[index]}:`, result.error)
            failCount++
          } else {
            console.log(`Successfully deleted file ${filePaths[index]}`)
            successCount++
          }
        })
        
        console.log(`File deletion summary: ${successCount} succeeded, ${failCount} failed`)
      } catch (error) {
        console.warn('File deletion warning:', error)
        // ファイル削除の失敗は致命的ではないため、警告として扱う
      }
    }

    // 削除結果のサマリーを作成
    const successFiles = fileDeleteResults.filter(r => !r.error).length
    const failedFiles = fileDeleteResults.filter(r => r.error).length
    
    return NextResponse.json({ 
      success: true, 
      message: `${entryIds.length} entries deleted successfully`,
      deletedCount: entryIds.length,
      filesDeletionSummary: {
        attempted: fileDeletePromises.length,
        succeeded: successFiles,
        failed: failedFiles,
        details: fileDeletePromises.length > 0 ? 
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