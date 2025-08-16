"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface AsideLinkProps {
  href: string;
  startWith?: string;
  title: string;
  className?: string;
  activeClassName?: string;
  children: ReactNode;
}

export function AsideLink({
  href,
  startWith,
  title,
  className,
  activeClassName,
  children,
}: AsideLinkProps) {
  const pathname = usePathname();
  
  const isActive = startWith 
    ? pathname.startsWith(startWith) && pathname === href
    : pathname === href;

  		return (
			<Link
				href={href}
				className={cn(
					className,
					isActive && activeClassName
				)}
				title={title}
			>
				{children}
			</Link>
		);
}
