#!/usr/bin/env node

const supabaseUrl = 'https://oxtjonaiubulnggytezf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94dGpvbmFpdWJ1bG5nZ3l0ZXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxOTM4ODgsImV4cCI6MjA2Mzc2OTg4OH0.9EsXc65D-5qgXLtu48d1E1Bll_AjaCt-a2-oPhZzUQU'

async function checkDemoUser() {
  try {
    console.log('Checking for demo user profile...')
    
    // First check users table
    const usersResponse = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.demo@example.com`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    const users = await usersResponse.json()
    console.log('Users table:', JSON.stringify(users, null, 2))
    
    // Check if we can query by the auth user ID from the console (6f4b77de-d981-4c14-af2e-a271c9733fc7)
    const userByIdResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.6f4b77de-d981-4c14-af2e-a271c9733fc7`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    const userById = await userByIdResponse.json()
    console.log('\nUser by ID (6f4b77de-d981-4c14-af2e-a271c9733fc7):', JSON.stringify(userById, null, 2))
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkDemoUser()