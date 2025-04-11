import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'


interface SidebarLinkProps {
  children: React.ReactNode
  href: string
  targetBlank?: boolean
}

export default function SidebarLink({
  children,
  href,
  targetBlank
}: SidebarLinkProps) {

  const pathname = usePathname()


  
const [isSidebarOpen, setSidebarOpen] = useState(false)
  
  return (
<Link 
  className={`flex items-center py-2 ml-1 pl-0 space-x-3 w-44 font-normal ${pathname === href ? 'text-dark-600' : 'text-black dark:text-white'}   hover:text-customBlue dark:hover:text-customBlue`} 
  href={href} 
  target={ targetBlank ? '_blank' : ''}
  onClick={() => setSidebarOpen(false)}
>
  {children}
</Link>
  )
}
