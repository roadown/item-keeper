import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.KIMI_API_KEY,
  baseURL: "https://api.moonshot.cn/v1",
})

export interface ParsedItem {
  item: string
  location: string
  intent: 'record' | 'search' | 'delete' | 'classify' | 'statistics'
  tag?: string
  confidence: number
}

export async function parseUserInput(input: string, context?: any): Promise<ParsedItem> {
  try {
    const completion = await client.chat.completions.create({
      model: "kimi-k2-0711-preview",
      messages: [
        {
          role: "system",
          content: `你是一个物品管理助手的解析器。请分析用户输入，提取关键信息并返回JSON格式。

规则：
1. 识别意图类型：record(记录), search(查询), delete(删除), classify(分类), statistics(统计)
2. 提取物品名称和位置信息
3. 如果是分类操作，提取标签信息
4. 返回置信度(0-1)
5. 特别注意：如果用户说"删除这条/这个/这些结果"，则item字段应该为空字符串""，表示删除上下文中的搜索结果

示例输入输出：
输入："我把身份证放在书桌抽屉里"
输出：{"item":"身份证","location":"书桌抽屉","intent":"record","confidence":0.95}

输入："身份证在哪里？"
输出：{"item":"身份证","location":"","intent":"search","confidence":0.9}

输入："删除身份证记录"
输出：{"item":"身份证","location":"","intent":"delete","confidence":0.9}

输入："删除这条结果"或"不需要这个了"
输出：{"item":"","location":"","intent":"delete","confidence":0.9}

输入："给身份证加上证件标签"
输出：{"item":"身份证","location":"","intent":"classify","tag":"证件","confidence":0.85}

输入："统计我的物品"
输出：{"item":"","location":"","intent":"statistics","confidence":0.95}

请只返回JSON，不要其他文字。`
        },
        {
          role: "user",
          content: context && context.hasSearchResults ? 
            `用户输入：${input}\n\n上下文：用户刚刚进行了搜索，当前有搜索结果显示。` : 
            input
        }
      ],
      temperature: 0.3,
    })

    const response = completion.choices[0].message.content
    if (!response) {
      throw new Error('No response from AI')
    }

    try {
      const parsed = JSON.parse(response) as ParsedItem
      return {
        item: parsed.item || '',
        location: parsed.location || '',
        intent: parsed.intent || 'search',
        tag: parsed.tag,
        confidence: parsed.confidence || 0.5
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      // 降级到基础解析
      return fallbackParse(input)
    }

  } catch (error) {
    console.error('AI parsing error:', error)
    // 降级到基础解析
    return fallbackParse(input)
  }
}

// 降级解析函数（保留原有逻辑）
function fallbackParse(input: string): ParsedItem {
  const recordKeywords = ['放在', '存放', '收纳', '放到', '藏在', '存在', '我把']
  const searchKeywords = ['在哪', '找找', '查询', '寻找', '哪里', '位置']
  const deleteKeywords = ['删除', '移除', '清空', '去掉', '删掉']
  const classifyKeywords = ['标签', '分类', '归类', '打标', '加上', '设置为']
  const statisticsKeywords = ['统计', '有多少', '总数', '数量', '计算', '汇总']
  
  const lowerText = input.toLowerCase()
  
  let intent: ParsedItem['intent'] = 'search'
  
  if (deleteKeywords.some(k => lowerText.includes(k))) intent = 'delete'
  else if (classifyKeywords.some(k => lowerText.includes(k))) intent = 'classify'
  else if (statisticsKeywords.some(k => lowerText.includes(k))) intent = 'statistics'
  else if (recordKeywords.some(k => lowerText.includes(k))) intent = 'record'
  
  // 简单提取
  let item = ''
  let location = ''
  let tag = ''
  
  if (intent === 'record') {
    const itemMatch = input.match(/把(.+?)放在/)
    const locationMatch = input.match(/放在(.+)/)
    item = itemMatch?.[1] || ''
    location = locationMatch?.[1] || ''
  } else {
    // 移除常见词汇，提取核心词
    const cleanWords = ['删除', '移除', '查询', '找找', '在哪', '标签', '分类', '统计', '记录', '的', '我的', '里', '？']
    let cleanInput = input
    cleanWords.forEach(word => {
      cleanInput = cleanInput.replace(new RegExp(word, 'g'), '')
    })
    item = cleanInput.trim()
  }
  
  return {
    item,
    location,
    intent,
    tag,
    confidence: 0.7
  }
}

export async function semanticSearch(query: string, records: any[]): Promise<any[]> {
  if (records.length === 0) return []
  
  try {
    const recordsText = records.map(r => 
      `ID:${r.id} 物品:${r.item} 位置:${r.location} 原文:${r.rawInput} 标签:${r.tags.join(',')}`
    ).join('\n')

    const completion = await client.chat.completions.create({
      model: "kimi-k2-0711-preview",
      messages: [
        {
          role: "system",
          content: `你是一个智能搜索助手。用户会提供查询词和物品记录列表，请返回最相关的记录ID列表。

规则：
1. 支持语义匹配，如"证件"可以匹配"身份证"、"护照"等
2. 支持模糊匹配，如"篮球针"可以匹配"打气针"
3. 按相关度排序
4. 只返回JSON格式的ID数组，如：["1","3","5"]
5. 如果没有匹配项，返回空数组：[]`
        },
        {
          role: "user",
          content: `查询词：${query}\n\n记录列表：\n${recordsText}`
        }
      ],
      temperature: 0.3,
    })

    const response = completion.choices[0].message.content
    if (!response) return []

    try {
      const ids = JSON.parse(response) as string[]
      return records.filter(r => ids.includes(r.id))
    } catch (parseError) {
      console.error('Semantic search parse error:', parseError)
      // 降级到简单搜索
      return records.filter(record => 
        record.item.toLowerCase().includes(query.toLowerCase()) ||
        record.location.toLowerCase().includes(query.toLowerCase()) ||
        record.rawInput.toLowerCase().includes(query.toLowerCase())
      )
    }

  } catch (error) {
    console.error('Semantic search error:', error)
    // 降级到简单搜索
    return records.filter(record => 
      record.item.toLowerCase().includes(query.toLowerCase()) ||
      record.location.toLowerCase().includes(query.toLowerCase()) ||
      record.rawInput.toLowerCase().includes(query.toLowerCase())
    )
  }
}