import { NextRequest, NextResponse } from 'next/server'
import { semanticSearch } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const { query, records } = await request.json()
    
    if (!query || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const results = await semanticSearch(query, records)
    return NextResponse.json(results)
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}