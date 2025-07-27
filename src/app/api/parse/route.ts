import { NextRequest, NextResponse } from 'next/server'
import { parseUserInput } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const { input, context } = await request.json()
    
    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const result = await parseUserInput(input, context)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Parse API error:', error)
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 })
  }
}