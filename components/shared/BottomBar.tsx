'use client'
import { sidebarLinks } from '@/constants'
import { usePathname } from 'next/navigation'
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';

const BottomBar = () => {
  const pathname = usePathname();
  const { userId } = useAuth();

  return (
    <>
      <section className="bottombar">
        <div className="bottombar_container">
          {sidebarLinks.map(( link ) => {
            const isActive = (
              pathname.includes(link.route) && pathname === link.route 
            );

            if (link.route === '/profile') {
              link.route = `${link.route}/${userId}`
            }

            return (
              <Link className={`bottombar_link ${isActive && 'bg-primary-500'}`}
                href={link.route}
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