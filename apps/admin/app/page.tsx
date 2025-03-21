"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
// import { auth } from "@/app/lib/auth"
import { 
  getDashboardStats, 
  getEmailsInfo, 
  getBlogPosts, 
  getJobListings, 
  getTeamMembers, 
  getContactSubmissions,
} from "@/actions"
import { ContentType } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import dayjs from "dayjs"
import { 
  BarChart2, 
  Mail, 
  FileText, 
  Briefcase, 
  Users, 
  MessageSquare, 
  Plus, 
  Edit, 
  Eye, 
  AlertCircle,
  UserCog
} from "lucide-react"
import { toast } from "sonner"

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [stats, setStats] = useState<any>(null)
  const [emails, setEmails] = useState<any[]>([])
  const [blogPosts, setBlogPosts] = useState<any[]>([])
  const [jobListings, setJobListings] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load data in parallel for better performance
      const [
        statsData,
        emailsData,
        blogPostsData,
        jobListingsData,
        teamMembersData,
        contactsData
      ] = await Promise.all([
        getDashboardStats(),
        getEmailsInfo(),
        getBlogPosts(),
        getJobListings(),
        getTeamMembers(),
        getContactSubmissions()
      ])

      setStats(statsData)
      setEmails(Array.isArray(emailsData) ? emailsData : [])
      setBlogPosts(blogPostsData || [])
      setJobListings(jobListingsData || [])
      setTeamMembers(teamMembersData || [])
      setContacts(contactsData || [])

      setLoading(false)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      setError("Failed to load dashboard data. Please try again or contact support.")
      setLoading(false)
    }
  }

  const handleCreateNew = (type: ContentType) => {
    switch (type) {
      case ContentType.BLOG:
        router.push("/blog/new")
        break
      case ContentType.JOB:
        router.push("/jobs/new")
        break
      case ContentType.TEAM:
        router.push("/team/new")
        break
      default:
        break
    }
  }

  const handleEdit = (type: ContentType, id: string) => {
    switch (type) {
      case ContentType.BLOG:
        router.push(`/blog/edit/${id}`)
        break
      case ContentType.JOB:
        router.push(`/careers/edit/${id}`)
        break
      case ContentType.TEAM:
        router.push(`/team/edit/${id}`)
        break
      case ContentType.CONTACT:
        router.push(`/contacts/${id}`)
        break
      default:
        break
    }
  }

  const handleView = (type: ContentType, slug: string) => {
    switch (type) {
      case ContentType.BLOG:
        window.open(`/blog/${slug}`, "_blank")
        break
      case ContentType.JOB:
        window.open(`/careers/${slug}`, "_blank")
        break
      default:
        break
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <div className="h-8 w-64 bg-slate-800 rounded-md animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-slate-800 rounded-md animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-slate-800 rounded-md animate-pulse mt-4 md:mt-0"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-800 rounded-md animate-pulse"></div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-80 bg-slate-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-500">{error}</h1>
        <Button 
          onClick={() => router.push("/login")} 
          className="mt-4"
        >
          Go to Login
        </Button>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your website&apos;s performance and content
            </p>
          </div>
        </div>
      </div>

      <Tabs 
        defaultValue="dashboard" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-8">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span className="hidden md:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden md:inline">Emails</span>
          </TabsTrigger>
          <TabsTrigger value="blog" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Blog</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden md:inline">Jobs</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Team</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden md:inline">Contacts</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2 col-span-2 md:col-span-1">
            <UserCog className="h-4 w-4" />
            <span className="hidden md:inline">Users</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Overview */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard 
              title="Waitlist Emails" 
              value={stats?.emailCount || 0} 
              icon={<Mail className="h-5 w-5 text-sky-400" />} 
            />
            <StatCard 
              title="Blog Posts" 
              value={stats?.blogCount || 0} 
              icon={<FileText className="h-5 w-5 text-emerald-400" />} 
            />
            <StatCard 
              title="Job Listings" 
              value={stats?.jobCount || 0} 
              icon={<Briefcase className="h-5 w-5 text-purple-400" />} 
            />
            <StatCard 
              title="Team Members" 
              value={teamMembers?.length || 0} 
              icon={<Users className="h-5 w-5 text-amber-400" />} 
            />
            <StatCard 
              title="Contact Submissions" 
              value={stats?.contactCount || 0} 
              icon={<MessageSquare className="h-5 w-5 text-rose-400" />} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Waitlist Signups</CardTitle>
                <CardDescription>Latest email submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emails.slice(0, 5).map((email, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                      <div>
                        <p className="font-medium text-white">{email.email}</p>
                        <p className="text-sm text-slate-400">
                          {dayjs(email.createdAt).format("MMM D, YYYY h:mm A")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab("emails")}
                >
                  View All Emails
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Contact Submissions</CardTitle>
                <CardDescription>Latest contact form submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contacts.slice(0, 5).map((contact, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{contact.name}</p>
                          <StatusBadge status={contact.status} />
                        </div>
                        <p className="text-sm text-slate-400">{contact.email}</p>
                        <p className="text-xs text-slate-500">
                          {dayjs(contact.createdAt).format("MMM D, YYYY")}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(ContentType.CONTACT, contact.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab("contacts")}
                >
                  View All Contacts
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Emails Tab */}
        <TabsContent value="emails">
          <Card>
            <CardHeader>
              <CardTitle>Waitlist Emails</CardTitle>
              <CardDescription>
                All email addresses collected from the waitlist signup form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emails.map((email, index) => (
                      <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-900/30">
                        <td className="py-3 px-4 text-white">{email.email}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {dayjs(email.createdAt).format("MMM D, YYYY h:mm A")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-slate-400">
                Total: {emails.length} emails
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Blog Posts Tab */}
        <TabsContent value="blog">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Blog Posts</h2>
            <Button onClick={() => handleCreateNew(ContentType.BLOG)}>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {blogPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {post.coverImage && (
                    <div className="w-full md:w-48 h-32 bg-slate-800 shrink-0">
                      <img 
                        src={post.coverImage} 
                        alt={post.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">{post.title}</h3>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant={post.published ? "default" : "outline"}>
                            {post.published ? "Published" : "Draft"}
                          </Badge>
                          {post.featured && (
                            <Badge variant="secondary">Featured</Badge>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm line-clamp-2">
                          {post.excerpt || post.content.substring(0, 150)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleEdit(ContentType.BLOG, post.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {post.published && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleView(ContentType.BLOG, post.slug)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                      <div className="flex items-center">
                        {post.author.image ? (
                          <img 
                            src={post.author.image} 
                            alt={post.author.name} 
                            className="w-6 h-6 rounded-full mr-2"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-700 mr-2" />
                        )}
                        <span className="text-sm text-slate-400">{post.author.name}</span>
                      </div>
                      <span className="text-sm text-slate-500">
                        {dayjs(post.createdAt).format("MMM D, YYYY")}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {blogPosts.length === 0 && (
              <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-slate-800">
                <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-400 mb-2">No blog posts yet</h3>
                <p className="text-slate-500 mb-6">Create your first blog post to get started</p>
                <Button onClick={() => handleCreateNew(ContentType.BLOG)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Job Listings Tab */}
        <TabsContent value="jobs">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Job Listings</h2>
            <Button onClick={() => handleCreateNew(ContentType.JOB)}>
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {jobListings.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{job.title}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant={job.active ? "default" : "outline"}>
                          {job.active ? "Active" : "Inactive"}
                        </Badge>
                        {job.featured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                        <span>{job.department}</span>
                        <span>•</span>
                        <span>{job.location}</span>
                        <span>•</span>
                        <span>{job.locationType}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleEdit(ContentType.JOB, job.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {job.active && (
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleView(ContentType.JOB, job.slug)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {jobListings.length === 0 && (
              <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-slate-800">
                <Briefcase className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-400 mb-2">No job listings yet</h3>
                <p className="text-slate-500 mb-6">Create your first job listing to get started</p>
                <Button onClick={() => handleCreateNew(ContentType.JOB)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Job
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Team Members Tab */}
        <TabsContent value="team">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Team Members</h2>
            <Button onClick={() => handleCreateNew(ContentType.TEAM)}>
              <Plus className="h-4 w-4 mr-2" />
              New Member
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <Card key={member.id} className="overflow-hidden">
                <div className="aspect-[3/2] bg-slate-800">
                  {member.image ? (
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                      <Users className="h-12 w-12 text-slate-600" />
                    </div>
                  )}
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-1">{member.name}</h3>
                  <p className="text-sky-400 mb-3">{member.position}</p>
                  <p className="text-slate-400 text-sm line-clamp-3 mb-4">{member.bio}</p>
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleEdit(ContentType.TEAM, member.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {teamMembers.length === 0 && (
              <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-slate-800 col-span-full">
                <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-400 mb-2">No team members yet</h3>
                <p className="text-slate-500 mb-6">Add team members to showcase on your about page</p>
                <Button onClick={() => handleCreateNew(ContentType.TEAM)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Member
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Contact Submissions Tab */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Contact Form Submissions</CardTitle>
              <CardDescription>
                Messages received through the contact form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Company</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="border-b border-slate-800/50 hover:bg-slate-900/30">
                        <td className="py-3 px-4 text-white">{contact.name}</td>
                        <td className="py-3 px-4 text-slate-400">{contact.email}</td>
                        <td className="py-3 px-4 text-slate-400">{contact.company || "-"}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={contact.status} />
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {dayjs(contact.createdAt).format("MMM D, YYYY")}
                        </td>
                        <td className="py-3 px-4">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(ContentType.CONTACT, contact.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Management */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">User Management</h2>
            <Button onClick={() => router.push("/users")}>
              <UserCog className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>System Users</CardTitle>
              <CardDescription>
                Manage authors, editors, and administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and manage user accounts for your team members. Control access levels and permissions.
              </p>
            </CardContent>
            <CardFooter>
                <Button variant="outline" onClick={() => router.push("/users")}>
                Go to User Management
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper components
function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="border border-sky-500/10 bg-slate-900/30 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <h4 className="mt-2 text-3xl font-bold text-white">{value}</h4>
          </div>
          <div className="rounded-full p-3 bg-sky-500/10">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
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
    case "in_progress":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
          In Progress
        </Badge>
      )
    case "resolved":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
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
