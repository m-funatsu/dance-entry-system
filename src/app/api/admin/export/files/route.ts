import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import JSZip from 'jszip'

export async function GET() {
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

    const adminSupabase = createAdminClient()

    // エントリーファイル情報を取得
    const { data: entryFiles, error: filesError } = await adminSupabase
      .from('entry_files')
      .select(`
        *,
        entries(
          id,
          user_id,
          dance_style,
          team_name,
          participant_names,
          users(name, email)
        )
      `)
      .order('uploaded_at')

    if (filesError) {
      throw new Error('Failed to fetch entry files data')
    }

    if (!entryFiles || entryFiles.length === 0) {
      return NextResponse.json(
        { error: 'No files found to export' },
        { status: 404 }
      )
    }

    // ZIPファイルを作成
    const zip = new JSZip()

    // メタデータファイルを追加
    const metadata = {
      export_info: {
        exported_at: new Date().toISOString(),
        exported_by: user.id,
        total_files: entryFiles.length,
        export_type: 'files_archive'
      },
      files: entryFiles.map(file => ({
        id: file.id,
        entry_id: file.entry_id,
        file_name: file.file_name,
        file_type: file.file_type,
        file_size: file.file_size,
        mime_type: file.mime_type,
        uploaded_at: file.uploaded_at,
        user_name: file.entries?.users?.name || 'Unknown',
        user_email: file.entries?.users?.email || 'Unknown',
        dance_style: file.entries?.dance_style || 'Unknown',
        team_name: file.entries?.team_name || 'Individual'
      }))
    }

    zip.file('metadata.json', JSON.stringify(metadata, null, 2))

    // ファイルタイプ別にフォルダを作成
    const folderMap: { [key: string]: string } = {
      music: '01_Music',
      audio: '02_Audio', 
      photo: '03_Photos',
      video: '04_Videos'
    }

    // 各ファイルをダウンロードしてZIPに追加
    let processedCount = 0
    const failedFiles: { file_name: string; file_path: string; error: string }[] = []

    for (const file of entryFiles) {
      try {
        // Supabaseストレージからファイルをダウンロード
        const { data: fileData, error: downloadError } = await adminSupabase.storage
          .from('files')
          .download(file.file_path)

        if (downloadError || !fileData) {
          console.warn(`Failed to download file: ${file.file_name}`, downloadError)
          failedFiles.push({
            file_name: file.file_name,
            file_path: file.file_path,
            error: downloadError?.message || 'File not found'
          })
          continue
        }

        // ファイル名を安全にする（重複を避けるためIDを追加）
        const folderName = folderMap[file.file_type] || '99_Other'
        const userInfo = file.entries?.users?.name || 'Unknown'
        const safeUserName = userInfo.replace(/[^\w\s-]/g, '_').substring(0, 20)
        const safeFileName = file.file_name.replace(/[^\w\s.-]/g, '_')
        const finalFileName = `${safeUserName}_${file.id.substring(0, 8)}_${safeFileName}`
        
        const filePath = `${folderName}/${finalFileName}`

        // ファイルをZIPに追加
        const arrayBuffer = await fileData.arrayBuffer()
        zip.file(filePath, arrayBuffer)
        
        processedCount++
        
        // 進捗ログ（大量ファイルの場合）
        if (processedCount % 10 === 0) {
          console.log(`Processed ${processedCount}/${entryFiles.length} files`)
        }

      } catch (error) {
        console.error(`Error processing file ${file.file_name}:`, error)
        failedFiles.push({
          file_name: file.file_name,
          file_path: file.file_path,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // 失敗したファイルの情報を追加
    if (failedFiles.length > 0) {
      zip.file('failed_files.json', JSON.stringify(failedFiles, null, 2))
    }

    // README.txtを追加
    const readme = `ダンスエントリーシステム ファイルアーカイブ
===========================================

エクスポート日時: ${new Date().toISOString()}
エクスポート実行者: ${user.id}
処理成功: ${processedCount}/${entryFiles.length} ファイル
処理失敗: ${failedFiles.length} ファイル

フォルダ構成:
- 01_Music: 楽曲ファイル
- 02_Audio: 音源ファイル  
- 03_Photos: 写真ファイル
- 04_Videos: 動画ファイル
- metadata.json: ファイル詳細情報
- failed_files.json: ダウンロード失敗ファイル一覧（存在する場合）

ファイル名形式: ユーザー名_ファイルID_元ファイル名
`

    zip.file('README.txt', readme)

    // ZIPファイルを生成
    console.log('Generating ZIP file...')
    const zipBuffer = await zip.generateAsync({ 
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
    const fileName = `dance_entry_files_${timestamp}.zip`

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': zipBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      }
    })

  } catch (error) {
    console.error('File export error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}