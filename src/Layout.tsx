import { PropsWithChildren, ReactNode, useState } from 'react'
import { Drawer, DrawerProps } from 'react-daisyui'
import { Sidebar } from './components/Sidebar'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'

type LayoutProps = {
  title: ReactNode
  drawer: Partial<DrawerProps>
}

export function Layout({ title, children, drawer }: PropsWithChildren<LayoutProps>) {
  const [sidebarVisible, setSitebarVisible] = useState(false)
  const toggleSidebarVisible = () => setSitebarVisible((current) => !current)

  return (
    <>
      <Drawer
        {...drawer}
        sideClassName="z-50"
        side={<Sidebar title={title} />}
        end={false}
        open={sidebarVisible}
        onClickOverlay={toggleSidebarVisible}
        className="min-h-screen bg-app-shell"
      >
        <Navbar title={title} toggleSidebar={toggleSidebarVisible} />
        <div className="md:container mx-auto px-4 pb-32">
          <div className="surface-card mt-4 shadow-2xl shadow-base-300/40 border border-base-200/60">
            {children}
          </div>
        </div>
        <Footer />
      </Drawer>
    </>
  )
}
