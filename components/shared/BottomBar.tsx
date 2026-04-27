'use client'
import { sidebarLinks } from '@/constants'
import { usePathname } from 'next/navigation'
import Link from 'next/link';
import Image from 'next/image';

const BottomBar = ({ currentUserId }: { currentUserId: string }) => {
  const pathname = usePathname();

  return (
    <>
      <section className="bottombar">
        <div className="bottombar_container">
          {sidebarLinks.map(( link ) => {
            const route = link.route === '/profile'
              ? `${link.route}/${currentUserId}`
              : link.route;
            const isActive = (
              pathname.includes(link.route) && pathname === link.route
            );

            return (
              <Link className={`bottombar_link ${isActive && 'bg-primary-500'}`}
                href={route}
                key={link.label}
              >
                <Image src={link.imgURL} alt={link.label} 
                  width={24} height={24}
                />
              </Link>
            );
          })}
        </div>
      </section>
    </>
  )
}

export default BottomBar;
