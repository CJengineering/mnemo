'use client';

import { useRef, useEffect, useState, ReactNode } from 'react';

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
const NavLink = ({
  href,
  children,
  icon
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Link
      href={href}
      onClick={() => setSidebarOpen(false)}
      className="relative flex items-center font-normal sans-serif text-black py-2 pr-2 hover:text-customBlue dark:hover:text-customBlue before:absolute before:inset-0 before:rounded before:bg-gradient-to-tr before:opacity-20 before:-z-10 before:pointer-events-none dark:text-slate-200"
    >
      {icon && <span className="mr-3">{icon}</span>}
      {children}
    </Link>
  );
};

const NavGroup = ({
  title,
  children,
  icon
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  const segments = useSelectedLayoutSegments();
  const open = segments.includes(title);

  return (
    <SidebarLinkGroup open={open}>
      {(handleClick, open) => (
        <>
          <div
            // onMouseDown={(e) => {
            //   e.preventDefault();
            //   handleClick();
            // }}
            onTouchStart={(e) => {
              handleClick();
            }}
            className="relative flex lg:hidden md:w-[230px] justify-between items-center font-normal sans-serif text-black py-2 pr-2 before:absolute before:inset-0 before:rounded before:bg-gradient-to-tr before:opacity-20 before:-z-10 before:pointer-events-none dark:text-slate-200 cursor-pointer"
          >
            <div className="flex items-center    hover:text-customBlue dark:hover:text-customBlue">
              {icon && <span className="mr-3">{icon}</span>}
              {title}
            </div>
            <div>
              <ChevronRightIcon
                className={`h-3 w-3 text-black dark:text-white shrink-0 ml-2 transition-transform duration-200 ${
                  open ? 'rotate-90' : ''
                }`}
              />
            </div>
          </div>

          <div
            onMouseDown={(e) => {
              handleClick();
            }}
            onTouchStart={(e) => {
              handleClick();
            }}
            className="hidden lg:flex relative md:w-[230px] justify-between items-center font-normal sans-serif text-black py-2 pr-2 before:absolute before:inset-0 before:rounded before:bg-gradient-to-tr before:opacity-20 before:-z-10 before:pointer-events-none dark:text-slate-200 cursor-pointer"
          >
            <div className="flex items-center  hover:text-customBlue dark:hover:text-customBlue">
              {icon && <span className="mr-3">{icon}</span>}
              {title}
            </div>
            <div>
              <ChevronRightIcon
                className={`h-3 w-3 text-black dark:text-white shrink-0 ml-2 transition-transform duration-200 ${
                  open ? 'rotate-90' : ''
                }`}
              />
            </div>
          </div>

          <div
            className={`mb-3 ml-[7.5px] pl-4  z-50 border-l sans-serif font-normal border-slate-200 dark:border-slate-800 ${
              !open && 'hidden'
            }`}
          >
            {children}
          </div>
        </>
      )}
    </SidebarLinkGroup>
  );
};

const NavSubGroup = ({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const segments = useSelectedLayoutSegments();
  const open = segments.includes(title);

  return (
    <SidebarLinkGroup open={open}>
      {(handleClick, open) => (
        <>
          <div
            onTouchStart={(e) => {
              handleClick();
            }}
            className="relative flex lg:hidden md:w-[230px] ml-1 justify-between items-center font-normal sans-serif text-black py-2 pr-2 before:absolute before:inset-0 before:rounded before:bg-gradient-to-tr before:opacity-20 before:-z-10 before:pointer-events-none dark:text-slate-200 cursor-pointer"
          >
            <div className="flex items-center  hover:text-customBlue dark:hover:text-customBlue">
              {title}
            </div>
            <div>
              <ChevronRightIcon
                className={`h-3 w-3 text-black dark:text-white shrink-0 ml-2 transition-transform duration-200 ${
                  open ? 'rotate-90' : ''
                }`}
              />
            </div>
          </div>

          <div
            onMouseDown={(e) => {
              handleClick();
            }}
            onTouchStart={(e) => {
              handleClick();
            }}
            className="hidden lg:flex ml-1 relative md:w-[194px] justify-between items-center font-normal sans-serif text-black py-2 r-2 before:absolute before:inset-0 before:rounded before:bg-gradient-to-tr before:opacity-20 before:-z-10 before:pointer-events-none dark:text-slate-200 cursor-pointer"
          >
            <div className="flex items-center hover:text-customBlue dark:hover:text-customBlue">
              {title}
            </div>
            <div>
              <ChevronRightIcon
                className={`h-3 w-3 text-black dark:text-white shrink-0 ml-2 transition-transform duration-200 ${
                  open ? 'rotate-90' : ''
                }`}
              />
            </div>
          </div>

          <div
            className={`mb-3 ml-[7.5px] pl-4 z-50 border-l sans-serif font-normal border-slate-200 dark:border-slate-800 ${
              !open && 'hidden'
            }`}
          >
            {children}
          </div>
        </>
      )}
    </SidebarLinkGroup>
  );
};
const NavSubSubGroup = ({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const segments = useSelectedLayoutSegments();
  const open = segments.includes(title);

  return (
    <SidebarLinkGroup open={open}>
      {(handleClick, open) => (
        <>
          <div
            onTouchStart={(e) => {
              handleClick();
            }}
            className="relative flex lg:hidden md:w-[230px] ml-1 justify-between items-center font-normal sans-serif text-black py-2 pr-2 before:absolute before:inset-0 before:rounded before:bg-gradient-to-tr before:opacity-20 before:-z-10 before:pointer-events-none dark:text-slate-200 cursor-pointer"
          >
            <div className="flex items-center  hover:text-customBlue dark:hover:text-customBlue">
              {title}
            </div>
            <div>
              <ChevronRightIcon
                className={`h-3 w-3 text-black dark:text-white shrink-0 ml-2 transition-transform duration-200 ${
                  open ? 'rotate-90' : ''
                }`}
              />
            </div>
          </div>

          <div
            onMouseDown={(e) => {
              handleClick();
            }}
            onTouchStart={(e) => {
              handleClick();
            }}
            className="hidden lg:flex  relative md:w-[174px] ml-1  justify-between items-center font-normal sans-serif text-black py-2 pr-2 before:absolute before:inset-0 before:rounded before:bg-gradient-to-tr before:opacity-20 before:-z-10 before:pointer-events-none dark:text-slate-200 cursor-pointer"
          >
            <div className="flex items-center  hover:text-customBlue dark:hover:text-customBlue">
              {title}
            </div>
            <div>
              <ChevronRightIcon
                className={`h-3 w-3 text-black  dark:text-white shrink-0 ml-2 transition-transform duration-200 ${
                  open ? 'rotate-90' : ''
                }`}
              />
            </div>
          </div>

          <div
            className={`mb-3 ml-[7.5px] pl-4 z-50 border-l sans-serif font-normal border-slate-200 dark:border-slate-800 ${
              !open && 'hidden'
            }`}
          >
            {children}
          </div>
        </>
      )}
    </SidebarLinkGroup>
  );
};
//DATA OBJECT
export const sidebarData = [
  {
    name: 'Community',
    href: '/community',
    icon: 'GlobeAltIcon'
  },
  {
    name: 'About',
    icon: 'AcademicCapIcon',
    children: [
      { name: 'Overview', href: '/about/overview' },
      { name: 'Team', href: '/about/team' },
      { name: 'Jameel family', href: '/about/family' },
      { name: 'Family album', href: '/about/family-album' },
      { name: 'Brand', href: '/about/brand' }
    ]
  },
  {
    name: 'Programmes',
    icon: 'CpuChipIcon',
    children: [
      {
        name: 'J-PAL',
        children: [
          { name: 'J-PAL Global', href: '/programmes/j-pal' },
          {
            name: 'J-PAL MENA',
            href: 'https://www.povertyactionlab.org/middle-east-and-north-africa',
            targetBlank: true
          },
          {
            name: 'ESII',
            href: 'https://www.povertyactionlab.org/initiative/european-social-inclusion-initiative',
            targetBlank: true
          },
          {
            name: 'HAPIE',
            href: 'https://www.povertyactionlab.org/page/hub-advanced-policy-innovation-environment-hapie',
            targetBlank: true
          },
          {
            name: 'J-PAL Air and Water Labs',
            href: 'https://www.povertyactionlab.org/page/air-and-water-labs',
            targetBlank: true
          },
          {
            name: 'Gender norms in India',
            href: '/programmes/j-pal/reshaping-gender-norms-in-india'
          }
        ]
      },
      {
        name: 'MIT J-WAFS',
        children: [
          { name: 'Overview', href: '/programmes/j-wafs' },
          {
            name: 'FACT Alliance',
            href: 'https://jwafs.mit.edu/alliance',
            targetBlank: true
          },
          {
            name: 'Jameel Index',
            href: 'https://jameelindex.mit.edu',
            targetBlank: true
          }
        ]
      },
      { name: 'MIT J-WEL', href: '/programmes/j-wel' },
      { name: 'MIT Jameel Clinic', href: '/programmes/jameel-clinic' },
      {
        name: 'Jameel Institute',
        children: [
          {
            name: 'Overview',
            href: '/programmes/jameel-institute'
          },
          {
            name: 'Jameel Institute Kenneth C. Griffin Intitiative',
            href: '/programmes/jameel-institute/kenneth-c-griffin-initiative-for-economics-of-pandemic-preparedness'
          }
        ]
      }
      // continue mapping similar blocks...
    ]
  },
  {
    name: 'Discover',
    icon: 'BeakerIcon',
    children: [
      { name: 'News', href: '/news' },
      { name: 'Media', href: '/media' },
      { name: 'Events', href: '/events' },
      { name: 'Studios', href: '/studios' },
      { name: 'Newsletter', href: '/newsletter' },
      { name: '2024 in review', href: '/reports/a-look-back-at-2024' },
      {
        name: 'Stories',
        children: [
          { name: 'A Cairo Cornerstone', href: '/stories/a-cairo-cornerstone' },
          { name: 'GCC Heat Tracker', href: '/stories/gcc-heat-tracker' },
          { name: 'Harvesting Hope', href: '/stories/harvesting-hope' },
          {
            name: 'KSA Healthcare Timeiline',
            href: '/stories/ksa-healthcare-timeline'
          }
        ]
      }
    ]
  }
];
const renderNavItem = (item: NavItem, level = 0) => {
  if (item.children) {
    const Wrapper =
      level === 0 ? NavGroup : level === 1 ? NavSubGroup : NavSubSubGroup;
    return (
      <Wrapper
        key={item.name}
        title={item.name}
        icon={item.icon && <DynamicIcon name={item.icon} />}
      >
        {item.children.map((child) => renderNavItem(child, level + 1))}
      </Wrapper>
    );
  } else {
    return (
      <div key={item.name}>
        <SidebarLink href={item.href!} targetBlank={item.targetBlank}>
          {item.name}
        </SidebarLink>
      </div>
    );
  }
};

export default function TestOnlySidebar() {
  const [mounted, setMounted] = useState(false);
  const sidebar = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [divSizes, setDivSizes] = useState<{
    sidebar: number;
    content: number;
  }>({
    sidebar: 0,
    content: 0
  });

  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return (
    <div
      ref={sidebarRef}
      className=" overflow-y-auto side-scroll-bar  lg:max-h-screen "
    >
      {/* Backdrop This is for Mobile */}
      <Transition show={sidebarOpen}>
        <div
          aria-hidden="true"
          className="md:hidden fixed sm:static inset-0 z-0 bg-opacity-20 transition-opacity"
        />
      </Transition>

      {/* Sidebar here you can change the side bar width etc */}
      <div ref={sidebar} className="">
        <Transition
          show={sidebarOpen}
          unmount={false}
          as="aside"
          id="sidebar"
          className="left-0 fixed lg:static top-[64px] dropdown-item lg:top-0 lg:bottom-0  pb-40  w-full pt-6 bg-white lg:w-[233px] h-screen overflow-y-auto md:h-full   lg:shrink-0 z-50 lg:overflow-x-hidden   lg:!opacity-100 lg:!block  dark:bg-slate-900"
          enter="transition ease-out duration-200 transform"
          enterFrom="opacity-0 -translate-x-full"
          enterTo="opacity-100 translate-x-0"
          leave="transition ease-out duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="w-full sm:w-[200px] px-4 sm:px-6 md:pl-2 md:pr-8 ">
            <div className="relative z-30">
              <nav className="sm:block w-full text-sm">
                {' '}
                {/* This is navigational Link consider it as a link  you can find this on component on top of the file */}
                <div className="group">
                  <NavLink
                    href="/community"
                    icon={
                      <GlobeAltIcon className="h-4 w-4 text-gray-500 dark:text-gray-500 group-hover:text-customBlue dark:hover:text-customBlue" />
                    }
                  >
                    Community
                  </NavLink>
                </div>
                {/* this is a component that is for the dropdown only and has a logo you can find this component on top */}
                <div className="group">
                  <NavGroup
                    title="About"
                    icon={
                      <AcademicCapIcon className="h-4 w-4 text-gray-500 dark:text-gray-500 group-hover:text-customBlue dark:hover:text-customBlue" />
                    }
                  >
                    <div className="mt-">
                      {[
                        { name: 'Overview', href: '/about/overview' },
                        { name: 'Team', href: '/about/team' },
                        { name: 'Jameel family', href: '/about/family' },
                        { name: 'Family album', href: '/about/family-album' },
                        { name: 'Brand', href: '/about/brand' }
                      ].map((item, index) => (
                        <div className="mt-">
                          <SidebarLink href={item.href}>
                            {item.name}
                          </SidebarLink>
                        </div>
                      ))}
                    </div>
                  </NavGroup>
                </div>
                <div className="group">
                  <NavGroup
                    title="Programmes"
                    icon={
                      <CpuChipIcon className="h-4 w-4 text-gray-500  dark:text-gray-500 group-hover:text-customBlue dark:hover:text-customBlue" />
                    }
                  >
                    <NavSubGroup title={'J-PAL'}>
                      {[
                        {
                          name: 'J-PAL Global',
                          href: '/programmes/j-pal',
                          current: false
                        },
                        {
                          name: 'J-PAL MENA',
                          href: 'https://www.povertyactionlab.org/middle-east-and-north-africa',
                          current: false,
                          targetBlank: true
                        },
                        {
                          name: 'ESII',
                          href: 'https://www.povertyactionlab.org/initiative/european-social-inclusion-initiative',
                          current: false,
                          targetBlank: true
                        },
                        {
                          name: 'HAPIE',
                          href: 'https://www.povertyactionlab.org/page/hub-advanced-policy-innovation-environment-hapie',
                          current: false,
                          targetBlank: true
                        },
                        {
                          name: 'J-PAL Air and Water Labs',
                          href: 'https://www.povertyactionlab.org/page/air-and-water-labs',
                          current: false,
                          targetBlank: true
                        },
                        {
                          name: 'Gender norms in India',
                          href: '/programmes/j-pal/reshaping-gender-norms-in-india',
                          current: false
                        }
                      ].map((item, index) => (
                        <div className="mt-">
                          <SidebarLink
                            href={item.href}
                            key={index + Math.random()}
                            targetBlank={item.targetBlank}
                          >
                            {item.name}
                          </SidebarLink>
                        </div>
                      ))}
                    </NavSubGroup>
                    <NavSubGroup title={'MIT J-WAFS'}>
                      {[
                        {
                          name: 'Overview',
                          href: '/programmes/j-wafs',
                          current: false
                        },
                        {
                          name: 'FACT Alliance',
                          href: 'https://jwafs.mit.edu/alliance',
                          current: false,
                          targetBlank: true
                        },
                        {
                          name: 'Jameel Index',
                          href: 'https://jameelindex.mit.edu',
                          current: false,
                          targetBlank: true
                        }
                      ].map((item, index) => (
                        <div className="mt-">
                          <SidebarLink
                            href={item.href}
                            key={index + Math.random()}
                            targetBlank={item.targetBlank}
                          >
                            {item.name}
                          </SidebarLink>
                        </div>
                      ))}
                    </NavSubGroup>
                    <div className="mt-">
                      <SidebarLink href="/programmes/j-wel">
                        MIT J-WEL
                      </SidebarLink>
                    </div>
                    <div className="mt-">
                      <SidebarLink href="/programmes/jameel-clinic">
                        MIT Jameel Clinic
                      </SidebarLink>
                    </div>
                    <NavSubGroup title={'Jameel Institute'}>
                      {[
                        {
                          name: 'Overview',
                          href: '/programmes/jameel-institute',
                          current: false
                        },
                        {
                          name: 'Jameel Institute Kenneth C. Griffin Intitiative',
                          href: '/programmes/jameel-institute/kenneth-c-griffin-initiative-for-economics-of-pandemic-preparedness',
                          current: false
                        }
                      ].map((item, index) => (
                        <div className="mt-">
                          <SidebarLink href={item.href}>
                            {item.name}
                          </SidebarLink>
                        </div>
                      ))}
                    </NavSubGroup>
                    <NavSubGroup title={'Jameel Observatory'}>
                      {[
                        {
                          name: 'Overview',
                          href: '/programmes/jameel-observatory',
                          current: false
                        },
                        {
                          name: 'Food Security Early Action',
                          href: '/programmes/jameel-observatory/for-food-security-early-action',
                          current: false
                        },
                        {
                          name: 'CREWSnet',
                          href: '/programmes/jameel-observatory/crewsnet',
                          current: false
                        }
                      ].map((item, index) => (
                        <div className="">
                          <SidebarLink
                            href={item.href}
                            key={index + Math.random()}
                          >
                            {item.name}
                          </SidebarLink>
                        </div>
                      ))}
                    </NavSubGroup>
                    <NavSubGroup title={'Jameel Arts & Health Lab'}>
                      {[
                        {
                          name: 'Overview',
                          href: '/programmes/jameel-arts-and-health-lab',
                          current: false
                        },
                        {
                          name: 'Healing Arts Scotland',
                          href: '/programmes/jameel-arts-and-health-lab/healing-arts/scotland',
                          current: false
                        }
                      ].map((item, index) => (
                        <div className="">
                          <SidebarLink
                            href={item.href}
                            key={index + Math.random()}
                          >
                            {item.name}
                          </SidebarLink>
                        </div>
                      ))}
                    </NavSubGroup>
                    <div className="">
                      <SidebarLink href="/programmes/climavore-x-jameel-at-rca">
                        CLIMAVORE x Jameel at RCA
                      </SidebarLink>
                    </div>
                    <NavSubGroup title={'Bocelli-Jameel Scholarship'}>
                      {[
                        {
                          name: 'Overview',
                          href: '/programmes/bocelli-jameel-scholarship',
                          current: false
                        }
                      ].map((item, index) => (
                        <div className="">
                          <SidebarLink
                            href={item.href}
                            key={index + Math.random()}
                          >
                            {item.name}
                          </SidebarLink>
                        </div>
                      ))}

                      <NavSubSubGroup title={'Scholars'}>
                        {[
                          {
                            name: 'Clara Barbier Serrano (2020)',
                            href: '/people/clara-barbier-serrano'
                          },
                          {
                            name: 'Laura Mekhail (2021)',
                            href: '/people/laura-mekhail'
                          },
                          {
                            name: 'Seonwoo Lee (2022)',
                            href: '/people/seonwoo-lee'
                          },
                          {
                            name: 'Anastasia Koorn (2023)',
                            href: '/people/anastasia-koorn'
                          },
                          {
                            name: 'Henna Mun (2023)',
                            href: '/people/henna-mun'
                          }
                        ].map((item, index) => (
                          <div className="">
                            <SidebarLink
                              href={item.href}
                              key={index + Math.random()}
                            >
                              {item.name}
                            </SidebarLink>
                          </div>
                        ))}
                      </NavSubSubGroup>
                      <div className="mt-">
                        <SidebarLink href="/programmes/bocelli-jameel-scholarship/media">
                          Media
                        </SidebarLink>
                      </div>
                    </NavSubGroup>
                    <NavSubGroup
                      title={'Jameel House of Traditional Arts in Cairo'}
                    >
                      {[
                        {
                          name: 'Overview',
                          href: '/programmes/jameel-house-of-traditional-arts-in-cairo'
                        }
                      ].map((item, index) => (
                        <div className="mt-">
                          <SidebarLink
                            href={item.href}
                            key={index + Math.random()}
                          >
                            {item.name}
                          </SidebarLink>
                        </div>
                      ))}
                      <NavSubSubGroup title={'Graduation collections'}>
                        {[
                          {
                            name: '2023',
                            href: '/programmes/jameel-house-of-traditional-arts-in-cairo/2023-graduation-collection'
                          },
                          {
                            name: '2024',
                            href: '/programmes/jameel-house-of-traditional-arts-in-cairo/2024-graduation-collection'
                          }
                        ].map((item, index) => (
                          <div className="">
                            <SidebarLink
                              href={item.href}
                              key={index + Math.random()}
                            >
                              {item.name}
                            </SidebarLink>
                          </div>
                        ))}
                      </NavSubSubGroup>
                    </NavSubGroup>
                    <div className="">
                      <SidebarLink href="/programmes/pratham-jameel-second-chance">
                        Pratham Jameel Second Chance Programme
                      </SidebarLink>
                    </div>
                    <div className="">
                      <SidebarLink href="/programmes/jameel-c40-urban-planning-climate-labs">
                        Jameel C40 Urban Planning Climate Labs
                      </SidebarLink>
                    </div>
                    <div className="">
                      <SidebarLink href="/programmes/ejada">Ejada</SidebarLink>
                    </div>
                    <div className="">
                      <SidebarLink href="/programmes/jameel-toyota-scholarship">
                        MIT Jameel Toyota Scholarship
                      </SidebarLink>
                    </div>

                    <NavSubGroup title={'Ankur'}>
                      {[
                        {
                          name: 'Overview',
                          href: '/programmes/ankur',
                          current: false
                        },
                        {
                          name: 'Sundarbans folkindica biodiversity map',
                          href: '/programmes/ankur/sundarbans-biodiversity-map',
                          current: false
                        }
                      ].map((item, index) => (
                        <div className="mt-">
                          <SidebarLink
                            href={item.href}
                            key={index + Math.random()}
                          >
                            {item.name}
                          </SidebarLink>
                        </div>
                      ))}
                    </NavSubGroup>

                    <div className="">
                      <SidebarLink href="/programmes/bruvs-monaco">
                        BRUVS Monaco
                      </SidebarLink>
                    </div>
                    <NavSubGroup title={'Funds'}>
                      {[
                        {
                          name: 'Jameel Fund',
                          href: '/programmes/funds/jameel-fund',
                          current: false
                        },
                        {
                          name: 'Iraq Cultural Health Fund',
                          href: '/programmes/funds/iraq-cultural-health-fund',
                          current: false
                        },
                        {
                          name: 'Covid-19-Excellence Fund',
                          href: '/programmes/funds/covid-19-excellence-fund',
                          current: false
                        }
                      ].map((item, index) => (
                        <div className="mt-">
                          <SidebarLink
                            href={item.href}
                            key={index + Math.random()}
                          >
                            {item.name}
                          </SidebarLink>
                        </div>
                      ))}
                    </NavSubGroup>
                  </NavGroup>
                </div>
                <div className="group">
                  <NavGroup
                    title="Discover"
                    icon={
                      <BeakerIcon className="h-4 w-4 text-gray-500 dark:text-gray-500  t group-hover:text-customBlue dark:hover:text-customBlue" />
                    }
                  >
                    {[
                      { name: 'News', href: '/news' },
                      { name: 'Media', href: '/media' },
                      { name: 'Events', href: '/events' },
                      { name: 'Studios', href: '/studios' },
                      { name: 'Newsletter', href: '/newsletter' },
                      {
                        name: '2024 in review',
                        href: '/reports/a-look-back-at-2024'
                      }
                    ].map((item, index) => (
                      <div className="mt-">
                        <SidebarLink
                          href={item.href}
                          key={index + Math.random()}
                        >
                          {item.name}
                        </SidebarLink>
                      </div>
                    ))}
                    <NavSubGroup title={'Stories'}>
                      {[
                        {
                          name: 'A Cairo Cornerstone',
                          href: '/stories/a-cairo-cornerstone'
                        },
                        {
                          name: 'GCC Heat Tracker',
                          href: '/stories/gcc-heat-tracker'
                        },
                        {
                          name: 'Harvesting Hope',
                          href: '/stories/harvesting-hope'
                        },
                        {
                          name: 'KSA Healthcare Timeiline',
                          href: '/stories/ksa-healthcare-timeline'
                        }
                      ].map((item, index) => (
                        <SidebarLink
                          href={item.href}
                          key={index + Math.random()}
                        >
                          {item.name}
                        </SidebarLink>
                      ))}
                    </NavSubGroup>
                  </NavGroup>
                </div>
              </nav>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  );
}
