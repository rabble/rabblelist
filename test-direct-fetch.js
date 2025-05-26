#!/usr/bin/env node

// Node.js v18+ has built-in fetch

const supabaseUrl = 'https://oxtjonaiubulnggytezf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94dGpvbmFpdWJ1bG5nZ3l0ZXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxOTM4ODgsImV4cCI6MjA2Mzc2OTg4OH0.9EsXc65D-5qgXLtu48d1E1Bll_AjaCt-a2-oPhZzUQU'

console.log('Testing direct fetch to Supabase...')

async function test() {
  try {
    console.log('\n1. Fetching organizations...')
    const response = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const data = await response.json()
    console.log('Data:', JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('Error:', error)
  }
  
  try {
    console.log('\n2. Fetching contacts with limit...')
    const response = await fetch(`${supabaseUrl}/rest/v1/contacts?limit=5`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Contacts count:', data.length)
    if (data.length > 0) {
      console.log('First contact:', data[0])
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

test()