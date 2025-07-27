'use client'

import { useState, useEffect } from 'react'
import { ItemRecord, RecycleBinItem } from '@/types'
import { ParsedItem } from '@/lib/ai'
import { LocalStorage } from '@/lib/storage'

export default function Home() {
  const [input, setInput] = useState('')
  const [records, setRecords] = useState<ItemRecord[]>([])
  const [searchResults, setSearchResults] = useState<ItemRecord[]>([])
  const [lastAction, setLastAction] = useState<'record' | 'search' | 'delete' | 'classify' | 'statistics' | null>(null)
  const [actionResult, setActionResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastSearchContext, setLastSearchContext] = useState<ItemRecord[]>([])
  const [recycleBin, setRecycleBin] = useState<RecycleBinItem[]>([])
  const [showRecycleBin, setShowRecycleBin] = useState(false)
  const [showDataMenu, setShowDataMenu] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-menu="data-menu"]')) {
        setShowDataMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // 初始化数据加载
  useEffect(() => {
    try {
      // 检查版本兼容性
      LocalStorage.checkVersion()
      
      // 加载数据
      const loadedRecords = LocalStorage.loadRecords()
      const loadedRecycleBin = LocalStorage.loadRecycleBin()
      
      setRecords(loadedRecords)
      setRecycleBin(loadedRecycleBin)
      setIsDataLoaded(true)
      
      // 显示加载统计
      const info = LocalStorage.getStorageInfo()
      if (info.recordsCount > 0 || info.recycleBinCount > 0) {
        setActionResult(`已加载 ${info.recordsCount} 条记录和 ${info.recycleBinCount} 条回收站数据 (${info.storageUsed})`)
        setLastAction('record')
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setIsDataLoaded(true)
    }
  }, [])

  // 自动保存记录
  useEffect(() => {
    if (isDataLoaded) {
      LocalStorage.saveRecords(records)
    }
  }, [records, isDataLoaded])

  // 自动保存回收站
  useEffect(() => {
    if (isDataLoaded) {
      LocalStorage.saveRecycleBin(recycleBin)
    }
  }, [recycleBin, isDataLoaded])

  // 自动清理超过30天的回收站项目
  useEffect(() => {
    const cleanupRecycleBin = () => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      setRecycleBin(prev => prev.filter(item => 
        new Date(item.deletedAt) > thirtyDaysAgo
      ))
    }

    // 每天检查一次
    const interval = setInterval(cleanupRecycleBin, 24 * 60 * 60 * 1000)
    
    // 页面加载时立即检查一次
    cleanupRecycleBin()
    
    return () => clearInterval(interval)
  }, [])

  const detectIntent = (text: string): 'record' | 'search' | 'delete' | 'classify' | 'statistics' => {
    const recordKeywords = ['放在', '存放', '收纳', '放到', '藏在', '存在', '我把']
    const searchKeywords = ['在哪', '找找', '查询', '寻找', '哪里', '位置']
    const deleteKeywords = ['删除', '移除', '清空', '去掉', '删掉']
    const classifyKeywords = ['标签', '分类', '归类', '打标', '加上', '设置为']
    const statisticsKeywords = ['统计', '有多少', '总数', '数量', '计算', '汇总']
    
    const lowerText = text.toLowerCase()
    
    const hasRecordKeyword = recordKeywords.some(keyword => lowerText.includes(keyword))
    const hasSearchKeyword = searchKeywords.some(keyword => lowerText.includes(keyword))
    const hasDeleteKeyword = deleteKeywords.some(keyword => lowerText.includes(keyword))
    const hasClassifyKeyword = classifyKeywords.some(keyword => lowerText.includes(keyword))
    const hasStatisticsKeyword = statisticsKeywords.some(keyword => lowerText.includes(keyword))
    
    // 优先级：删除 > 分类 > 统计 > 记录 > 搜索
    if (hasDeleteKeyword) return 'delete'
    if (hasClassifyKeyword) return 'classify'
    if (hasStatisticsKeyword) return 'statistics'
    if (hasRecordKeyword && !hasSearchKeyword) return 'record'
    if (hasSearchKeyword && !hasRecordKeyword) return 'search'
    
    // 默认判断
    if (hasRecordKeyword) return 'record'
    return 'search'
  }

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    
    try {
      // 使用AI解析用户输入，传递上下文信息
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input,
          context: {
            lastAction,
            lastSearchResults: lastSearchContext,
            hasSearchResults: searchResults.length > 0
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('AI parsing failed')
      }
      
      const parsed: ParsedItem = await response.json()
      
      switch (parsed.intent) {
        case 'record':
          await handleAIRecord(parsed)
          break
        case 'search':
          await handleAISearch(parsed)
          break
        case 'delete':
          await handleAIDelete(parsed, input)
          break
        case 'classify':
          await handleAIClassify(parsed)
          break
        case 'statistics':
          handleStatistics()
          break
      }
    } catch (error) {
      console.error('AI processing error:', error)
      // 降级到原有逻辑
      const intent = detectIntent(input)
      switch (intent) {
        case 'record': handleAddRecord(); break
        case 'search': handleSearch(); break
        case 'delete': handleDelete(); break
        case 'classify': handleClassify(); break
        case 'statistics': handleStatistics(); break
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddRecord = () => {
    const newRecord: ItemRecord = {
      id: Date.now().toString(),
      userId: 'user1',
      item: extractItem(input),
      location: extractLocation(input),
      createdAt: new Date().toISOString(),
      rawInput: input,
      source: 'text',
      tags: []
    }

    setRecords(prev => [...prev, newRecord])
    setLastAction('record')
    setSearchResults([])
    setInput('')
  }

  // AI增强的处理函数
  const handleAIRecord = async (parsed: ParsedItem) => {
    const newRecord: ItemRecord = {
      id: Date.now().toString(),
      userId: 'user1',
      item: parsed.item,
      location: parsed.location,
      createdAt: new Date().toISOString(),
      rawInput: input,
      source: 'text',
      tags: []
    }

    setRecords(prev => [...prev, newRecord])
    setLastAction('record')
    setSearchResults([])
    setActionResult(`解析置信度: ${(parsed.confidence * 100).toFixed(1)}%`)
    setInput('')
  }

  const handleAISearch = async (parsed: ParsedItem) => {
    try {
      // 使用AI语义搜索
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: parsed.item || input, records })
      })
      
      if (response.ok) {
        const results = await response.json()
        setSearchResults(results)
        setLastSearchContext(results) // 保存搜索上下文
      } else {
        // 降级到简单搜索
        handleSearch()
      }
    } catch (error) {
      console.error('AI search error:', error)
      // 降级到简单搜索
      handleSearch()
    }
    
    setLastAction('search')
    setActionResult(`AI语义搜索 (置信度: ${(parsed.confidence * 100).toFixed(1)}%)`)
  }

  const handleAIDelete = async (parsed: ParsedItem, originalInput: string) => {
    const itemToDelete = parsed.item
    const initialCount = records.length
    
    // 检查是否是"删除这条结果"类型的指代
    const isContextualDelete = originalInput.includes('这条') || originalInput.includes('这个') || 
                               originalInput.includes('当前') || originalInput.includes('这些')
    
    let updatedRecords: ItemRecord[]
    let deletedCount = 0
    
    if (isContextualDelete && lastSearchContext.length > 0) {
      // 删除上次搜索结果中的记录
      const idsToDelete = new Set(lastSearchContext.map(r => r.id))
      const itemsToDelete = records.filter(record => idsToDelete.has(record.id))
      updatedRecords = records.filter(record => !idsToDelete.has(record.id))
      deletedCount = itemsToDelete.length
      
      // 移动到回收站
      moveToRecycleBin(itemsToDelete, '用户删除搜索结果')
      
      setActionResult(deletedCount > 0 ? 
        `已删除 ${deletedCount} 条搜索结果记录 (已移至回收站)` : 
        '未找到要删除的搜索结果'
      )
    } else if (itemToDelete && itemToDelete.trim() !== '') {
      // 标准删除：根据物品名称
      const itemsToDelete = records.filter(record => 
        record.item.toLowerCase().includes(itemToDelete.toLowerCase()) ||
        record.location.toLowerCase().includes(itemToDelete.toLowerCase()) ||
        record.rawInput.toLowerCase().includes(itemToDelete.toLowerCase())
      )
      updatedRecords = records.filter(record => 
        !record.item.toLowerCase().includes(itemToDelete.toLowerCase()) &&
        !record.location.toLowerCase().includes(itemToDelete.toLowerCase()) &&
        !record.rawInput.toLowerCase().includes(itemToDelete.toLowerCase())
      )
      deletedCount = itemsToDelete.length
      
      // 移动到回收站
      moveToRecycleBin(itemsToDelete, `关键词删除: ${itemToDelete}`)
      
      setActionResult(deletedCount > 0 ? 
        `已删除 ${deletedCount} 条相关记录 (已移至回收站，关键词: ${itemToDelete})` : 
        `未找到相关记录 (搜索: ${itemToDelete})`
      )
    } else {
      // 无法确定删除目标，不执行删除
      updatedRecords = records
      setActionResult('无法确定删除目标，请明确指定要删除的物品名称')
    }
    
    setRecords(updatedRecords)
    setSearchResults([])
    setLastSearchContext([]) // 清除搜索上下文
    setLastAction('delete')
    setInput('')
  }

  const handleAIClassify = async (parsed: ParsedItem) => {
    const item = parsed.item
    const tag = parsed.tag || '默认标签'
    let updatedCount = 0
    
    const updatedRecords = records.map(record => {
      if (record.item.toLowerCase().includes(item.toLowerCase()) ||
          record.rawInput.toLowerCase().includes(item.toLowerCase())) {
        if (!record.tags.includes(tag)) {
          updatedCount++
          return { ...record, tags: [...record.tags, tag] }
        }
      }
      return record
    })
    
    setRecords(updatedRecords)
    setSearchResults([])
    setLastAction('classify')
    setActionResult(updatedCount > 0 ? 
      `已为 ${updatedCount} 个物品添加标签「${tag}」(AI识别: ${item})` : 
      `未找到相关物品 (搜索: ${item})`
    )
    setInput('')
  }

  const handleSearch = () => {
    const results = records.filter(record => 
      record.item.toLowerCase().includes(input.toLowerCase()) ||
      record.location.toLowerCase().includes(input.toLowerCase()) ||
      record.rawInput.toLowerCase().includes(input.toLowerCase())
    )
    
    setSearchResults(results)
    setLastSearchContext(results) // 保存搜索上下文
    setLastAction('search')
    setActionResult('')
  }

  // 移动记录到回收站
  const moveToRecycleBin = (items: ItemRecord[], reason: string) => {
    const recycleBinItems: RecycleBinItem[] = items.map(item => ({
      ...item,
      deletedAt: new Date().toISOString(),
      deleteReason: reason
    }))
    setRecycleBin(prev => [...prev, ...recycleBinItems])
  }

  // 从回收站恢复记录
  const restoreFromRecycleBin = (item: RecycleBinItem) => {
    const { deletedAt, deleteReason, ...originalItem } = item
    setRecords(prev => [...prev, originalItem])
    setRecycleBin(prev => prev.filter(r => r.id !== item.id))
    setActionResult(`已恢复物品: ${item.item}`)
    setLastAction('record')
  }

  // 永久删除
  const permanentDelete = (item: RecycleBinItem) => {
    setRecycleBin(prev => prev.filter(r => r.id !== item.id))
    setActionResult(`已永久删除: ${item.item}`)
    setLastAction('delete')
  }

  // 清空回收站
  const clearRecycleBin = () => {
    const count = recycleBin.length
    setRecycleBin([])
    setActionResult(`已清空回收站 (${count} 个项目)`)
    setLastAction('delete')
  }

  // 清空所有数据
  const clearAllData = () => {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      setRecords([])
      setRecycleBin([])
      LocalStorage.clearAll()
      setActionResult('已清空所有数据')
      setLastAction('delete')
    }
  }

  // 导出数据
  const exportData = () => {
    try {
      const data = LocalStorage.exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `item-keeper-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setActionResult('数据导出成功')
      setLastAction('record')
    } catch (error) {
      setActionResult('数据导出失败')
      setLastAction('delete')
      console.error('Export error:', error)
    }
  }

  // 导入数据
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const result = LocalStorage.importData(content)
        
        if (result.success) {
          // 重新加载数据
          const loadedRecords = LocalStorage.loadRecords()
          const loadedRecycleBin = LocalStorage.loadRecycleBin()
          setRecords(loadedRecords)
          setRecycleBin(loadedRecycleBin)
          setActionResult(result.message)
          setLastAction('record')
        } else {
          setActionResult(result.message)
          setLastAction('delete')
        }
      } catch (error) {
        setActionResult('文件读取失败')
        setLastAction('delete')
        console.error('Import error:', error)
      }
    }
    reader.readAsText(file)
    
    // 清空input以允许重复选择同一文件
    event.target.value = ''
  }

  // 手动删除单个搜索结果
  const deleteSearchResult = (itemToDelete: ItemRecord) => {
    if (confirm(`确定要删除 "${itemToDelete.item}" 吗？`)) {
      // 移动到回收站
      moveToRecycleBin([itemToDelete], '手动删除搜索结果')
      
      // 从记录中移除
      setRecords(prev => prev.filter(record => record.id !== itemToDelete.id))
      
      // 从搜索结果中移除
      setSearchResults(prev => prev.filter(record => record.id !== itemToDelete.id))
      
      // 更新搜索上下文
      setLastSearchContext(prev => prev.filter(record => record.id !== itemToDelete.id))
      
      setActionResult(`已删除 "${itemToDelete.item}" (已移至回收站)`)
      setLastAction('delete')
    }
  }

  const handleDelete = () => {
    const itemToDelete = extractItemFromQuery(input)
    const itemsToDelete = records.filter(record => 
      record.item.toLowerCase().includes(itemToDelete.toLowerCase()) ||
      record.location.toLowerCase().includes(itemToDelete.toLowerCase()) ||
      record.rawInput.toLowerCase().includes(itemToDelete.toLowerCase())
    )
    
    const updatedRecords = records.filter(record => 
      !record.item.toLowerCase().includes(itemToDelete.toLowerCase()) &&
      !record.location.toLowerCase().includes(itemToDelete.toLowerCase()) &&
      !record.rawInput.toLowerCase().includes(itemToDelete.toLowerCase())
    )
    
    const deletedCount = itemsToDelete.length
    
    // 移动到回收站
    moveToRecycleBin(itemsToDelete, `关键词删除: ${itemToDelete}`)
    
    setRecords(updatedRecords)
    setSearchResults([])
    setLastAction('delete')
    setActionResult(deletedCount > 0 ? 
      `已删除 ${deletedCount} 条相关记录 (已移至回收站)` : 
      '未找到相关记录'
    )
    setInput('')
  }

  const handleClassify = () => {
    const { item, tag } = extractItemAndTag(input)
    let updatedCount = 0
    
    const updatedRecords = records.map(record => {
      if (record.item.toLowerCase().includes(item.toLowerCase()) ||
          record.rawInput.toLowerCase().includes(item.toLowerCase())) {
        if (!record.tags.includes(tag)) {
          updatedCount++
          return { ...record, tags: [...record.tags, tag] }
        }
      }
      return record
    })
    
    setRecords(updatedRecords)
    setSearchResults([])
    setLastAction('classify')
    setActionResult(updatedCount > 0 ? `已为 ${updatedCount} 个物品添加标签「${tag}」` : '未找到相关物品')
    setInput('')
  }

  const handleStatistics = () => {
    const stats = generateStatistics()
    setSearchResults([])
    setLastAction('statistics')
    setActionResult(stats)
    setInput('')
  }

  // 简单的文本解析函数（后续会被AI替代）
  const extractItem = (text: string): string => {
    const match = text.match(/把(.+?)放在/)
    return match ? match[1] : text.slice(0, 10)
  }

  const extractLocation = (text: string): string => {
    const match = text.match(/放在(.+)/)
    return match ? match[1] : '未知位置'
  }

  const extractItemFromQuery = (text: string): string => {
    // 删除操作的物品提取
    const deleteMatch = text.match(/删除(.+?)记录/) || text.match(/删除(.+)/) || text.match(/移除(.+)/)
    if (deleteMatch) return deleteMatch[1].trim()
    
    // 通用物品名称提取
    const commonWords = ['删除', '移除', '清空', '记录', '的', '我的']
    let cleanText = text
    commonWords.forEach(word => {
      cleanText = cleanText.replace(new RegExp(word, 'g'), '')
    })
    return cleanText.trim() || text
  }

  const extractItemAndTag = (text: string): { item: string; tag: string } => {
    // 匹配 "给XXX加上XXX标签" 或 "把XXX设置为XXX分类"
    let itemMatch = text.match(/给(.+?)加上/) || text.match(/把(.+?)设置为/)
    let tagMatch = text.match(/加上(.+?)标签/) || text.match(/设置为(.+?)分类/) || text.match(/标签(.+)/)
    
    if (!itemMatch || !tagMatch) {
      // 简单分割，假设格式为 "物品名 标签名"
      const words = text.split(/\s+/)
      return {
        item: words[0] || '',
        tag: words[words.length - 1] || '默认标签'
      }
    }
    
    return {
      item: itemMatch[1].trim(),
      tag: tagMatch[1].trim().replace('标签', '').replace('分类', '')
    }
  }

  const generateStatistics = (): string => {
    if (records.length === 0) {
      return '📊 当前没有任何物品记录'
    }

    const totalItems = records.length
    const locations = new Set(records.map(r => r.location)).size
    const tagStats = records.reduce((acc, record) => {
      record.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    const recentItems = records.slice(-3).map(r => r.item).join('、')
    
    let stats = `📊 物品统计报告\n\n`
    stats += `📦 总物品数：${totalItems} 个\n`
    stats += `📍 存储位置：${locations} 个\n`
    
    if (Object.keys(tagStats).length > 0) {
      stats += `🏷️ 标签分布：\n`
      Object.entries(tagStats)
        .sort(([,a], [,b]) => b - a)
        .forEach(([tag, count]) => {
          stats += `  • ${tag}：${count} 个\n`
        })
    }
    
    stats += `\n🔗 最近记录：${recentItems}`
    
    return stats
  }

  return (
    <div className="space-y-8">
      {/* 顶部工具栏 */}
      <div className="flex justify-between items-center">
        <div></div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRecycleBin(!showRecycleBin)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            🗑️ 回收站
            {recycleBin.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {recycleBin.length}
              </span>
            )}
          </button>
          
          <div className="relative" data-menu="data-menu">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDataMenu(!showDataMenu)
              }}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              📁 数据
            </button>
            {showDataMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                <button
                  onClick={exportData}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-t-lg"
                >
                  📤 导出数据
                </button>
                <label className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer">
                  📥 导入数据
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={clearAllData}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-b-lg"
                >
                  🗑️ 清空所有数据
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 回收站界面 */}
      {showRecycleBin && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-orange-400 mx-2 sm:mx-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              🗑️ 回收站 ({recycleBin.length} 个项目)
            </h2>
            {recycleBin.length > 0 && (
              <button
                onClick={clearRecycleBin}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                清空回收站
              </button>
            )}
          </div>
          
          {recycleBin.length === 0 ? (
            <p className="text-gray-500 text-center py-8">回收站为空</p>
          ) : (
            <div className="space-y-3">
              {recycleBin.map(item => (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.item}</p>
                      <p className="text-gray-600">位置：{item.location}</p>
                      {item.tags.length > 0 && (
                        <div className="mt-2">
                          {item.tags.map(tag => (
                            <span key={tag} className="inline-block bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded mr-1">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-gray-500 mt-1">{item.rawInput}</p>
                      <div className="text-xs text-gray-400 mt-2">
                        <p>删除时间：{new Date(item.deletedAt).toLocaleString('zh-CN')}</p>
                        <p>删除原因：{item.deleteReason}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => restoreFromRecycleBin(item)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        恢复
                      </button>
                      <button
                        onClick={() => permanentDelete(item)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        永久删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 智能输入区域 */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mx-2 sm:mx-0">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          智能物品助手
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          支持记录、查询、删除、分类、统计 - 一个输入框搞定所有需求
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="试试：我把身份证放在抽屉里 / 身份证在哪 / 删除身份证 / 给身份证加上证件标签 / 统计我的物品"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base resize-none min-h-[48px] max-h-32"
            rows={1}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            onInput={(e) => {
              const textarea = e.target as HTMLTextAreaElement
              textarea.style.height = 'auto'
              textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px'
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 sm:px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
          >
            {isLoading ? '🤖 处理中...' : '发送'}
          </button>
        </div>
        
        {/* 操作反馈 */}
        {lastAction === 'record' && (
          <div className="mt-4 p-3 bg-green-50 rounded border-l-4 border-green-400">
            <p className="text-green-800 font-medium">✅ 记录成功！</p>
            {actionResult && <p className="text-green-700 text-sm mt-1">{actionResult}</p>}
          </div>
        )}

        {lastAction === 'delete' && actionResult && (
          <div className="mt-4 p-3 bg-red-50 rounded border-l-4 border-red-400">
            <p className="text-red-800 font-medium">🗑️ {actionResult}</p>
          </div>
        )}

        {lastAction === 'classify' && actionResult && (
          <div className="mt-4 p-3 bg-purple-50 rounded border-l-4 border-purple-400">
            <p className="text-purple-800 font-medium">🏷️ {actionResult}</p>
          </div>
        )}

        {lastAction === 'statistics' && actionResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded border-l-4 border-gray-400">
            <pre className="text-gray-800 text-sm whitespace-pre-line font-mono">{actionResult}</pre>
          </div>
        )}

        {/* 搜索结果 */}
        {lastAction === 'search' && (
          <div className="mt-4">
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">🔍 找到以下结果：</h3>
                {actionResult && <p className="text-blue-600 text-sm">{actionResult}</p>}
                {searchResults.map(record => (
                  <div key={record.id} className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-blue-900">{record.item}</p>
                        <p className="text-blue-700">📍 位置：{record.location}</p>
                        {record.tags.length > 0 && (
                          <div className="mt-2">
                            {record.tags.map(tag => (
                              <span key={tag} className="inline-block bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-blue-600 mt-1">原始记录：{record.rawInput}</p>
                      </div>
                      <button
                        onClick={() => deleteSearchResult(record)}
                        className="ml-3 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors flex-shrink-0"
                        title={`删除 ${record.item}`}
                      >
                        🗑️ 删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                <p className="text-yellow-800">😅 没有找到相关物品，试试其他关键词？</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 所有记录列表 */}
      {records.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mx-2 sm:mx-0">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            所有记录 ({records.length})
          </h2>
          <div className="space-y-3">
            {records.map(record => (
              <div key={record.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{record.item}</p>
                    <p className="text-gray-600">位置：{record.location}</p>
                    {record.tags.length > 0 && (
                      <div className="mt-2">
                        {record.tags.map(tag => (
                          <span key={tag} className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded mr-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {record.rawInput}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <span className="text-xs text-gray-400">
                      {new Date(record.createdAt).toLocaleString('zh-CN')}
                    </span>
                    <button
                      onClick={() => deleteSearchResult(record)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                      title={`删除 ${record.item}`}
                    >
                      🗑️ 删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}