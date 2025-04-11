'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { useSelectedLayoutSegments } from 'next/navigation';
import { Transition } from '@headlessui/react';
import Link from 'next/link';

import {
  AcademicCapIcon,
  GlobeAltIcon,
  BeakerIcon,
  ChevronRightIcon,
  CpuChipIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

import SidebarLinkGroup from './sidebar-link-group';
import SidebarLink from './sidebar-link';
import { sidebarData } from './siteMapData';
import { mergeDynamicPagesIntoSidebar } from './utils/mergeDynamicPagesIntoSidebar';


type NavItem = {
  name: string;
  href?: string;
  current?: boolean;
  children?: NavItem[];
  subChildren?: NavItem[];
  targetBlank?: boolean;
  icon?: string;
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  GlobeAltIcon,
  AcademicCapIcon,
  BeakerIcon,
  CpuChipIcon,
  ChevronRightIcon,
  XMarkIcon
};

const DynamicIcon = ({ name }: { name: string }) => {
  const IconComponent = iconMap[name];
  if (!IconComponent) return null;
  return (
    <IconComponent className="h-4 w-4 text-gray-500 dark:text-gray-500 group-hover:text-customBlue dark:hover:text-customBlue" />
  );
};
const dynamicPages = [
    { name: 'New Page', href: 'programme/j-pal/new-page' },
    { name: 'Family Team', href: 'about/family-team' },
    { name: 'New sub Programe ', href: 'programme/j-pal/family-album/new-programme' },
    { name: 'Just a Page', href: 'subfolde/just-a-page' }
  ];
  
  const finalSidebar = mergeDynamicPagesIntoSidebar(sidebarData, dynamicPages);
const NavLink = ({
  href,
  children,
  icon
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <Link
      href={href}
      className="relative flex items-center font-normal sans-serif text-black py-2 pr-2 hover:text-customBlue dark:hover:text-customBlue before:absolute before:inset-0 before:rounded before:bg-gradient-to-tr before:opacity-20 before:-z-10 before:pointer-events-none dark:text-slate-200"
    >
      {icon && <span className="mr-3">{icon}</span>}
      {children}
    </Link>
  );
};

const NavGroupWrapper = ({
  title,
  icon,
  children,
  level
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  level: number;
}) => {
  const segments = useSelectedLayoutSegments();
  const open = segments.includes(title);
  const indent = ['md:w-[230px]', 'md:w-[194px] ml-1', 'md:w-[174px] ml-1'][level] || 'md:w-[230px]';

  return (
    <SidebarLinkGroup open={open}>
      {(handleClick, open) => (
        <>
          <div
            onTouchStart={handleClick}
            className={`relative flex lg:hidden ${indent} justify-between items-center font-normal sans-serif text-black py-2 pr-2 before:absolute before:inset-0 before:rounded before:bg-gradient-to-tr before:opacity-20 before:-z-10 before:pointer-events-none dark:text-slate-200 cursor-pointer`}
          >
            <div className="flex items-center hover:text-customBlue dark:hover:text-customBlue">
              {icon && <span className="mr-3">{icon}</span>}
              {title}
            </div>
            <ChevronRightIcon
              className={`h-3 w-3 text-black dark:text-white ml-2 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
            />
          </div>

          <div
            onMouseDown={handleClick}
            onTouchStart={handleClick}
            className={`hidden lg:flex ${indent} justify-between items-center font-normal sans-serif text-black py-2 pr-2 cursor-pointer dark:text-slate-200`}
          >
            <div className="flex items-center hover:text-customBlue dark:hover:text-customBlue">
              {icon && <span className="mr-3">{icon}</span>}
              {title}
            </div>
            <ChevronRightIcon
              className={`h-3 w-3 text-black dark:text-white ml-2 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
            />
          </div>

          <div
            className={`mb-3 ml-[7.5px] pl-4 border-l border-slate-200 dark:border-slate-800 font-normal ${!open && 'hidden'}`}
          >
            {children}
          </div>
        </>
      )}
    </SidebarLinkGroup>
  );
};

const renderNavItem = (item: NavItem, level = 0): ReactNode => {
  if (item.children) {
    return (
      <NavGroupWrapper
        key={item.name}
        title={item.name}
        level={level}
        icon={item.icon && <DynamicIcon name={item.icon} />}
      >
        {item.children.map((child) => renderNavItem(child, level + 1))}
      </NavGroupWrapper>
    );
  }

  return (
    <div key={item.name}>
      <SidebarLink href={item.href!} targetBlank={item.targetBlank}>
        {item.name}
      </SidebarLink>
    </div>
  );
};

// your single data source:

 // or define it in same file if not separated

export default function TestOnlySidebarV2() {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div ref={sidebarRef} className="overflow-y-auto side-scroll-bar lg:max-h-screen">
      <Transition show={sidebarOpen}>
        <div
          aria-hidden="true"
          className="md:hidden fixed sm:static inset-0 z-0 bg-opacity-20 transition-opacity"
        />
      </Transition>

      <div className="">
        <Transition
          show={sidebarOpen}
          unmount={false}
          as="aside"
          id="sidebar"
          className="left-0 fixed lg:static top-[64px] dropdown-item lg:top-0 lg:bottom-0 pb-40 w-full pt-6 bg-white lg:w-[233px] h-screen overflow-y-auto md:h-full lg:shrink-0 z-50 lg:overflow-x-hidden lg:!opacity-100 lg:!block dark:bg-slate-900"
          enter="transition ease-out duration-200 transform"
          enterFrom="opacity-0 -translate-x-full"
          enterTo="opacity-100 translate-x-0"
          leave="transition ease-out duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="w-full sm:w-[200px] px-4 sm:px-6 md:pl-2 md:pr-8">
            <div className="relative z-30">
              <nav className="sm:block w-full text-sm">
                {finalSidebar.map((item) => renderNavItem(item))}
              </nav>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  );
}
