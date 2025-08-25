        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto" style={{maxWidth: '100vw'}}>
            <table className="divide-y divide-gray-200" style={{minWidth: '4000px', width: 'max-content'}}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    システム利用者名
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作品情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    楽曲著作関連情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    楽曲データ添付
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    音響情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    音響データ添付
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    踊り出し
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">
                    照明シーン1
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    照明シーン1イメージ画像
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">
                    照明シーン2
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    照明シーン2イメージ画像
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">
                    照明シーン3
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    照明シーン3イメージ画像
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">
                    照明シーン4
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    照明シーン4イメージ画像
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">
                    照明シーン5
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    照明シーン5イメージ画像
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">
                    照明シーン チェイサー
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    振付師情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    小道具情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    振込確認
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    賞金振込先情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    選考ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappedSemifinalsInfoList.map((semifinalsInfo) => (
                  <tr key={semifinalsInfo.id} className="hover:bg-gray-50">
                    {/* システム利用者名 */}
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {semifinalsInfo.entries?.users?.name || '不明なユーザー'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {semifinalsInfo.entries?.participant_names || 'エントリー名なし'}
                      </div>
                    </td>
                    
                    {/* 作品情報 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">予選からの変更: {semifinalsInfo.music_change_from_preliminary ? 'Yes' : 'No'}</div>
                        <div className="font-medium">{semifinalsInfo.work_title || '未入力'}</div>
                        <div className="text-gray-500">ふりがな: {semifinalsInfo.work_title_kana || '未入力'}</div>
                        <div className="text-gray-500 mt-1">
                          {semifinalsInfo.work_character_story ? 
                            `${semifinalsInfo.work_character_story.slice(0, 50)}${semifinalsInfo.work_character_story.length > 50 ? '...' : ''}` 
                            : '未入力'}
                        </div>
                      </div>
                    </td>

                    {/* 楽曲著作関連情報 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">著作権許諾: {semifinalsInfo.copyright_permission || '未入力'}</div>
                        <div className="text-gray-500">楽曲: {semifinalsInfo.music_title || '未入力'}</div>
                        <div className="text-gray-500">CD: {semifinalsInfo.cd_title || '未入力'}</div>
                        <div className="text-gray-500">アーティスト: {semifinalsInfo.artist || '未入力'}</div>
                        <div className="text-gray-500">レコード番号: {semifinalsInfo.record_number || '未入力'}</div>
                        <div className="text-gray-500">JASRAC: {semifinalsInfo.jasrac_code || '未入力'}</div>
                        <div className="text-gray-500">楽曲種類: {semifinalsInfo.music_type || '未入力'}</div>
                      </div>
                    </td>

                    {/* 楽曲データ添付 */}
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose === 'semifinals'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a href={getFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-500 underline block">
                              🎵 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose === 'semifinals'
                        )) && (
                          <span className="text-xs text-gray-400">ファイルなし</span>
                        )}
                      </div>
                    </td>

                    {/* 音響情報 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">使用方法: {semifinalsInfo.music_usage_method || '未入力'}</div>
                        <div className="text-gray-500">チェイサー曲: {semifinalsInfo.chaser_song_designation || '未入力'}</div>
                        <div className="text-gray-500">フェードアウト開始: {semifinalsInfo.fade_out_start_time || '未入力'}</div>
                        <div className="text-gray-500">フェードアウト完了: {semifinalsInfo.fade_out_complete_time || '未入力'}</div>
                      </div>
                    </td>

                    {/* 音響データ添付 */}
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose === 'chaser'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a href={getFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-500 underline block">
                              🎵 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose === 'chaser'
                        )) && (
                          <span className="text-xs text-gray-400">ファイルなし</span>
                        )}
                      </div>
                    </td>

                    {/* 踊り出し */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        {semifinalsInfo.dance_start_timing || '未入力'}
                      </div>
                    </td>

                    {/* 照明シーン1 */}
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">時間: {semifinalsInfo.scene1_time || '未入力'}</div>
                        <div className="text-gray-500">きっかけ: {semifinalsInfo.scene1_trigger || '未入力'}</div>
                        <div className="text-gray-500">色・系統: {semifinalsInfo.scene1_color_type || '未入力'}</div>
                        <div className="text-gray-500">その他: {semifinalsInfo.scene1_color_other || '未入力'}</div>
                        <div className="text-gray-500">イメージ: {semifinalsInfo.scene1_image || '未入力'}</div>
                        <div className="text-gray-500">備考: {semifinalsInfo.scene1_notes || '未入力'}</div>
                      </div>
                    </td>

                    {/* 照明シーン1イメージ画像 */}
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'scene1_image'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a href={getFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-500 underline block">
                              📸 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'scene1_image'
                        )) && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>

                    {/* 照明シーン2 */}
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">時間: {semifinalsInfo.scene2_time || '未入力'}</div>
                        <div className="text-gray-500">きっかけ: {semifinalsInfo.scene2_trigger || '未入力'}</div>
                        <div className="text-gray-500">色・系統: {semifinalsInfo.scene2_color_type || '未入力'}</div>
                        <div className="text-gray-500">その他: {semifinalsInfo.scene2_color_other || '未入力'}</div>
                        <div className="text-gray-500">イメージ: {semifinalsInfo.scene2_image || '未入力'}</div>
                        <div className="text-gray-500">備考: {semifinalsInfo.scene2_notes || '未入力'}</div>
                      </div>
                    </td>

                    {/* 照明シーン2イメージ画像 */}
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'scene2_image'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a href={getFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-500 underline block">
                              📸 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'scene2_image'
                        )) && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>

                    {/* 照明シーン3 */}
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">時間: {semifinalsInfo.scene3_time || '未入力'}</div>
                        <div className="text-gray-500">きっかけ: {semifinalsInfo.scene3_trigger || '未入力'}</div>
                        <div className="text-gray-500">色・系統: {semifinalsInfo.scene3_color_type || '未入力'}</div>
                        <div className="text-gray-500">その他: {semifinalsInfo.scene3_color_other || '未入力'}</div>
                        <div className="text-gray-500">イメージ: {semifinalsInfo.scene3_image || '未入力'}</div>
                        <div className="text-gray-500">備考: {semifinalsInfo.scene3_notes || '未入力'}</div>
                      </div>
                    </td>

                    {/* 照明シーン3イメージ画像 */}
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'scene3_image'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a href={getFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-500 underline block">
                              📸 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'scene3_image'
                        )) && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>

                    {/* 照明シーン4 */}
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">時間: {semifinalsInfo.scene4_time || '未入力'}</div>
                        <div className="text-gray-500">きっかけ: {semifinalsInfo.scene4_trigger || '未入力'}</div>
                        <div className="text-gray-500">色・系統: {semifinalsInfo.scene4_color_type || '未入力'}</div>
                        <div className="text-gray-500">その他: {semifinalsInfo.scene4_color_other || '未入力'}</div>
                        <div className="text-gray-500">イメージ: {semifinalsInfo.scene4_image || '未入力'}</div>
                        <div className="text-gray-500">備考: {semifinalsInfo.scene4_notes || '未入力'}</div>
                      </div>
                    </td>

                    {/* 照明シーン4イメージ画像 */}
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'scene4_image'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a href={getFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-500 underline block">
                              📸 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'scene4_image'
                        )) && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>

                    {/* 照明シーン5 */}
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">時間: {semifinalsInfo.scene5_time || '未入力'}</div>
                        <div className="text-gray-500">きっかけ: {semifinalsInfo.scene5_trigger || '未入力'}</div>
                        <div className="text-gray-500">色・系統: {semifinalsInfo.scene5_color_type || '未入力'}</div>
                        <div className="text-gray-500">その他: {semifinalsInfo.scene5_color_other || '未入力'}</div>
                        <div className="text-gray-500">イメージ: {semifinalsInfo.scene5_image || '未入力'}</div>
                        <div className="text-gray-500">備考: {semifinalsInfo.scene5_notes || '未入力'}</div>
                      </div>
                    </td>

                    {/* 照明シーン5イメージ画像 */}
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'scene5_image'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a href={getFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-500 underline block">
                              📸 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'scene5_image'
                        )) && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>

                    {/* 照明シーン チェイサー */}
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">時間: {semifinalsInfo.chaser_exit_time || '未入力'}</div>
                        <div className="text-gray-500">きっかけ: {semifinalsInfo.chaser_exit_trigger || '未入力'}</div>
                        <div className="text-gray-500">色・系統: {semifinalsInfo.chaser_exit_color_type || '未入力'}</div>
                        <div className="text-gray-500">その他: {semifinalsInfo.chaser_exit_color_other || '未入力'}</div>
                        <div className="text-gray-500">イメージ: {semifinalsInfo.chaser_exit_image || '未入力'}</div>
                        <div className="text-gray-500">備考: {semifinalsInfo.chaser_exit_notes || '未入力'}</div>
                      </div>
                    </td>

                    {/* 振付師情報 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">振付師①: {semifinalsInfo.choreographer_name || '未入力'}</div>
                        <div className="text-gray-500">フリガナ①: {semifinalsInfo.choreographer_furigana || '未入力'}</div>
                        <div className="font-medium mt-1">振付師②: {semifinalsInfo.choreographer2_name || '未入力'}</div>
                        <div className="text-gray-500">フリガナ②: {semifinalsInfo.choreographer2_furigana || '未入力'}</div>
                      </div>
                    </td>

                    {/* 小道具情報 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">小道具の有無: {semifinalsInfo.props_usage || '未入力'}</div>
                        <div className="text-gray-500 mt-1">利用する小道具: {semifinalsInfo.props_details || '未入力'}</div>
                      </div>
                    </td>

                    {/* 振込確認 */}
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.purpose === 'bank_slip'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a href={getFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-500 underline block">
                              📄 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { purpose?: string }) => 
                          file.purpose === 'bank_slip'
                        )) && (
                          <span className="text-xs text-gray-400">ファイルなし</span>
                        )}
                      </div>
                    </td>

                    {/* 賞金振込先情報 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">銀行: {semifinalsInfo.bank_name || '未入力'}</div>
                        <div className="text-gray-500">支店: {semifinalsInfo.branch_name || '未入力'}</div>
                        <div className="text-gray-500">種類: {semifinalsInfo.account_type || '未入力'}</div>
                        <div className="text-gray-500">番号: {semifinalsInfo.account_number || '未入力'}</div>
                        <div className="text-gray-500">名義: {semifinalsInfo.account_holder || '未入力'}</div>
                      </div>
                    </td>

                    {/* 選考ステータス */}
                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        semifinalsInfo.entries?.status === 'selected' ? 'bg-green-100 text-green-800' :
                        semifinalsInfo.entries?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        semifinalsInfo.entries?.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {semifinalsInfo.entries?.status === 'pending' && '審査待ち'}
                        {semifinalsInfo.entries?.status === 'submitted' && '提出済み'}
                        {semifinalsInfo.entries?.status === 'selected' && '選考通過'}
                        {semifinalsInfo.entries?.status === 'rejected' && '不選考'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>