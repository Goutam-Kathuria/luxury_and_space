import { NextResponse } from 'next/server'
const sessions = new Map<string, Record<string, unknown>>()
export async function GET(request: Request) { const token = new URL(request.url).searchParams.get('token'); return NextResponse.json({ content: token ? sessions.get(token) || {} : {} }) }
export async function POST(request: Request) { const body = await request.json(); if (!body.token || typeof body.token !== 'string') return NextResponse.json({error:'token required'}, {status:400}); sessions.set(body.token, body.content || {}); return NextResponse.json({ok:true}) }
