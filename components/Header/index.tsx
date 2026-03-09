'use client';

import LanguageSelector from '@/components/Header/LanguageSelector';
import NotificationStrip from '@/components/Header/NotificationStrip';
import type { CommonLayoutQuery } from '@/graphql/types/graphql';
import type { ResolvedGlobalPageProps } from '@/utils/globalPageProps';
import { buildUrl } from '@/utils/globalPageProps';
import { isEmptyDocument } from 'datocms-structured-text-utils';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Menu = {
  id: string;
  title: string;
  path?: string;
  newTab: boolean;
  submenu?: Menu[];
};

type Props = {
  globalPageProps: ResolvedGlobalPageProps;
  data: CommonLayoutQuery;
};

const Header = ({ globalPageProps, data }: Props) => {
  const menuData: Menu[] = [];

  data.layout?.menu.map((item) => {
    if (item.__typename === 'MenuDropdownRecord') {
      const dropdownItem = item;
      menuData.push({
        id: '1',
        title: dropdownItem.title || 'Other Items',
        newTab: false,
        submenu: dropdownItem.items.map((item) => {
          return {
            id: item.id,
            title: item.title,
            path: `/${item.page.slug}`,
            newTab: true,
          };
        }),
      });
    } else {
      const menuItem = item;
      menuData.push({
        id: menuItem.id,
        title: menuItem.title,
        path: `/${menuItem.page.slug}`,
        newTab: false,
      });
    }
  });

  const [navbarOpen, setNavbarOpen] = useState(false);
  const [notificationStrip, setNotificationStrip] = useState(
    !isEmptyDocument(data.layout?.notification),
  );
  const [sticky, setSticky] = useState(false);
  const [openIndex, setOpenIndex] = useState(-1);

  const navbarToggleHandler = () => setNavbarOpen(!navbarOpen);

  const handleStickyNavbar = () => {
    setSticky(window.scrollY >= 60);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleStickyNavbar);
    return () => window.removeEventListener('scroll', handleStickyNavbar);
  }, []);

  const handleSubmenu = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <>
      {notificationStrip && (
        <NotificationStrip
          notification={data.layout?.notification}
          globalPageProps={globalPageProps}
          setNotificationStrip={setNotificationStrip}
        />
      )}
      <header
        className={`left-0 z-50 w-full bg-white transition-all duration-300 ${
          sticky
            ? 'fixed top-0 shadow-sm'
            : `absolute ${notificationStrip ? 'top-10' : 'top-0'}`
        } border-b border-[#EAEAEA]`}
      >
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href={buildUrl(globalPageProps)} className="flex-shrink-0">
              {data.layout?.logo.url && (
                <Image
                  src={data.layout.logo.url}
                  alt="logo"
                  width={140}
                  height={32}
                  className="h-8 w-auto"
                  priority
                />
              )}
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-8 lg:flex">
              {menuData.map((menuItem, index) => (
                <div key={menuItem.id} className="relative group">
                  {menuItem.path ? (
                    <Link
                      href={buildUrl(globalPageProps, menuItem.path)}
                      className="text-sm font-medium text-[#111111] transition-colors hover:text-[#0A2540]"
                    >
                      {menuItem.title}
                    </Link>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSubmenu(index)}
                        className="flex items-center gap-1 text-sm font-medium text-[#111111] transition-colors hover:text-[#0A2540]"
                      >
                        {menuItem.title}
                        <svg width="12" height="12" viewBox="0 0 15 14" className="mt-0.5">
                          <path d="M7.81602 9.97495C7.68477 9.97495 7.57539 9.9312 7.46602 9.8437L2.43477 4.89995C2.23789 4.70308 2.23789 4.39683 2.43477 4.19995C2.63164 4.00308 2.93789 4.00308 3.13477 4.19995L7.81602 8.77183L12.4973 4.1562C12.6941 3.95933 13.0004 3.95933 13.1973 4.1562C13.3941 4.35308 13.3941 4.65933 13.1973 4.8562L8.16601 9.79995C8.05664 9.90933 7.94727 9.97495 7.81602 9.97495Z" fill="currentColor" />
                        </svg>
                      </button>
                      <div
                        className={`absolute left-0 top-full z-10 mt-1 w-48 rounded border border-[#EAEAEA] bg-white shadow-md transition-all ${
                          openIndex === index ? 'block' : 'hidden'
                        } lg:hidden lg:group-hover:block`}
                      >
                        {menuItem.submenu?.map((submenuItem) => (
                          <Link
                            href={buildUrl(globalPageProps, submenuItem.path)}
                            key={submenuItem.id}
                            className="block px-4 py-2.5 text-sm text-[#111111] hover:text-[#0A2540]"
                          >
                            {submenuItem.title}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <LanguageSelector
                globalPageProps={globalPageProps}
                languages={data._site.locales}
              />
              <Link
                href={buildUrl(globalPageProps, '/contact')}
                className="hidden rounded border border-[#0A2540] bg-[#0A2540] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#004280] lg:inline-block"
              >
                Get Started
              </Link>

              {/* Mobile hamburger */}
              <button
                type="button"
                onClick={navbarToggleHandler}
                className="flex flex-col gap-1.5 lg:hidden"
                aria-label="Toggle menu"
              >
                <span className={`block h-0.5 w-6 bg-[#111111] transition-all ${navbarOpen ? 'translate-y-2 rotate-45' : ''}`} />
                <span className={`block h-0.5 w-6 bg-[#111111] transition-all ${navbarOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 w-6 bg-[#111111] transition-all ${navbarOpen ? '-translate-y-2 -rotate-45' : ''}`} />
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          {navbarOpen && (
            <div className="border-t border-[#EAEAEA] py-4 lg:hidden">
              {menuData.map((menuItem, index) => (
                <div key={menuItem.id}>
                  {menuItem.path ? (
                    <Link
                      href={buildUrl(globalPageProps, menuItem.path)}
                      className="block py-2.5 text-sm font-medium text-[#111111] hover:text-[#0A2540]"
                      onClick={() => setNavbarOpen(false)}
                    >
                      {menuItem.title}
                    </Link>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSubmenu(index)}
                        className="flex w-full items-center justify-between py-2.5 text-sm font-medium text-[#111111]"
                      >
                        {menuItem.title}
                        <svg width="12" height="12" viewBox="0 0 15 14">
                          <path d="M7.81602 9.97495C7.68477 9.97495 7.57539 9.9312 7.46602 9.8437L2.43477 4.89995C2.23789 4.70308 2.23789 4.39683 2.43477 4.19995C2.63164 4.00308 2.93789 4.00308 3.13477 4.19995L7.81602 8.77183L12.4973 4.1562C12.6941 3.95933 13.0004 3.95933 13.1973 4.1562C13.3941 4.35308 13.3941 4.65933 13.1973 4.8562L8.16601 9.79995C8.05664 9.90933 7.94727 9.97495 7.81602 9.97495Z" fill="currentColor" />
                        </svg>
                      </button>
                      {openIndex === index && menuItem.submenu && (
                        <div className="pl-4">
                          {menuItem.submenu.map((submenuItem) => (
                            <Link
                              href={buildUrl(globalPageProps, submenuItem.path)}
                              key={submenuItem.id}
                              className="block py-2 text-sm text-[#555555] hover:text-[#0A2540]"
                              onClick={() => setNavbarOpen(false)}
                            >
                              {submenuItem.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              <Link
                href={buildUrl(globalPageProps, '/contact')}
                className="mt-3 block rounded border border-[#0A2540] bg-[#0A2540] px-5 py-2 text-center text-sm font-medium text-white"
                onClick={() => setNavbarOpen(false)}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
