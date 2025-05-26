#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('Testing database connection...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('\n1. Testing basic query to organizations table...')
  try {
    const { data, error, status, statusText } = await supabase
      .from('organizations')
      .select('*')
    
    console.log('Response status:', status, statusText)
    console.log('Error:', error)
    console.log('Data:', data)
    
    if (error) {
      console.error('❌ Query failed:', error.message)
      console.error('Error details:', error)
    } else {
      console.log('✅ Query successful! Found', data?.length || 0, 'organizations')
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }

  console.log('\n2. Testing query to contacts table...')
  try {
    const { data, error, status } = await supabase
      .from('contacts')
      .select('*')
      .limit(5)
    
    console.log('Response status:', status)
    
    if (error) {
      console.error('❌ Query failed:', error.message)
      console.error('Error code:', error.code)
      console.error('Error hint:', error.hint)
    } else {
      console.log('✅ Query successful! Found', data?.length || 0, 'contacts')
      if (data && data.length > 0) {
        console.log('First contact:', data[0])
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }

  console.log('\n3. Testing if tables exist...')
  try {
    // Try to get table info using a different approach
    const { data, error } = await supabase
      .from('contacts')
      .select('id')
      .limit(1)
    
    if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
      console.error('❌ The contacts table does not exist!')
    } else if (error) {
      console.error('❌ Other error:', error.message)
    } else {
      console.log('✅ Contacts table exists')
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }

  console.log('\n4. Testing raw SQL query...')
  try {
    const { data, error } = await supabase.rpc('get_user_organization_id')
    console.log('RPC result:', { data, error })
  } catch (err) {
    console.log('RPC error (expected if function was dropped):', err.message)
  }
}

testConnection()