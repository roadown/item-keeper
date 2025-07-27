import { ItemRecord, RecycleBinItem } from '@/types'

const STORAGE_KEYS = {
  RECORDS: 'item-keeper-records',
  RECYCLE_BIN: 'item-keeper-recycle-bin',
  APP_VERSION: 'item-keeper-version'
} as const

const CURRENT_VERSION = '1.0.0'

export class LocalStorage {
  private static isAvailable(): boolean {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  private static safeGetItem(key: string): string | null {
    try {
      if (!this.isAvailable()) return null
      return localStorage.getItem(key)
    } catch (error) {
      console.error('localStorage getItem error:', error)
      return null
    }
  }

  private static safeSetItem(key: string, value: string): boolean {
    try {
      if (!this.isAvailable()) return false
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error('localStorage setItem error:', error)
      return false
    }
  }

  // 保存记录
  static saveRecords(records: ItemRecord[]): boolean {
    try {
      const data = JSON.stringify(records)
      return this.safeSetItem(STORAGE_KEYS.RECORDS, data)
    } catch (error) {
      console.error('Error saving records:', error)
      return false
    }
  }

  // 加载记录
  static loadRecords(): ItemRecord[] {
    try {
      const data = this.safeGetItem(STORAGE_KEYS.RECORDS)
      if (!data) return []
      
      const records = JSON.parse(data) as ItemRecord[]
      return Array.isArray(records) ? records : []
    } catch (error) {
      console.error('Error loading records:', error)
      return []
    }
  }

  // 保存回收站
  static saveRecycleBin(recycleBin: RecycleBinItem[]): boolean {
    try {
      const data = JSON.stringify(recycleBin)
      return this.safeSetItem(STORAGE_KEYS.RECYCLE_BIN, data)
    } catch (error) {
      console.error('Error saving recycle bin:', error)
      return false
    }
  }

  // 加载回收站
  static loadRecycleBin(): RecycleBinItem[] {
    try {
      const data = this.safeGetItem(STORAGE_KEYS.RECYCLE_BIN)
      if (!data) return []
      
      const recycleBin = JSON.parse(data) as RecycleBinItem[]
      return Array.isArray(recycleBin) ? recycleBin : []
    } catch (error) {
      console.error('Error loading recycle bin:', error)
      return []
    }
  }

  // 清除所有数据
  static clearAll(): boolean {
    try {
      if (!this.isAvailable()) return false
      
      localStorage.removeItem(STORAGE_KEYS.RECORDS)
      localStorage.removeItem(STORAGE_KEYS.RECYCLE_BIN)
      localStorage.removeItem(STORAGE_KEYS.APP_VERSION)
      return true
    } catch (error) {
      console.error('Error clearing storage:', error)
      return false
    }
  }

  // 检查版本兼容性
  static checkVersion(): boolean {
    try {
      const storedVersion = this.safeGetItem(STORAGE_KEYS.APP_VERSION)
      if (!storedVersion || storedVersion !== CURRENT_VERSION) {
        this.safeSetItem(STORAGE_KEYS.APP_VERSION, CURRENT_VERSION)
        return false // 版本不匹配，可能需要数据迁移
      }
      return true
    } catch (error) {
      console.error('Error checking version:', error)
      return false
    }
  }

  // 获取存储统计信息
  static getStorageInfo(): {
    recordsCount: number
    recycleBinCount: number
    storageUsed: string
    isAvailable: boolean
  } {
    const records = this.loadRecords()
    const recycleBin = this.loadRecycleBin()
    
    let storageUsed = '0 KB'
    try {
      if (this.isAvailable()) {
        const recordsData = this.safeGetItem(STORAGE_KEYS.RECORDS) || ''
        const recycleBinData = this.safeGetItem(STORAGE_KEYS.RECYCLE_BIN) || ''
        const totalBytes = recordsData.length + recycleBinData.length
        storageUsed = `${(totalBytes / 1024).toFixed(1)} KB`
      }
    } catch (error) {
      console.error('Error calculating storage size:', error)
    }

    return {
      recordsCount: records.length,
      recycleBinCount: recycleBin.length,
      storageUsed,
      isAvailable: this.isAvailable()
    }
  }

  // 导出数据
  static exportData(): string {
    const records = this.loadRecords()
    const recycleBin = this.loadRecycleBin()
    
    const exportData = {
      version: CURRENT_VERSION,
      exportTime: new Date().toISOString(),
      records,
      recycleBin
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  // 导入数据
  static importData(jsonData: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonData)
      
      // 验证数据格式
      if (!data.records || !Array.isArray(data.records)) {
        return { success: false, message: '数据格式错误：缺少records字段' }
      }
      
      if (!data.recycleBin || !Array.isArray(data.recycleBin)) {
        return { success: false, message: '数据格式错误：缺少recycleBin字段' }
      }
      
      // 保存数据
      const recordsSaved = this.saveRecords(data.records)
      const recycleBinSaved = this.saveRecycleBin(data.recycleBin)
      
      if (!recordsSaved || !recycleBinSaved) {
        return { success: false, message: '保存数据失败' }
      }
      
      return { 
        success: true, 
        message: `成功导入 ${data.records.length} 条记录和 ${data.recycleBin.length} 条回收站数据` 
      }
    } catch (error) {
      return { success: false, message: `导入失败: ${error}` }
    }
  }
}