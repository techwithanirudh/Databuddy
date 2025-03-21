"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getBlogPosts } from '../../actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Pencil, Plus, FileText, Eye, EyeOff, RefreshCw, Folder, Tag } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'

// Define the Post type
interface Author {
  name: string | null;
  image: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  description: string | null;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  description: string | null;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: Author | null;
  categories: Category[];
  tags: Tag[];
}

export default function BlogManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Use a ref to track if this is the first render
  const isFirstRender = useRef(true)
  
  useEffect(() => {
    // Skip data fetching on first client-side render to prevent double fetching
    if (typeof window !== 'undefined' && isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    
    let isMounted = true
    
    const fetchPosts = async () => {
      try {
        setLoading(true)
        const allPosts = await getBlogPosts()
        
        if (isMounted) {
          setPosts(allPosts as unknown as Post[])
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching blog posts:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    fetchPosts()
    
    return () => {
      isMounted = false
    }
  }, [refreshKey])

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const filteredPosts = activeTab === 'all' 
    ? posts 
    : activeTab === 'published' 
      ? posts.filter(post => post.published) 
      : posts.filter(post => !post.published)

  const handleEditPost = (postId: string) => {
    router.push(`/blog/edit/${postId}`)
  }

  const handleNewPost = () => {
    router.push('/blog/new')
  }

  const refreshPosts = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="py-6 space-y-6 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-sky-500/10 rounded-lg">
            <FileText className="h-8 w-8 text-sky-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
            <p className="text-muted-foreground">
              Create and manage blog posts, categories, and tags
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" asChild className="border-sky-500/20 bg-slate-900/50 hover:bg-slate-800/70 hover:text-sky-400">
            <Link href="/blog/categories">
              <Folder className="h-4 w-4 mr-2" />
              Categories
            </Link>
          </Button>
          <Button variant="outline" asChild className="border-sky-500/20 bg-slate-900/50 hover:bg-slate-800/70 hover:text-sky-400">
            <Link href="/blog/tags">
              <Tag className="h-4 w-4 mr-2" />
              Tags
            </Link>
          </Button>
          <Button variant="outline" onClick={refreshPosts} className="border-sky-500/20 bg-slate-900/50 hover:bg-slate-800/70 hover:text-sky-400">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/blog/new">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Link>
          </Button>
        </div>
      </div>
      
      <Separator />
      
      <Card className="border border-sky-500/10 bg-slate-900/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle>Blog Posts</CardTitle>
          <CardDescription>
            View and manage all blog posts. Edit content, update status, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 bg-slate-800/50">
              <TabsTrigger value="all" className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400">All Posts</TabsTrigger>
              <TabsTrigger value="published" className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400">Published</TabsTrigger>
              <TabsTrigger value="drafts" className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400">Drafts</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="space-y-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-sky-500/10 rounded-lg bg-slate-900/20">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-16 w-16 rounded-md" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-64" />
                        <Skeleton className="h-4 w-40" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                      </div>
                    </div>
                    <Skeleton className="h-9 w-20" />
                  </div>
                ))
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-sky-400/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No posts found</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'all' 
                      ? "You haven't created any blog posts yet." 
                      : activeTab === 'published' 
                        ? "You don't have any published posts." 
                        : "You don't have any draft posts."}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4 border-sky-500/20 bg-slate-900/50 hover:bg-slate-800/70 hover:text-sky-400"
                    onClick={handleNewPost}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create a new post
                  </Button>
                </div>
              ) : (
                filteredPosts.map(post => (
                  <div key={post.id} className="flex items-center justify-between p-4 border border-sky-500/10 rounded-lg bg-slate-900/20 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-start gap-4">
                      {post.coverImage ? (
                        <div className="h-16 w-16 rounded-md overflow-hidden">
                          <img 
                            src={post.coverImage} 
                            alt={post.title} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 bg-sky-500/10 rounded-md flex items-center justify-center">
                          <FileText className="h-6 w-6 text-sky-400/70" />
                        </div>
                      )}
                      
                      <div>
                        <h3 className="font-medium">{post.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {post.author && (
                            <>
                              <div className="flex items-center gap-1">
                                <Avatar className="h-5 w-5">
                                  {post.author.image ? (
                                    <AvatarImage src={post.author.image} alt={post.author.name || 'Author'} />
                                  ) : null}
                                  <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
                                </Avatar>
                                <span>{post.author.name || 'Anonymous'}</span>
                              </div>
                              <span>•</span>
                            </>
                          )}
                          <span>{format(new Date(post.createdAt.toString()), 'MMM d, yyyy')}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant={post.published ? "default" : "outline"} className={post.published ? "bg-sky-500/20 hover:bg-sky-500/30 text-sky-400" : "bg-slate-500/10 text-slate-400 border-slate-500/20"}>
                            {post.published ? (
                              <Eye className="h-3 w-3 mr-1" />
                            ) : (
                              <EyeOff className="h-3 w-3 mr-1" />
                            )}
                            {post.published ? 'Published' : 'Draft'}
                          </Badge>
                          
                          {post.featured && (
                            <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20">Featured</Badge>
                          )}
                          
                          {post.categories && post.categories.length > 0 && (
                            <Badge variant="outline" className="text-xs bg-slate-500/10 text-slate-400 border-slate-500/20">
                              {post.categories[0].name}
                              {post.categories.length > 1 && ` +${post.categories.length - 1}`}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditPost(post.id)}
                      className="border-sky-500/20 bg-slate-900/50 hover:bg-slate-800/70 hover:text-sky-400"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 