"use server";

import { auth } from "@databuddy/auth";
import { db as prisma } from "@databuddy/db";
import { revalidatePath } from "next/cache";
import { EmailType } from "@/types";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Authentication middleware
async function Auth() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    if (!session?.user) {
        throw new Error("Unauthorized");
    }
    if (session.user.role !== "ADMIN") {
        redirect("/unauthorized");
    }

    return session.user;
}

// Email management
async function getEmails(type: EmailType) {
    await Auth();
    if (type === EmailType.COUNT) {
        return await prisma.email.count();
    } else if (type === EmailType.INFO) {
        return await prisma.email.findMany({
            select: {
                email: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
}

export async function getEmailCount() {
    return await getEmails(EmailType.COUNT);
}

export async function getEmailsInfo() {
    return await getEmails(EmailType.INFO);
}

export async function deleteEmail(id: string) {
    await Auth();
    await prisma.email.delete({
        where: { id }
    });
    revalidatePath('/admin');
    return { success: true };
}

// Blog management
export async function getBlogPosts(published?: boolean) {
    await Auth();
    return await prisma.post.findMany({
        where: published !== undefined ? { published } : undefined,
        include: {
            author: {
                select: {
                    name: true,
                    image: true
                }
            },
            category: true,
            tags: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

export async function getBlogPost(id: string) {
    await Auth();
    return await prisma.post.findUnique({
        where: { id },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    image: true
                }
            },
            category: true,
            tags: true
        }
    });
}

export async function createBlogPost(data: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    published: boolean;
    featured: boolean;
    authorId: string;
    categoryIds?: string[];
    tagIds?: string[];
}) {
    const user = await Auth();
    
    const post = await prisma.post.create({
        data: {
            title: data.title,
            slug: data.slug,
            content: data.content,
            excerpt: data.excerpt,
            coverImage: data.coverImage,
            published: data.published,
            authorId: data.authorId,
            categoryId: data.categoryIds?.length ? data.categoryIds[0] : undefined,
            tags: data.tagIds?.length 
                ? { connect: data.tagIds.map(id => ({ id })) } 
                : undefined
        }
    });
    
    revalidatePath('/admin');
    revalidatePath('/blog');
    return post;
}

export async function updateBlogPost(id: string, data: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    coverImage?: string;
    published?: boolean;
    featured?: boolean;
    categoryIds?: string[];
    tagIds?: string[];
    imageSizes?: string;
}) {
    await Auth();
    
    const { imageSizes, ...restData } = data;
    
    if (imageSizes) {
        console.log('Image sizes metadata:', imageSizes);
    }
    
    const post = await prisma.post.update({
        where: { id },
        data: {
            title: restData.title,
            slug: restData.slug,
            content: restData.content,
            excerpt: restData.excerpt,
            coverImage: restData.coverImage,
            published: restData.published,
            categoryId: restData.categoryIds?.length ? restData.categoryIds[0] : undefined,
            tags: restData.tagIds 
                ? { set: restData.tagIds.map(id => ({ id })) } 
                : undefined
        }
    });
    
    revalidatePath('/admin');
    revalidatePath('/blog');
    revalidatePath(`/blog/${post.slug}`);
    return post;
}

export async function deleteBlogPost(id: string) {
    await Auth();
    await prisma.post.delete({
        where: { id }
    });
    revalidatePath('/admin');
    revalidatePath('/blog');
    return { success: true };
}

// Categories and Tags
export async function getCategories() {
    await Auth();
    return await prisma.category.findMany({
        orderBy: { name: 'asc' }
    });
}

export async function getTags() {
    await Auth();
    return await prisma.tag.findMany({
        orderBy: { name: 'asc' }
    });
}

export async function createCategory(data: { name: string; slug: string; description?: string }) {
    await Auth();
    const category = await prisma.category.create({
        data
    });
    revalidatePath('/admin');
    return category;
}

export async function deleteCategory(id: string) {
    await Auth();
    await prisma.category.delete({
        where: { id }
    });
    revalidatePath('/admin');
    revalidatePath('/blog');
    return { success: true };
}

export async function createTag(data: { name: string; slug: string }) {
    await Auth();
    const tag = await prisma.tag.create({
        data
    });
    revalidatePath('/admin');
    return tag;
}

export async function deleteTag(id: string) {
    await Auth();
    await prisma.tag.delete({
        where: { id }
    });
    revalidatePath('/admin');
    revalidatePath('/blog');
    return { success: true };
}

// Job listings management
export async function getJobListings(active?: boolean) {
    await Auth();
    return await prisma.jobListing.findMany({
        where: active !== undefined ? { closedAt: null } : undefined,
        orderBy: {
            createdAt: 'desc'
        }
    });
}

export async function getJobListing(id: string) {
    await Auth();
    return await prisma.jobListing.findUnique({
        where: { id }
    });
}

export async function createJobListing(data: {
    title: string;
    slug: string;
    department: string;
    location: string;
    locationType: string;
    description: string;
    requirements: string[];
    responsibilities: string[];
    active: boolean;
    featured: boolean;
    salary?: { min: number; max: number; currency: string };
    applicationUrl?: string;
}) {
    await Auth();
    
    const job = await prisma.jobListing.create({
        data: {
            title: data.title,
            description: data.description,
            location: data.location,
            requirements: Array.isArray(data.requirements) 
                ? JSON.stringify(data.requirements) 
                : data.requirements,
            salary: data.salary ? JSON.stringify(data.salary) : null,
            type: data.locationType,
            published: data.active,
            closedAt: data.active ? null : new Date()
        }
    });
    
    revalidatePath('/admin');
    revalidatePath('/careers');
    return job;
}

export async function updateJobListing(id: string, data: {
    title?: string;
    slug?: string;
    department?: string;
    location?: string;
    locationType?: string;
    description?: string;
    requirements?: string[];
    responsibilities?: string[];
    active?: boolean;
    featured?: boolean;
    salary?: { min: number; max: number; currency: string };
    applicationUrl?: string;
}) {
    await Auth();
    
    const updateData: any = {};
    
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.location) updateData.location = data.location;
    if (data.locationType) updateData.type = data.locationType;
    if (data.requirements) {
        updateData.requirements = Array.isArray(data.requirements) 
            ? JSON.stringify(data.requirements) 
            : data.requirements;
    }
    if (data.salary) {
        updateData.salary = JSON.stringify(data.salary);
    }
    if (data.active !== undefined) {
        updateData.published = data.active;
        updateData.closedAt = data.active ? null : new Date();
    }
    
    const job = await prisma.jobListing.update({
        where: { id },
        data: updateData
    });
    
    revalidatePath('/admin');
    revalidatePath('/careers');
    return job;
}

export async function deleteJobListing(id: string) {
    await Auth();
    await prisma.jobListing.delete({
        where: { id }
    });
    revalidatePath('/admin');
    revalidatePath('/careers');
    return { success: true };
}

// Job applications
export async function getJobApplications(status?: "NEW" | "REVIEWED" | "INTERVIEWING" | "REJECTED" | "HIRED") {
    await Auth();
    return await prisma.jobApplication.findMany({
        where: status ? { status } : undefined,
        include: {
            jobListing: {
                select: {
                    title: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

export async function updateJobApplicationStatus(id: string, status: "NEW" | "REVIEWED" | "INTERVIEWING" | "REJECTED" | "HIRED") {
    await Auth();
    const application = await prisma.jobApplication.update({
        where: { id },
        data: { status }
    });
    revalidatePath('/admin');
    return application;
}

// Team members management
export async function getTeamMembers() {
    await Auth();
    return await prisma.user.findMany({
        where: {
            role: {
                in: ["ADMIN", "EDITOR", "AUTHOR"]
            }
        },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true
        },
        orderBy: {
            createdAt: 'asc'
        }
    });
}

// Contact form submissions
export async function getContactSubmissions(status?: string) {
    await Auth();
    return await prisma.contact.findMany({
        where: status ? { status } : undefined,
        orderBy: {
            createdAt: 'desc'
        }
    });
}

export async function getContactSubmission(id: string) {
    await Auth();
    return await prisma.contact.findUnique({
        where: { id }
    });
}

export async function updateContactStatus(id: string, status: string) {
    await Auth();
    const contact = await prisma.contact.update({
        where: { id },
        data: { status }
    });
    revalidatePath('/admin');
    return contact;
}

// Dashboard stats
export async function getDashboardStats() {
    await Auth();
    
    const [
        emailCount,
        contactCount,
        blogCount,
        jobCount,
        applicationCount
    ] = await Promise.all([
        prisma.email.count(),
        prisma.contact.count(),
        prisma.post.count(),
        prisma.jobListing.count(),
        prisma.jobApplication.count()
    ]);
    
    return {
        emailCount,
        contactCount,
        blogCount,
        jobCount,
        applicationCount
    };
}

export async function updateUser(
    userId: string,
    data: {
        name?: string;
        email?: string;
        role?: string;
        image?: string;
        password?: string;
    }
) {
    await Auth();

    try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            throw new Error("User not found");
        }

        // Check if email is being changed and if it's already in use
        if (data.email && data.email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email: data.email }
            });

            if (emailExists) {
                throw new Error("Email already in use");
            }
        }

        // Prepare update data
        const updateData: any = {};
        
        if (data.name) updateData.name = data.name;
        if (data.email) updateData.email = data.email;
        if (data.role) updateData.role = data.role;
        if (data.image !== undefined) updateData.image = data.image;
        
        // If password is provided, hash it
        if (data.password) {
            // Import bcrypt only when needed to avoid server component issues
            const bcrypt = await import('bcryptjs');
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                createdAt: true,
            }
        });

        revalidatePath('/admin/users');
        return updatedUser;
    } catch (error: any) {
        console.error("Error updating user:", error);
        throw new Error(error.message || "Failed to update user");
    }
}
