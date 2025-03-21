"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getContactSubmissions } from '@/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MessageSquare, RefreshCw, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

interface Contact {
  id: string
  name: string
  email: string
  message: string
  createdAt: Date
  status: string
}

export default function ContactsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true)
        const data = await getContactSubmissions()
        setContacts(data as unknown as Contact[])
        setLoading(false)
      } catch (error) {
        console.error('Error fetching contacts:', error)
        setLoading(false)
      }
    }

    fetchContacts()
  }, [refreshKey])

  const handleViewContact = (id: string) => {
    router.push(`/admin/contacts/${id}`)
  }

  const refreshContacts = () => {
    setRefreshKey(prev => prev + 1)
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">New</Badge>
      case 'in progress':
        return <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">In Progress</Badge>
      case 'resolved':
        return <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">Resolved</Badge>
      case 'spam':
        return <Badge variant="outline" className="text-red-400 border-red-500/20 bg-red-500/10">Spam</Badge>
      default:
        return <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/20">{status}</Badge>
    }
  }

  return (
    <div className="py-6 space-y-6 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-sky-500/10 rounded-lg">
            <MessageSquare className="h-8 w-8 text-sky-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contact Submissions</h1>
            <p className="text-muted-foreground">
              View and manage contact form submissions
            </p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={refreshContacts} 
          size="sm"
          className="border-sky-500/20 bg-slate-900/50 hover:bg-slate-800/70 hover:text-sky-400"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <Separator className="bg-sky-500/10" />
      
      <Card className="border border-sky-500/10 bg-slate-900/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle>Contact Messages</CardTitle>
          <CardDescription>
            View and respond to messages from your website visitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No contact submissions found
            </div>
          ) : (
            <div className="rounded-md border border-sky-500/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-900/50">
                  <TableRow className="hover:bg-slate-800/50 border-sky-500/10">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id} className="hover:bg-slate-800/30 border-sky-500/10">
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell>{format(new Date(contact.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getStatusBadge(contact.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewContact(contact.id)}
                          className="hover:bg-sky-500/10 hover:text-sky-400"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 