'use client'

import { useState, useEffect } from 'react'
import { ItemRecord, RecycleBinItem } from '@/types'
import { ParsedItem } from '@/lib/ai'
import { LocalStorage } from '@/lib/storage'
import { SyncManager } from '@/lib/sync'
import { useAuth } from './AuthProvider'

export default function ItemKeeperApp() {
  const { user } = useAuth()
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
  const [showSyncMenu, setShowSyncMenu] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{
    localRecords: number
    localRecycleBin: number
    cloudRecords: number
    cloudRecycleBin: number
    lastSync?: string
  } | null>(null)

  const syncManager = new SyncManager()
  
  // 检查是否配置了 Supabase 环境变量
  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-menu="data-menu"]')) {
        setShowDataMenu(false)
      }
      if (!target.closest('[data-menu="sync-menu"]')) {
        setShowSyncMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // 初始化数据加载
  useEffect(() => {
    try {
      LocalStorage.checkVersion()
      const loadedRecords = LocalStorage.loadRecords()
      const loadedRecycleBin = LocalStorage.loadRecycleBin()
      
      setRecords(loadedRecords)
      setRecycleBin(loadedRecycleBin)
      setIsDataLoaded(true)
      
      const info = LocalStorage.getStorageInfo()
      if (info.recordsCount > 0 || info.recycleBinCount > 0) {
        setActionResult(`已加载 ${info.recordsCount} 条记录和 ${info.recycleBinCount} 条回收站数据 (${info.storageUsed})`)
        setLastAction('record')
      }

      // 如果用户已登录且配置了 Supabase，获取同步状态
      if (user && isSupabaseConfigured) {
        updateSyncStatus()
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setIsDataLoaded(true)
    }
  }, [user])

  // 自动保存和同步
  useEffect(() => {
    if (isDataLoaded) {
      LocalStorage.saveRecords(records)
      // 如果用户已登录且配置了 Supabase，实时同步到云端
      if (user && isSupabaseConfigured && records.length > 0) {
        // 防抖延迟同步
        const timeoutId = setTimeout(() => {
          updateSyncStatus()
        }, 1000)
        return () => clearTimeout(timeoutId)
      }
    }
  }, [records, isDataLoaded, user])

  useEffect(() => {
    if (isDataLoaded) {
      LocalStorage.saveRecycleBin(recycleBin)
    }
  }, [recycleBin, isDataLoaded])

  // 自动清理回收站
  useEffect(() => {
    const cleanupRecycleBin = () => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      setRecycleBin(prev => prev.filter(item => 
        new Date(item.deletedAt) > thirtyDaysAgo
      ))
    }

    const interval = setInterval(cleanupRecycleBin, 24 * 60 * 60 * 1000)
    cleanupRecycleBin()
    
    return () => clearInterval(interval)
  }, [])

  // 更新同步状态
  const updateSyncStatus = async () => {
    if (!user || !isSupabaseConfigured) return
    
    const status = await syncManager.getSyncStatus(user.id)
    setSyncStatus(status)
  }

  // 同步到云端
  const handleSyncToCloud = async () => {
    if (!user || !isSupabaseConfigured) {
      setActionResult('请先登录账号才能使用同步功能')
      setLastAction('delete')
      return
    }

    setIsLoading(true)
    const result = await syncManager.syncToCloud(user.id)
    
    if (result.success) {
      syncManager.setLastSyncTime()
      await updateSyncStatus()
    }
    
    setActionResult(result.message)
    setLastAction(result.success ? 'record' : 'delete')
    setIsLoading(false)
    setShowSyncMenu(false)
  }

  // 从云端同步
  const handleSyncFromCloud = async () => {
    if (!user || !isSupabaseConfigured) {
      setActionResult('请先登录账号才能使用同步功能')
      setLastAction('delete')
      return
    }

    setIsLoading(true)
    const result = await syncManager.syncFromCloud(user.id)
    
    if (result.success) {
      // 重新加载本地数据
      const loadedRecords = LocalStorage.loadRecords()
      const loadedRecycleBin = LocalStorage.loadRecycleBin()
      setRecords(loadedRecords)
      setRecycleBin(loadedRecycleBin)
      
      syncManager.setLastSyncTime()
      await updateSyncStatus()
    }
    
    setActionResult(result.message)
    setLastAction(result.success ? 'record' : 'delete')
    setIsLoading(false)
    setShowSyncMenu(false)
  }

  // 智能同步
  const handleIntelligentSync = async () => {
    if (!user || !isSupabaseConfigured) {
      setActionResult('请先登录账号才能使用同步功能')
      setLastAction('delete')
      return
    }

    setIsLoading(true)
    const result = await syncManager.intelligentSync(user.id)
    
    if (result.success) {
      // 重新加载本地数据
      const loadedRecords = LocalStorage.loadRecords()
      const loadedRecycleBin = LocalStorage.loadRecycleBin()
      setRecords(loadedRecords)
      setRecycleBin(loadedRecycleBin)
      
      syncManager.setLastSyncTime()
      await updateSyncStatus()
    }
    
    setActionResult(result.message)
    setLastAction(result.success ? 'record' : 'delete')
    setIsLoading(false)
    setShowSyncMenu(false)
  }

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
    
    if (hasDeleteKeyword) return 'delete'
    if (hasClassifyKeyword) return 'classify'
    if (hasStatisticsKeyword) return 'statistics'
    if (hasRecordKeyword && !hasSearchKeyword) return 'record'
    if (hasSearchKeyword && !hasRecordKeyword) return 'search'
    
    if (hasRecordKeyword) return 'record'
    return 'search'
  }

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    
    try {
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

  const handleAIRecord = async (parsed: ParsedItem) => {
    const newRecord: ItemRecord = {
      id: Date.now().toString(),
      userId: user?.id || 'guest',
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

    // 如果用户已登录且配置了 Supabase，实时同步到云端
    if (user && isSupabaseConfigured) {
      await syncManager.syncSingleRecord(newRecord, user.id)
    }
  }

  const handleAISearch = async (parsed: ParsedItem) => {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: parsed.item || input, records })
      })
      
      if (response.ok) {
        const results = await response.json()
        setSearchResults(results)
        setLastSearchContext(results)
      } else {
        handleSearch()
      }
    } catch (error) {
      console.error('AI search error:', error)
      handleSearch()
    }
    
    setLastAction('search')
    setActionResult(`AI语义搜索 (置信度: ${(parsed.confidence * 100).toFixed(1)}%)`)
  }

  const handleAIDelete = async (parsed: ParsedItem, originalInput: string) => {
    const itemToDelete = parsed.item
    const isContextualDelete = originalInput.includes('这条') || originalInput.includes('这个') || 
                               originalInput.includes('当前') || originalInput.includes('这些')
    
    let updatedRecords: ItemRecord[]
    let deletedCount = 0
    
    if (isContextualDelete && lastSearchContext.length > 0) {
      const idsToDelete = new Set(lastSearchContext.map(r => r.id))
      const itemsToDelete = records.filter(record => idsToDelete.has(record.id))
      updatedRecords = records.filter(record => !idsToDelete.has(record.id))
      deletedCount = itemsToDelete.length
      
      moveToRecycleBin(itemsToDelete, '用户删除搜索结果')
      
      setActionResult(deletedCount > 0 ? 
        `已删除 ${deletedCount} 条搜索结果记录 (已移至回收站)` : 
        '未找到要删除的搜索结果'
      )
    } else if (itemToDelete && itemToDelete.trim() !== '') {
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
      
      moveToRecycleBin(itemsToDelete, `关键词删除: ${itemToDelete}`)
      
      setActionResult(deletedCount > 0 ? 
        `已删除 ${deletedCount} 条相关记录 (已移至回收站，关键词: ${itemToDelete})` : 
        `未找到相关记录 (搜索: ${itemToDelete})`
      )

      // 如果用户已登录且配置了 Supabase，同步删除云端记录
      if (user && isSupabaseConfigured && deletedCount > 0) {
        itemsToDelete.forEach(async (item) => {
          await syncManager.deleteCloudRecord(item.id, user.id)
        })
      }
    } else {
      updatedRecords = records
      setActionResult('无法确定删除目标，请明确指定要删除的物品名称')
    }
    
    setRecords(updatedRecords)
    setSearchResults([])
    setLastSearchContext([])
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

    // 如果用户已登录且配置了 Supabase，同步更新的记录
    if (user && isSupabaseConfigured && updatedCount > 0) {
      updatedRecords.forEach(async (record) => {
        if (record.item.toLowerCase().includes(item.toLowerCase()) ||
            record.rawInput.toLowerCase().includes(item.toLowerCase())) {
          await syncManager.syncSingleRecord(record, user.id)
        }
      })
    }
  }

  const handleAddRecord = () => {
    const newRecord: ItemRecord = {
      id: Date.now().toString(),
      userId: user?.id || 'guest',
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

  const handleSearch = () => {
    const results = records.filter(record => 
      record.item.toLowerCase().includes(input.toLowerCase()) ||
      record.location.toLowerCase().includes(input.toLowerCase()) ||
      record.rawInput.toLowerCase().includes(input.toLowerCase())
    )
    
    setSearchResults(results)
    setLastSearchContext(results)
    setLastAction('search')
    setActionResult('')
  }

  const moveToRecycleBin = (items: ItemRecord[], reason: string) => {
    const recycleBinItems: RecycleBinItem[] = items.map(item => ({
      ...item,
      deletedAt: new Date().toISOString(),
      deleteReason: reason
    }))
    setRecycleBin(prev => [...prev, ...recycleBinItems])

    // 如果用户已登录且配置了 Supabase，同步到云端回收站
    if (user && isSupabaseConfigured) {
      recycleBinItems.forEach(async (item) => {
        await syncManager.syncSingleRecycleBinItem(item, user.id)
      })
    }
  }

  const restoreFromRecycleBin = (item: RecycleBinItem) => {
    const { deletedAt, deleteReason, ...originalItem } = item
    setRecords(prev => [...prev, originalItem])
    setRecycleBin(prev => prev.filter(r => r.id !== item.id))
    setActionResult(`已恢复物品: ${item.item}`)
    setLastAction('record')

    // 如果用户已登录且配置了 Supabase，同步操作
    if (user && isSupabaseConfigured) {
      syncManager.syncSingleRecord(originalItem, user.id)
      syncManager.deleteCloudRecycleBinItem(item.id, user.id)
    }
  }

  const permanentDelete = (item: RecycleBinItem) => {
    setRecycleBin(prev => prev.filter(r => r.id !== item.id))
    setActionResult(`已永久删除: ${item.item}`)
    setLastAction('delete')

    // 如果用户已登录且配置了 Supabase，从云端删除
    if (user && isSupabaseConfigured) {
      syncManager.deleteCloudRecycleBinItem(item.id, user.id)
    }
  }

  const clearRecycleBin = () => {
    const count = recycleBin.length
    setRecycleBin([])
    setActionResult(`已清空回收站 (${count} 个项目)`)
    setLastAction('delete')

    // 如果用户已登录且配置了 Supabase，清空云端回收站
    if (user && isSupabaseConfigured) {
      recycleBin.forEach(async (item) => {
        await syncManager.deleteCloudRecycleBinItem(item.id, user.id)
      })
    }
  }

  const clearAllData = () => {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      setRecords([])
      setRecycleBin([])
      LocalStorage.clearAll()
      setActionResult('已清空所有数据')
      setLastAction('delete')
    }
  }

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

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const result = LocalStorage.importData(content)
        
        if (result.success) {
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
    event.target.value = ''
  }

  const deleteSearchResult = (itemToDelete: ItemRecord) => {
    if (confirm(`确定要删除 "${itemToDelete.item}" 吗？`)) {
      moveToRecycleBin([itemToDelete], '手动删除搜索结果')
      
      setRecords(prev => prev.filter(record => record.id !== itemToDelete.id))
      setSearchResults(prev => prev.filter(record => record.id !== itemToDelete.id))
      setLastSearchContext(prev => prev.filter(record => record.id !== itemToDelete.id))
      
      setActionResult(`已删除 "${itemToDelete.item}" (已移至回收站)`)
      setLastAction('delete')

      // 如果用户已登录且配置了 Supabase，同步删除
      if (user && isSupabaseConfigured) {
        syncManager.deleteCloudRecord(itemToDelete.id, user.id)
      }
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

  // 辅助函数保持不变
  const extractItem = (text: string): string => {
    const match = text.match(/把(.+?)放在/)
    return match ? match[1] : text.slice(0, 10)
  }

  const extractLocation = (text: string): string => {
    const match = text.match(/放在(.+)/)
    return match ? match[1] : '未知位置'
  }

  const extractItemFromQuery = (text: string): string => {
    const deleteMatch = text.match(/删除(.+?)记录/) || text.match(/删除(.+)/) || text.match(/移除(.+)/)
    if (deleteMatch) return deleteMatch[1].trim()
    
    const commonWords = ['删除', '移除', '清空', '记录', '的', '我的']
    let cleanText = text
    commonWords.forEach(word => {
      cleanText = cleanText.replace(new RegExp(word, 'g'), '')
    })
    return cleanText.trim() || text
  }

  const extractItemAndTag = (text: string): { item: string; tag: string } => {
    let itemMatch = text.match(/给(.+?)加上/) || text.match(/把(.+?)设置为/)
    let tagMatch = text.match(/加上(.+?)标签/) || text.match(/设置为(.+?)分类/) || text.match(/标签(.+)/)
    
    if (!itemMatch || !tagMatch) {
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
      <div className="container-content">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">📦</span>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900">智能物品管家</h1>
            </div>
            {user && (
              <div className="hidden sm:flex items-center gap-2 ml-4">
                <div className="w-6 h-6 rounded-full bg-success-100 flex items-center justify-center">
                  <span className="text-success-600 text-xs">✓</span>
                </div>
                <span className="text-sm text-neutral-600">
                  {user.email}
                </span>
                {isSupabaseConfigured && (
                  <span className="tag-success">已同步</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowRecycleBin(!showRecycleBin)}
              className="btn-secondary flex items-center gap-2"
            >
              <span className="w-4 h-4">🗑️</span>
              回收站
              {recycleBin.length > 0 && (
                <span className="badge-error">
                  {recycleBin.length}
                </span>
              )}
            </button>

            {/* 同步菜单 */}
            {user && isSupabaseConfigured && (
              <div className="relative" data-menu="sync-menu">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowSyncMenu(!showSyncMenu)
                  }}
                  className="btn-success flex items-center gap-2"
                >
                  <span className="w-4 h-4">☁️</span>
                  同步
                </button>
                {showSyncMenu && (
                  <div className="absolute right-0 mt-2 w-72 card shadow-xl border-0 z-20 animate-slide-down">
                    {syncStatus && (
                      <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 rounded-t-2xl">
                        <p className="font-medium text-neutral-800 mb-2">📊 同步状态</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
                          <div>本地: {syncStatus.localRecords + syncStatus.localRecycleBin} 条</div>
                          <div>云端: {syncStatus.cloudRecords + syncStatus.cloudRecycleBin} 条</div>
                        </div>
                        {syncStatus.lastSync && (
                          <p className="text-xs text-neutral-500 mt-1">
                            最后同步: {new Date(syncStatus.lastSync).toLocaleString('zh-CN')}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="p-2 space-y-1">
                      <button
                        onClick={handleIntelligentSync}
                        disabled={isLoading}
                        className="w-full text-left px-3 py-2 text-sm text-primary-700 hover:bg-primary-50 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        <span className="w-4 h-4">🤖</span>
                        智能同步
                      </button>
                      <button
                        onClick={handleSyncToCloud}
                        disabled={isLoading}
                        className="w-full text-left px-3 py-2 text-sm text-accent-700 hover:bg-accent-50 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        <span className="w-4 h-4">⬆️</span>
                        上传到云端
                      </button>
                      <button
                        onClick={handleSyncFromCloud}
                        disabled={isLoading}
                        className="w-full text-left px-3 py-2 text-sm text-primary-700 hover:bg-primary-50 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        <span className="w-4 h-4">⬇️</span>
                        从云端下载
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="relative" data-menu="data-menu">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDataMenu(!showDataMenu)
                }}
                className="btn-outline flex items-center gap-2"
              >
                <span className="w-4 h-4">📁</span>
                数据
              </button>
              {showDataMenu && (
                <div className="absolute right-0 mt-2 w-48 card shadow-xl border-0 z-20 animate-slide-down">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={exportData}
                      className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span className="w-4 h-4">📤</span>
                      导出数据
                    </button>
                    <label className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg cursor-pointer transition-colors flex items-center gap-2">
                      <span className="w-4 h-4">📥</span>
                      导入数据
                      <input
                        type="file"
                        accept=".json"
                        onChange={importData}
                        className="hidden"
                      />
                    </label>
                    <hr className="my-1 border-neutral-200" />
                    <button
                      onClick={clearAllData}
                      className="w-full text-left px-3 py-2 text-sm text-error-600 hover:bg-error-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span className="w-4 h-4">🗑️</span>
                      清空所有数据
                    </button>
                  </div>
                </div>
              )}
            </div>
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
      <div className="container-content">
        <div className="card-hover p-6 sm:p-8 animate-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              AI智能助手
            </h2>
            <p className="text-neutral-600 max-w-lg mx-auto text-balance">
              支持自然语言交互，一句话搞定记录、查询、删除、分类、统计等所有操作
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="试试说：我把身份证放在书桌抽屉里 / 身份证在哪 / 删除身份证 / 给身份证加上证件标签 / 统计我的物品..."
                className="w-full px-4 py-4 pr-16 border-2 border-neutral-200 rounded-2xl bg-neutral-50/50 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 text-base placeholder-neutral-400 resize-none min-h-[120px] max-h-48 transition-all duration-200"
                rows={4}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                onInput={(e) => {
                  const textarea = e.target as HTMLTextAreaElement
                  textarea.style.height = 'auto'
                  const newHeight = Math.max(120, Math.min(textarea.scrollHeight, 192))
                  textarea.style.height = newHeight + 'px'
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl disabled:hover:shadow-lg group"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="group-hover:scale-110 transition-transform duration-200">🚀</span>
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-xs text-neutral-500">
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-neutral-100 rounded border text-neutral-600">Enter</kbd>
                <span>发送</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-neutral-100 rounded border text-neutral-600">Shift</kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-neutral-100 rounded border text-neutral-600">Enter</kbd>
                <span>换行</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 操作反馈和搜索结果 */}
      <div className="container-content space-y-6">
        {/* 操作反馈 */}
        {lastAction === 'record' && (
          <div className="card p-4 border-l-4 border-success-400 bg-success-50 animate-slide-up">
            <p className="text-success-800 font-medium flex items-center gap-2">
              <span>✅</span> 记录成功！
            </p>
            {actionResult && <p className="text-success-700 text-sm mt-1">{actionResult}</p>}
          </div>
        )}

        {lastAction === 'delete' && actionResult && (
          <div className="card p-4 border-l-4 border-error-400 bg-error-50 animate-slide-up">
            <p className="text-error-800 font-medium flex items-center gap-2">
              <span>🗑️</span> {actionResult}
            </p>
          </div>
        )}

        {lastAction === 'classify' && actionResult && (
          <div className="card p-4 border-l-4 border-primary-400 bg-primary-50 animate-slide-up">
            <p className="text-primary-800 font-medium flex items-center gap-2">
              <span>🏷️</span> {actionResult}
            </p>
          </div>
        )}

        {lastAction === 'statistics' && actionResult && (
          <div className="card p-6 border-l-4 border-neutral-400 bg-neutral-50 animate-slide-up">
            <pre className="text-neutral-800 text-sm whitespace-pre-line font-mono">{actionResult}</pre>
          </div>
        )}

        {/* 搜索结果 */}
        {lastAction === 'search' && (
          <div className="animate-slide-up">
            {searchResults.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔍</span>
                  <h3 className="text-lg font-semibold text-neutral-800">搜索结果</h3>
                  <span className="badge-primary">{searchResults.length} 个结果</span>
                </div>
                {actionResult && (
                  <p className="text-primary-600 text-sm bg-primary-50 px-3 py-2 rounded-lg">
                    {actionResult}
                  </p>
                )}
                <div className="grid gap-3">
                  {searchResults.map(record => (
                    <div key={record.id} className="card-hover p-4 border-l-4 border-primary-400">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-2">
                          <h4 className="font-semibold text-neutral-900">{record.item}</h4>
                          <p className="text-neutral-600 flex items-center gap-1">
                            <span>📍</span> {record.location}
                          </p>
                          {record.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {record.tags.map(tag => (
                                <span key={tag} className="tag-primary">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-sm text-neutral-500">
                            {record.rawInput}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteSearchResult(record)}
                          className="btn-error ml-4 px-3 py-1 text-xs"
                          title={`删除 ${record.item}`}
                        >
                          🗑️ 删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card p-6 border-l-4 border-warning-400 bg-warning-50 text-center">
                <div className="text-4xl mb-2">😅</div>
                <p className="text-warning-800 font-medium">没有找到相关物品</p>
                <p className="text-warning-600 text-sm mt-1">试试其他关键词？</p>
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