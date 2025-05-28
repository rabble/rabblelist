import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Button } from '@/components/common/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Mail, Lock, AlertCircle, User, Building, Home } from 'lucide-react'

export function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [createNewOrg, setCreateNewOrg] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const { signIn, signUp, user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Don't redirect back to login page!
  const from = (location.state as any)?.from?.pathname || '/dashboard'
  const redirectTo = from === '/login' ? '/dashboard' : from

  // If already logged in, redirect to intended page (but not if we're on the landing page)
  useEffect(() => {
    if (!loading && user && location.pathname === '/login') {
      navigate(redirectTo, { replace: true })
    }
  }, [loading, user, navigate, redirectTo, location.pathname])

  const handleDemoLogin = async () => {
    setError(null)
    setSuccess(null)
    setIsLoading(true)
    setEmail('demo@example.com')
    setPassword('demo123')
    
    
    try {
      const { error } = await signIn('demo@example.com', 'demo123')
      
      if (error) {
        console.error('Demo login error:', error)
        setError(`Login failed: ${error.message || 'Demo user may not be set up correctly'}`)
        setIsLoading(false)
      } else {
        navigate(redirectTo, { replace: true })
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Please try again'}`)
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)


    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        
        if (error) {
          console.error('Sign in error:', error)
          // Provide user-friendly error messages
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.')
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please check your email to confirm your account before signing in.')
          } else if (error.message.includes('Network')) {
            setError('Network error. Please check your connection and try again.')
          } else {
            setError(error.message)
          }
          setIsLoading(false)
        } else {
          navigate(redirectTo, { replace: true })
        }
      } else {
        // Sign up
        const { error } = await signUp(
          email, 
          password, 
          fullName
        )
        
        if (error) {
          console.error('Sign up error:', error)
          // Provide user-friendly error messages for signup
          if (error.message.includes('already registered')) {
            setError('An account with this email already exists. Please sign in instead.')
          } else if (error.message.includes('Password')) {
            setError('Password must be at least 6 characters long.')
          } else if (error.message.includes('valid email')) {
            setError('Please enter a valid email address.')
          } else {
            setError(error.message)
          }
          setIsLoading(false)
        } else {
          // Since email confirmation is required, show success message and switch to sign in
          setSuccess('Account created successfully! Please check your email to confirm your account before signing in.')
          setPassword('')
          setFullName('')
          setOrganizationName('')
          setCreateNewOrg(false)
          // Switch to signin mode after showing the message
          setTimeout(() => {
            setMode('signin')
          }, 3000)
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError(`Error: ${err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'}`)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">rise.protest.net</h1>
          <p className="text-gray-600 mt-2">
            {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
          </p>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mt-2">
            <Home className="w-4 h-4" />
            Learn more about rise.protest.net
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{success}</p>
                </div>
              )}

              {mode === 'signup' && (
                <>
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="John Doe"
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="createOrg" className="text-sm font-medium text-gray-700">
                        Organization
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          id="createOrg"
                          type="checkbox"
                          checked={createNewOrg}
                          onChange={(e) => setCreateNewOrg(e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        Create new organization
                      </label>
                    </div>
                    
                    {createNewOrg && (
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Organization name"
                          required={createNewOrg}
                        />
                      </div>
                    )}
                    
                    {!createNewOrg && (
                      <p className="text-sm text-gray-500 mt-1">
                        You'll be added to the demo organization. Contact an admin to create your own.
                      </p>
                    )}
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    minLength={6}
                  />
                </div>
                {mode === 'signup' && (
                  <p className="text-sm text-gray-500 mt-1">
                    Must be at least 6 characters
                  </p>
                )}
              </div>

              <div className="pt-2 space-y-3">
                <Button
                  type="submit"
                  fullWidth
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Button>
                
                {mode === 'signin' && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or</span>
                    </div>
                  </div>
                )}
                
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={isLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Try Demo Account
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email: demo@example.com | Password: demo123</p>
                  </button>
                )}
              </div>

              <div className="text-center pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin')
                    setError(null)
                    setSuccess(null)
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium block w-full"
                >
                  {mode === 'signin' 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"}
                </button>
                
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => navigate('/reset-password')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Forgot your password?
                  </button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>By signing up, you agree to our</p>
          <p>
            <Link to="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>
            {' and '}
            <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}