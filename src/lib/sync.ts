import { createSupabaseClient, DbItemRecord, DbRecycleBinItem } from './supabase'
import { LocalStorage } from './storage'
import { ItemRecord, RecycleBinItem } from '@/types'

export class SyncManager {
  private supabase = createSupabaseClient()

  // 将本地数据同步到云端
  async syncToCloud(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const localRecords = LocalStorage.loadRecords()
      const localRecycleBin = LocalStorage.loadRecycleBin()

      // 转换本地数据格式为数据库格式
      const dbRecords: DbItemRecord[] = localRecords.map(record => ({
        id: record.id,
        user_id: userId,
        item: record.item,
        location: record.location,
        created_at: record.createdAt,
        raw_input: record.rawInput,
        source: record.source,
        tags: record.tags,
        updated_at: new Date().toISOString()
      }))

      const dbRecycleBin: DbRecycleBinItem[] = localRecycleBin.map(item => ({
        id: item.id,
        user_id: userId,
        item: item.item,
        location: item.location,
        created_at: item.createdAt,
        raw_input: item.rawInput,
        source: item.source,
        tags: item.tags,
        deleted_at: item.deletedAt,
        delete_reason: item.deleteReason,
        updated_at: new Date().toISOString()
      }))

      // 使用 upsert 批量上传记录
      if (dbRecords.length > 0) {
        const { error: recordsError } = await this.supabase
          .from('item_records')
          .upsert(dbRecords, { onConflict: 'id' })

        if (recordsError) throw recordsError
      }

      // 使用 upsert 批量上传回收站数据
      if (dbRecycleBin.length > 0) {
        const { error: recycleBinError } = await this.supabase
          .from('recycle_bin')
          .upsert(dbRecycleBin, { onConflict: 'id' })

        if (recycleBinError) throw recycleBinError
      }

      return {
        success: true,
        message: `成功同步 ${dbRecords.length} 条记录和 ${dbRecycleBin.length} 条回收站数据到云端`
      }
    } catch (error: any) {
      console.error('Sync to cloud failed:', error)
      return {
        success: false,
        message: `同步到云端失败: ${error.message}`
      }
    }
  }

  // 从云端同步数据到本地
  async syncFromCloud(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // 获取云端记录
      const { data: cloudRecords, error: recordsError } = await this.supabase
        .from('item_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (recordsError) throw recordsError

      // 获取云端回收站数据
      const { data: cloudRecycleBin, error: recycleBinError } = await this.supabase
        .from('recycle_bin')
        .select('*')
        .eq('user_id', userId)
        .order('deleted_at', { ascending: false })

      if (recycleBinError) throw recycleBinError

      // 转换云端数据格式为本地格式
      const localRecords: ItemRecord[] = (cloudRecords || []).map(record => ({
        id: record.id,
        userId: record.user_id,
        item: record.item,
        location: record.location,
        createdAt: record.created_at,
        rawInput: record.raw_input,
        source: record.source,
        tags: record.tags || []
      }))

      const localRecycleBin: RecycleBinItem[] = (cloudRecycleBin || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        item: item.item,
        location: item.location,
        createdAt: item.created_at,
        rawInput: item.raw_input,
        source: item.source,
        tags: item.tags || [],
        deletedAt: item.deleted_at,
        deleteReason: item.delete_reason
      }))

      // 保存到本地存储
      LocalStorage.saveRecords(localRecords)
      LocalStorage.saveRecycleBin(localRecycleBin)

      return {
        success: true,
        message: `成功从云端同步 ${localRecords.length} 条记录和 ${localRecycleBin.length} 条回收站数据`
      }
    } catch (error: any) {
      console.error('Sync from cloud failed:', error)
      return {
        success: false,
        message: `从云端同步失败: ${error.message}`
      }
    }
  }

  // 智能合并本地和云端数据
  async intelligentSync(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const localRecords = LocalStorage.loadRecords()
      const localRecycleBin = LocalStorage.loadRecycleBin()

      // 获取云端数据
      const { data: cloudRecords } = await this.supabase
        .from('item_records')
        .select('*')
        .eq('user_id', userId)

      const { data: cloudRecycleBin } = await this.supabase
        .from('recycle_bin')
        .select('*')
        .eq('user_id', userId)

      // 创建ID映射
      const localRecordIds = new Set(localRecords.map(r => r.id))
      const cloudRecordIds = new Set((cloudRecords || []).map(r => r.id))
      const localRecycleBinIds = new Set(localRecycleBin.map(r => r.id))
      const cloudRecycleBinIds = new Set((cloudRecycleBin || []).map(r => r.id))

      // 找出需要同步的数据
      const recordsToUpload = localRecords.filter(r => !cloudRecordIds.has(r.id))
      const recordsToDownload = (cloudRecords || []).filter(r => !localRecordIds.has(r.id))
      const recycleBinToUpload = localRecycleBin.filter(r => !cloudRecycleBinIds.has(r.id))
      const recycleBinToDownload = (cloudRecycleBin || []).filter(r => !localRecycleBinIds.has(r.id))

      let uploadedRecords = 0
      let downloadedRecords = 0

      // 上传本地独有的记录
      if (recordsToUpload.length > 0) {
        const dbRecords: DbItemRecord[] = recordsToUpload.map(record => ({
          id: record.id,
          user_id: userId,
          item: record.item,
          location: record.location,
          created_at: record.createdAt,
          raw_input: record.rawInput,
          source: record.source,
          tags: record.tags,
          updated_at: new Date().toISOString()
        }))

        const { error } = await this.supabase
          .from('item_records')
          .insert(dbRecords)

        if (error) throw error
        uploadedRecords += recordsToUpload.length
      }

      // 上传本地独有的回收站数据
      if (recycleBinToUpload.length > 0) {
        const dbRecycleBin: DbRecycleBinItem[] = recycleBinToUpload.map(item => ({
          id: item.id,
          user_id: userId,
          item: item.item,
          location: item.location,
          created_at: item.createdAt,
          raw_input: item.rawInput,
          source: item.source,
          tags: item.tags,
          deleted_at: item.deletedAt,
          delete_reason: item.deleteReason,
          updated_at: new Date().toISOString()
        }))

        const { error } = await this.supabase
          .from('recycle_bin')
          .insert(dbRecycleBin)

        if (error) throw error
        uploadedRecords += recycleBinToUpload.length
      }

      // 下载云端独有的记录
      if (recordsToDownload.length > 0) {
        const newLocalRecords: ItemRecord[] = recordsToDownload.map(record => ({
          id: record.id,
          userId: record.user_id,
          item: record.item,
          location: record.location,
          createdAt: record.created_at,
          rawInput: record.raw_input,
          source: record.source,
          tags: record.tags || []
        }))

        LocalStorage.saveRecords([...localRecords, ...newLocalRecords])
        downloadedRecords += recordsToDownload.length
      }

      // 下载云端独有的回收站数据
      if (recycleBinToDownload.length > 0) {
        const newLocalRecycleBin: RecycleBinItem[] = recycleBinToDownload.map(item => ({
          id: item.id,
          userId: item.user_id,
          item: item.item,
          location: item.location,
          createdAt: item.created_at,
          rawInput: item.raw_input,
          source: item.source,
          tags: item.tags || [],
          deletedAt: item.deleted_at,
          deleteReason: item.delete_reason
        }))

        LocalStorage.saveRecycleBin([...localRecycleBin, ...newLocalRecycleBin])
        downloadedRecords += recycleBinToDownload.length
      }

      return {
        success: true,
        message: `智能同步完成：上传 ${uploadedRecords} 条，下载 ${downloadedRecords} 条数据`
      }
    } catch (error: any) {
      console.error('Intelligent sync failed:', error)
      return {
        success: false,
        message: `智能同步失败: ${error.message}`
      }
    }
  }

  // 实时同步单条记录
  async syncSingleRecord(record: ItemRecord, userId: string): Promise<boolean> {
    try {
      const dbRecord: DbItemRecord = {
        id: record.id,
        user_id: userId,
        item: record.item,
        location: record.location,
        created_at: record.createdAt,
        raw_input: record.rawInput,
        source: record.source,
        tags: record.tags,
        updated_at: new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('item_records')
        .upsert(dbRecord, { onConflict: 'id' })

      return !error
    } catch (error) {
      console.error('Failed to sync single record:', error)
      return false
    }
  }

  // 实时同步单条回收站记录
  async syncSingleRecycleBinItem(item: RecycleBinItem, userId: string): Promise<boolean> {
    try {
      const dbItem: DbRecycleBinItem = {
        id: item.id,
        user_id: userId,
        item: item.item,
        location: item.location,
        created_at: item.createdAt,
        raw_input: item.rawInput,
        source: item.source,
        tags: item.tags,
        deleted_at: item.deletedAt,
        delete_reason: item.deleteReason,
        updated_at: new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('recycle_bin')
        .upsert(dbItem, { onConflict: 'id' })

      return !error
    } catch (error) {
      console.error('Failed to sync single recycle bin item:', error)
      return false
    }
  }

  // 删除云端记录
  async deleteCloudRecord(recordId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('item_records')
        .delete()
        .eq('id', recordId)
        .eq('user_id', userId)

      return !error
    } catch (error) {
      console.error('Failed to delete cloud record:', error)
      return false
    }
  }

  // 删除云端回收站记录
  async deleteCloudRecycleBinItem(itemId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('recycle_bin')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId)

      return !error
    } catch (error) {
      console.error('Failed to delete cloud recycle bin item:', error)
      return false
    }
  }

  // 获取同步状态
  async getSyncStatus(userId: string): Promise<{
    localRecords: number
    localRecycleBin: number
    cloudRecords: number
    cloudRecycleBin: number
    lastSync?: string
  }> {
    try {
      const localRecords = LocalStorage.loadRecords()
      const localRecycleBin = LocalStorage.loadRecycleBin()

      const { data: cloudRecords } = await this.supabase
        .from('item_records')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)

      const { data: cloudRecycleBin } = await this.supabase
        .from('recycle_bin')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)

      const lastSync = localStorage.getItem('lastSyncTime')

      return {
        localRecords: localRecords.length,
        localRecycleBin: localRecycleBin.length,
        cloudRecords: cloudRecords?.length || 0,
        cloudRecycleBin: cloudRecycleBin?.length || 0,
        lastSync: lastSync || undefined
      }
    } catch (error) {
      console.error('Failed to get sync status:', error)
      return {
        localRecords: 0,
        localRecycleBin: 0,
        cloudRecords: 0,
        cloudRecycleBin: 0
      }
    }
  }

  // 设置最后同步时间
  setLastSyncTime() {
    localStorage.setItem('lastSyncTime', new Date().toISOString())
  }
}