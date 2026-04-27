'use client'
import { sidebarLinks } from '@/constants'
import { usePathname } from 'next/navigation'
import Link from 'next/link';
import Image from 'next/image';

const LeftSideBar = ({ currentUserId }: { currentUserId: string }) => {
  const pathname = usePathname();

  return (
    <>
      <section className="leftsidebar custom-scrollbar">
        <div className="flex w-full flex-1 flex-col gap-6 px-6">
          {sidebarLinks.map(( link ) => {
            const route = link.route === '/profile'
              ? `${link.route}/${currentUserId}`
              : link.route;
            const isActive = (
              pathname.includes(link.route)
              && link.route.length > 1
              || pathname === link.route
            );

            return (
              <Link className={`leftsidebar_link ${isActive && 'bg-primary-500'}`}
                key={link.label}
                href={route}
              >
                <Image src={link.imgURL} alt={link.label}
                  width={24} height={24}
                />

                <p className="text-light-1">
                  {link.label}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  )
}

export default LeftSideBar;
