import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { supabase } from '@/lib/supabase'
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Table,
  Users,
  Calendar,
  Phone,
  Mail,
  Hash,
  Loader2
} from 'lucide-react'

interface TableInfo {
  table_name: string
  row_count: number
  size: string
  last_modified?: string
}

interface DatabaseStats {
  total_size: string
  table_count: number
  total_rows: number
  connection_status: 'connected' | 'disconnected' | 'error'
}

export function DatabaseDebug() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [stats, setStats] = useState<DatabaseStats>({
    total_size: '0 MB',
    table_count: 0,
    total_rows: 0,
    connection_status: 'disconnected'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [sampleData, setSampleData] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    loadDatabaseInfo()
    checkCurrentUser()
  }, [])

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setCurrentUser({
        auth: user,
        profile
      })
    }
  }

  const loadDatabaseInfo = async () => {
    setIsLoading(true)
    try {
      // Test connection
      const { error: connError } = await supabase.from('organizations').select('id').limit(1)
      
      if (connError) {
        setStats(prev => ({ ...prev, connection_status: 'error' }))
        console.error('Connection error:', connError)
      } else {
        setStats(prev => ({ ...prev, connection_status: 'connected' }))
      }

      // Get table information
      const tableNames = [
        'organizations',
        'users',
        'contacts',
        'campaigns',
        'events',
        'groups',
        'pathways',
        'call_logs',
        'communication_logs',
        'contact_interactions',
        'email_tracking_events',
        'ab_test_assignments',
        'webhook_configs',
        'organization_api_keys'
      ]

      const tableInfo: TableInfo[] = []
      let totalRows = 0

      for (const tableName of tableNames) {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (!error && count !== null) {
          tableInfo.push({
            table_name: tableName,
            row_count: count,
            size: `${Math.round(count * 0.5)}KB` // Rough estimate
          })
          totalRows += count
        }
      }

      setTables(tableInfo)
      setStats(prev => ({
        ...prev,
        table_count: tableInfo.length,
        total_rows: totalRows,
        total_size: `${Math.round(totalRows * 0.5 / 1024)}MB`
      }))
    } catch (error) {
      console.error('Error loading database info:', error)
      setStats(prev => ({ ...prev, connection_status: 'error' }))
    } finally {
      setIsLoading(false)
    }
  }

  const loadSampleData = async (tableName: string) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(5)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setSampleData(data)
        setSelectedTable(tableName)
      }
    } catch (error) {
      console.error('Error loading sample data:', error)
      setSampleData([])
    }
  }

  const runHealthCheck = async () => {
    const results = []
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    results.push({
      name: 'Authentication',
      status: user ? 'pass' : 'fail',
      message: user ? `Logged in as ${user.email}` : 'Not authenticated'
    })

    // Check RLS
    try {
      const { error } = await supabase.from('contacts').select('id').limit(1)
      results.push({
        name: 'Row Level Security',
        status: error ? 'fail' : 'pass',
        message: error ? error.message : 'RLS policies working'
      })
    } catch (error) {
      results.push({
        name: 'Row Level Security',
        status: 'fail',
        message: 'RLS check failed'
      })
    }

    // Check organization
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()
      
      results.push({
        name: 'Organization Assignment',
        status: profile?.organization_id ? 'pass' : 'fail',
        message: profile?.organization_id ? `Org ID: ${profile.organization_id}` : 'No organization assigned'
      })
    }

    return results
  }

  const [healthResults, setHealthResults] = useState<any[]>([])
  const [runningHealthCheck, setRunningHealthCheck] = useState(false)

  const handleHealthCheck = async () => {
    setRunningHealthCheck(true)
    const results = await runHealthCheck()
    setHealthResults(results)
    setRunningHealthCheck(false)
  }

  const getTableIcon = (tableName: string) => {
    const icons: Record<string, React.ReactElement> = {
      'contacts': <Users className="w-4 h-4" />,
      'campaigns': <Mail className="w-4 h-4" />,
      'events': <Calendar className="w-4 h-4" />,
      'call_logs': <Phone className="w-4 h-4" />,
      'organizations': <Database className="w-4 h-4" />
    }
    return icons[tableName] || <Table className="w-4 h-4" />
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Debug</h1>
          <p className="text-gray-600">Monitor database health and table statistics</p>
        </div>

        {/* Connection Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {stats.connection_status === 'connected' ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <span className="text-green-700 font-medium">Connected to Supabase</span>
                  </>
                ) : stats.connection_status === 'error' ? (
                  <>
                    <XCircle className="w-6 h-6 text-red-500" />
                    <span className="text-red-700 font-medium">Connection Error</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    <span className="text-yellow-700 font-medium">Disconnected</span>
                  </>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={loadDatabaseInfo}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Database Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tables</p>
                  <p className="text-2xl font-bold">{stats.table_count}</p>
                </div>
                <Database className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Rows</p>
                  <p className="text-2xl font-bold">{stats.total_rows.toLocaleString()}</p>
                </div>
                <Hash className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Database Size</p>
                  <p className="text-2xl font-bold">{stats.total_size}</p>
                </div>
                <Database className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Button
                fullWidth
                onClick={handleHealthCheck}
                disabled={runningHealthCheck}
              >
                {runningHealthCheck ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Run Health Check
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Health Check Results */}
        {healthResults.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Health Check Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {healthResults.map((result, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {result.status === 'pass' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-medium">{result.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">{result.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current User Info */}
        {currentUser && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Current User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Auth ID</p>
                  <p className="font-mono">{currentUser.auth.id}</p>
                </div>
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-mono">{currentUser.auth.email}</p>
                </div>
                {currentUser.profile && (
                  <>
                    <div>
                      <p className="text-gray-600">Organization ID</p>
                      <p className="font-mono">{currentUser.profile.organization_id}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Role</p>
                      <p className="font-mono">{currentUser.profile.role}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tables List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tables.map((table) => (
                  <button
                    key={table.table_name}
                    onClick={() => loadSampleData(table.table_name)}
                    className={`w-full p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left ${
                      selectedTable === table.table_name ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTableIcon(table.table_name)}
                        <span className="font-medium">{table.table_name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {table.row_count} rows • {table.size}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sample Data */}
          {selectedTable && (
            <Card>
              <CardHeader>
                <CardTitle>Sample Data: {selectedTable}</CardTitle>
              </CardHeader>
              <CardContent>
                {sampleData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">
                      {JSON.stringify(sampleData, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No data available</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  )
}