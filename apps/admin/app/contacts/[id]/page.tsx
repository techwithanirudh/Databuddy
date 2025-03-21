"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { getContactSubmission, updateContactStatus } from "@/app/actions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowLeft, Mail, Building, MessageSquare } from "lucide-react"
import dayjs from "dayjs"

export default function ContactDetails() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [contact, setContact] = useState<any>(null)
  const [status, setStatus] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadContact = async () => {
      try {
        const contactData = await getContactSubmission(id)
        setContact(contactData)
        setStatus(contactData?.status || "")
        setLoading(false)
      } catch (error) {
        console.error("Error loading contact:", error)
        setError("Failed to load contact details")
        setLoading(false)
      }
    }

    loadContact()
  }, [id])

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    try {
      await updateContactStatus(id, newStatus)
      setStatus(newStatus)
      toast.success("Status updated successfully")
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update status")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    )
  }

  if (error || !contact) {
    return (
      <div className="py-6 space-y-6 px-6">
        <div className="flex flex-col items-center justify-center py-12">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-slate-400 mb-6">{error || "Contact not found"}</p>
          <Button 
            onClick={() => router.push("/admin/contacts")}
            className="bg-sky-500 hover:bg-sky-600"
          >
            Back to Contacts
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push("/admin/contacts")}
            className="border-sky-500/20 bg-slate-900/50 hover:bg-slate-800/70 hover:text-sky-400"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contact Details</h1>
            <p className="text-muted-foreground">
              View and manage contact submission
            </p>
          </div>
        </div>
        
        {!loading && !error && (
          <div className="flex items-center gap-2">
            <Label htmlFor="status" className="mr-2">Status:</Label>
            <Select
              value={status}
              onValueChange={handleStatusChange}
              disabled={updating}
            >
              <SelectTrigger id="status" className="w-[180px] border-sky-500/20 bg-slate-900/50">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-sky-500/20">
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border border-sky-500/10 bg-slate-900/30 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{contact.name}</CardTitle>
              <CardDescription>
                Submitted on {dayjs(contact.createdAt).format("MMMM D, YYYY h:mm A")}
              </CardDescription>
            </div>
            <StatusBadge status={status} />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-sky-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-400">Email</p>
                  <p className="text-white">{contact.email}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Building className="h-5 w-5 text-sky-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-400">Company</p>
                  <p className="text-white">{contact.company || "Not provided"}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-start mb-2">
                <MessageSquare className="h-5 w-5 text-sky-400 mr-2 mt-0.5" />
                <p className="text-sm font-medium text-slate-400">Message</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-md border border-sky-500/10">
                <p className="text-white whitespace-pre-wrap">{contact.message}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => router.push("/admin/contacts")}
              className="border-sky-500/20 bg-slate-900/50 hover:bg-slate-800/70 hover:text-sky-400"
            >
              Close
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "new":
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
          New
        </Badge>
      )
    case "in progress":
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
          In Progress
        </Badge>
      )
    case "resolved":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
          Resolved
        </Badge>
      )
    case "spam":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
          Spam
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/20">
          {status}
        </Badge>
      )
  }
} 