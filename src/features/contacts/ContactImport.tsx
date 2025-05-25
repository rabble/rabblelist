import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { ContactService } from './contacts.service'
import { 
  Upload,
  FileSpreadsheet,
  Check,
  X,
  AlertCircle,
  Download,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import type { ContactImportRow } from '@/types'

interface ImportError {
  row: number
  field: string
  message: string
}

interface ParsedData {
  valid: ContactImportRow[]
  errors: ImportError[]
}

export function ContactImport() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [importing, setImporting] = useState(false)
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({})
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])

  // Required fields and their possible CSV header names
  const requiredFields = {
    full_name: ['name', 'full name', 'fullname', 'contact name'],
    phone: ['phone', 'phone number', 'mobile', 'cell', 'telephone'],
    email: ['email', 'email address', 'e-mail'],
    address: ['address', 'location', 'street address'],
    tags: ['tags', 'labels', 'groups']
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    
    setFile(file)
    parseCSV(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1
  })

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = Object.keys(results.data[0] || {})
        setCsvHeaders(headers)
        
        // Auto-detect field mappings
        const mapping: Record<string, string> = {}
        
        Object.entries(requiredFields).forEach(([field, possibleNames]) => {
          const matchedHeader = headers.find(header => 
            possibleNames.some(name => 
              header.toLowerCase().includes(name.toLowerCase())
            )
          )
          
          if (matchedHeader) {
            mapping[field] = matchedHeader
          }
        })
        
        setFieldMapping(mapping)
        
        // Validate data
        const validated = validateData(results.data, mapping)
        setParsedData(validated)
      },
      error: (error) => {
        alert(`Failed to parse CSV: ${error.message}`)
      }
    })
  }

  const validateData = (data: any[], mapping: Record<string, string>): ParsedData => {
    const valid: ContactImportRow[] = []
    const errors: ImportError[] = []
    
    data.forEach((row, index) => {
      const rowNumber = index + 2 // +2 for header row and 0-index
      
      // Check for required fields
      if (!mapping.full_name || !row[mapping.full_name]) {
        errors.push({
          row: rowNumber,
          field: 'full_name',
          message: 'Name is required'
        })
        return
      }
      
      if (!mapping.phone || !row[mapping.phone]) {
        errors.push({
          row: rowNumber,
          field: 'phone',
          message: 'Phone is required'
        })
        return
      }
      
      // Clean phone number
      const phone = row[mapping.phone].replace(/\D/g, '')
      if (phone.length < 10) {
        errors.push({
          row: rowNumber,
          field: 'phone',
          message: 'Invalid phone number'
        })
        return
      }
      
      // Build valid contact
      const contact: ContactImportRow = {
        full_name: row[mapping.full_name].trim(),
        phone: phone.length === 10 ? `+1${phone}` : `+${phone}`,
        email: mapping.email ? row[mapping.email]?.trim() : undefined,
        address: mapping.address ? row[mapping.address]?.trim() : undefined,
        tags: mapping.tags ? row[mapping.tags]?.split(/[,;]/).map((t: string) => t.trim()) : undefined
      }
      
      // Validate email if provided
      if (contact.email && !contact.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        errors.push({
          row: rowNumber,
          field: 'email',
          message: 'Invalid email address'
        })
        return
      }
      
      valid.push(contact)
    })
    
    return { valid, errors }
  }

  const handleFieldMappingChange = (field: string, csvHeader: string) => {
    const newMapping = { ...fieldMapping, [field]: csvHeader }
    setFieldMapping(newMapping)
    
    // Re-validate with new mapping
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const validated = validateData(results.data, newMapping)
          setParsedData(validated)
        }
      })
    }
  }

  const handleImport = async () => {
    if (!parsedData || parsedData.valid.length === 0) return
    
    setImporting(true)
    
    try {
      const { data, error } = await ContactService.bulkImportContacts(
        parsedData.valid.map(row => ({
          full_name: row.full_name,
          phone: row.phone,
          email: row.email,
          address: row.address,
          tags: Array.isArray(row.tags) ? row.tags : (row.tags ? [row.tags] : [])
        }))
      )
      
      if (error) {
        alert('Failed to import contacts')
      } else {
        alert(`Successfully imported ${data.length} contacts!`)
        navigate('/contacts')
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Failed to import contacts')
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = `full_name,phone,email,address,tags
John Doe,+15551234567,john@example.com,"123 Main St, City, State",volunteer
Jane Smith,(555) 234-5678,jane@example.com,"456 Oak Ave, Town, State","donor,member"`
    
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contact-import-template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/contacts')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contacts
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Import Contacts
              </h1>
              <p className="text-gray-600 mt-1">
                Upload a CSV file to bulk import contacts
              </p>
            </div>
            
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>
        </div>

        {/* Upload Area */}
        {!file && (
          <Card>
            <CardContent className="p-12">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isDragActive 
                    ? 'Drop your CSV file here' 
                    : 'Drag & drop your CSV file here'
                  }
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  CSV files only, up to 10,000 contacts
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Field Mapping */}
        {file && csvHeaders.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Field Mapping</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Map your CSV columns to contact fields. We've auto-detected some mappings.
              </p>
              
              <div className="space-y-4">
                {Object.entries(requiredFields).map(([field, _]) => (
                  <div key={field} className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {field.replace('_', ' ')}
                      {field === 'full_name' || field === 'phone' ? ' *' : ''}
                    </label>
                    <select
                      className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={fieldMapping[field] || ''}
                      onChange={(e) => handleFieldMappingChange(field, e.target.value)}
                    >
                      <option value="">-- Select Column --</option>
                      {csvHeaders.map(header => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview & Validation */}
        {parsedData && (
          <Card>
            <CardHeader>
              <CardTitle>Preview & Validation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">
                    {parsedData.valid.length} valid contacts
                  </span>
                </div>
                {parsedData.errors.length > 0 && (
                  <div className="flex items-center gap-2">
                    <X className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium">
                      {parsedData.errors.length} errors
                    </span>
                  </div>
                )}
              </div>

              {/* Errors */}
              {parsedData.errors.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Errors (these rows will be skipped)
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {parsedData.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 mt-0.5" />
                        <span>
                          Row {error.row}: {error.message} ({error.field})
                        </span>
                      </div>
                    ))}
                    {parsedData.errors.length > 10 && (
                      <p className="text-sm text-red-700 mt-2">
                        ... and {parsedData.errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Valid Preview */}
              {parsedData.valid.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Preview (first 5 contacts)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Phone</th>
                          <th className="px-3 py-2 text-left">Email</th>
                          <th className="px-3 py-2 text-left">Tags</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {parsedData.valid.slice(0, 5).map((contact, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2">{contact.full_name}</td>
                            <td className="px-3 py-2">{contact.phone}</td>
                            <td className="px-3 py-2">{contact.email || '-'}</td>
                            <td className="px-3 py-2">
                              {(Array.isArray(contact.tags) ? contact.tags.join(', ') : contact.tags) || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null)
                    setParsedData(null)
                    setFieldMapping({})
                    setCsvHeaders([])
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || parsedData.valid.length === 0}
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import {parsedData.valid.length} Contacts
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}