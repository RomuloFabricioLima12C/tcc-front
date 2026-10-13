import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import { MobileTabBar, MobileTitleBar, MobileTop } from './MobileChrome.jsx'

// Ao trocar de página, volta ao topo. Com #âncora no endereço (ex.: /quem-somos#redes),
// rola até a parte certa da página.
function useScrollTopOnNavigate() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    const alvo = hash && document.getElementById(decodeURIComponent(hash.slice(1)))
    if (alvo) alvo.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])
}

// Páginas do site: cabeçalho/rodapé no desktop, topo verde + barra inferior no celular.
export function SiteLayout({ children, title }) {
  useScrollTopOnNavigate()
  useEffect(() => {
    document.title = title ? `${title} · Lab Cam` : 'Lab Cam'
  }, [title])

  return (
    <div className="page">
      <div className="desktop-only">
        <Header />
      </div>
      <div className="mobile-only">
        <MobileTop />
      </div>
      <main className="page-main">{children}</main>
      <div className="desktop-only">
        <Footer />
      </div>
      <div className="mobile-only">
        <MobileTabBar />
      </div>
    </div>
  )
}

// Telas de conta (login, cadastro, perfil): no celular, topo com "voltar" e título.
export function AccountLayout({ children, title, desktopHeader = true }) {
  useScrollTopOnNavigate()
  useEffect(() => {
    document.title = `${title} · Lab Cam`
  }, [title])

  return (
    <div className="page page-account">
      {desktopHeader && (
        <div className="desktop-only">
          <Header />
        </div>
      )}
      <div className="mobile-only">
        <MobileTitleBar title={title} />
      </div>
      <main className="page-main">{children}</main>
      <div className="desktop-only">
        <Footer />
      </div>
    </div>
  )
}
