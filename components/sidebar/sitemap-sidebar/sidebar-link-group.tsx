'use client';
import { useState, useEffect } from 'react'

interface SidebarLinkGroupProps {
  children: (handleClick: () => void, openGroup: boolean) => React.ReactNode
  open: boolean
}

export default function SidebarLinkGroup({
  children,
  open
}: SidebarLinkGroupProps) {
  const [openGroup, setOpenGroup] = useState<boolean>(open)

  const handleClick = () => {
    setOpenGroup(!openGroup);
  }

  useEffect(() => {
    setOpenGroup(open)
  }, [open])

  return (
    <div className="w-full">
      {children(handleClick, openGroup)}
    </div>
  )
}