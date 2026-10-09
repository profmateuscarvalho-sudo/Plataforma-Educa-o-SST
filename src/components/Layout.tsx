import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Menu,
  GraduationCap,
  Users,
  BookOpen,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  Instagram,
  MessageCircle,
  Linkedin,
  Smartphone,
  ChevronDown,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Logo, SquareLogo } from './ui/Logos'
import { useAuth } from '@/hooks/use-auth'
import { LanguageSwitcher } from './LanguageSwitcher'
import { InstallBanner, InstallInstructionsDialog, useInstallFlow } from './InstallBanner'
import { MagazineTopBar } from './MagazineTopBar'
import pb from '@/lib/pocketbase/client'
import { FEATURE_FLAGS } from '@/lib/constants'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { t } = useTranslation()
  const { run: runInstall } = useInstallFlow()
  const [installOpen, setInstallOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleInstall = () => runInstall(() => setInstallOpen(true))

  useEffect(() => {
    window.scrollTo(0, 0)
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Itens na mesma ordem e com as mesmas rotas de hoje, removido "Início" conforme spec
  const navigation = [
    { name: t('nav.courses'), href: '/cursos' },
    { name: t('nav.mentorships'), href: '/mentorias' },
    { name: t('nav.simulados'), href: '/simulados' },
    { name: t('nav.magazines'), href: '/revistas' },
    { name: t('nav.news'), href: '/noticias' },
    { name: t('nav.plans'), href: '/planos' },
    ...(FEATURE_FLAGS.anunciePage
      ? [{ name: t('nav.advertise'), href: '/anuncie-na-revista' }]
      : []),
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Faixa da Revista (substitui o pop-up, rola com a página) */}
      <MagazineTopBar />

      <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
          {/* Esquerda: Logo (44px) + "EDUCAÇÃO SST." */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <SquareLogo
              variant="yellow"
              className="h-11 w-11 transition-transform group-hover:scale-105"
            />
            <Logo />
          </Link>

          {/* Centro: menu desktop (>= 1150px / min-[1150px]:flex) */}
          <nav className="hidden min-[1150px]:flex items-center gap-7">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-[15px] font-medium transition-colors hover:text-foreground relative py-1 ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Direita: idioma, Área do Assinante e Assinar grátis */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden min-[1150px]:flex items-center gap-4">
              <LanguageSwitcher />

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 rounded-full p-1 hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label={t('nav.panel')}
                    >
                      {user.avatar ? (
                        <img
                          src={pb.files.getUrl(user, user.avatar)}
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover border-2 border-border"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                    <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={user.role === 'admin' ? '/admin' : '/plataforma'}>
                        <LayoutDashboard className="w-4 h-4 mr-2" /> {t('nav.panel')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleInstall}>
                      <Smartphone className="w-4 h-4 mr-2" /> {t('install.menuItem')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        signOut()
                        navigate('/')
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" /> {t('nav.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  to="/login"
                  className="editorial-link text-[15px] text-foreground font-semibold px-2 py-1"
                >
                  {t('nav.subscriberArea')}
                </Link>
              )}
            </div>

            {/* Botão primário visível sempre (desktop e mobile <1150px) */}
            <Button asChild size="default" className="shadow-none">
              <Link to="/planos">Assinar grátis</Link>
            </Button>

            {/* Abaixo de 1150px: botão hambúrguer */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="min-[1150px]:hidden">
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <Menu className="w-6 h-6 text-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[320px] bg-background border-border p-6 flex flex-col justify-between"
              >
                <div>
                  <SheetHeader className="text-left mb-6 pb-4 border-b border-border">
                    <SheetTitle>
                      <div className="flex items-center gap-2.5">
                        <SquareLogo variant="yellow" className="w-9 h-9" />
                        <Logo />
                      </div>
                    </SheetTitle>
                  </SheetHeader>

                  <nav className="flex flex-col gap-2">
                    {navigation.map((item) => {
                      const isActive = location.pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`text-base font-semibold py-2.5 px-3 rounded-lg flex items-center justify-between transition-colors ${
                            isActive
                              ? 'bg-muted text-foreground border-l-4 border-primary'
                              : 'text-foreground/80 hover:bg-muted'
                          }`}
                        >
                          <span>{item.name}</span>
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </Link>
                      )
                    })}
                  </nav>
                </div>

                <div className="flex flex-col gap-3 pt-6 border-t border-border">
                  <div className="flex items-center justify-between px-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Idioma
                    </span>
                    <LanguageSwitcher />
                  </div>

                  {user ? (
                    <>
                      <Link
                        to={user.role === 'admin' ? '/admin' : '/plataforma'}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted"
                      >
                        {user.avatar ? (
                          <img
                            src={pb.files.getUrl(user, user.avatar)}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold text-foreground truncate">{user.name}</span>
                      </Link>
                      <Button variant="outline" asChild className="w-full justify-start">
                        <Link to={user.role === 'admin' ? '/admin' : '/plataforma'}>
                          <LayoutDashboard className="mr-2 w-4 h-4" /> {t('nav.panel')}
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          signOut()
                          navigate('/')
                        }}
                      >
                        <LogOut className="mr-2 w-4 h-4" /> {t('nav.logout')}
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                        {t('nav.subscriberArea')}
                      </Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-grow min-w-0">
        <Outlet />
      </main>

      <footer className="bg-[#1C1B18] text-[#D9D4C8] py-16 border-t border-[#2b2823]">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <SquareLogo variant="yellow" />
              <Logo className="text-[#FAF8F3]" />
            </div>
            <p className="text-[#D9D4C8]/80 text-sm leading-relaxed">{t('footer.about')}</p>
            <div className="pt-2">
              <LanguageSwitcher variant="dark" />
            </div>
            <div className="flex items-center gap-4 pt-2">
              <a
                href="https://www.instagram.com/revista.educacaosst"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 p-2 rounded-full text-[#FAF8F3] hover:bg-primary hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://wa.me/5518997425195"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 p-2 rounded-full text-[#FAF8F3] hover:bg-primary hover:text-foreground transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/revista-educacao-sst"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 p-2 rounded-full text-[#FAF8F3] hover:bg-primary hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#FAF8F3] mb-6 font-sans">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-3 text-sm text-[#D9D4C8]/80">
              <li>
                <Link to="/cursos" className="hover:text-[#FAF8F3] transition-colors">
                  {t('footer.allCourses')}
                </Link>
              </li>
              <li>
                <Link to="/mentorias" className="hover:text-[#FAF8F3] transition-colors">
                  {t('footer.mentorships')}
                </Link>
              </li>
              <li>
                <Link to="/revistas" className="hover:text-[#FAF8F3] transition-colors">
                  {t('footer.digitalMagazines')}
                </Link>
              </li>
              <li>
                <Link to="/noticias" className="hover:text-[#FAF8F3] transition-colors">
                  {t('footer.sectorNews')}
                </Link>
              </li>
              {FEATURE_FLAGS.anunciePage && (
                <li>
                  <Link to="/anuncie-na-revista" className="hover:text-[#FAF8F3] transition-colors">
                    {t('footer.advertise')}
                  </Link>
                </li>
              )}
              <li>
                <Link to="/submeter-artigo" className="hover:text-[#FAF8F3] transition-colors">
                  {t('footer.submitArticle')}
                </Link>
              </li>
              <li>
                <Link
                  to="/politica-de-privacidade"
                  className="hover:text-[#FAF8F3] transition-colors"
                >
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#FAF8F3] mb-6 font-sans">
              {t('footer.contactUs')}
            </h4>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <a
                href="https://wa.me/5518997425195"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-[#D9D4C8] hover:text-[#FAF8F3] transition-colors font-medium text-sm group"
              >
                <div className="bg-primary/20 text-primary p-2 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span>(18) 99742-5195</span>
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#FAF8F3] mb-6 font-sans">
              {t('footer.areasOfPractice')}
            </h4>
            <ul className="space-y-3 text-sm text-[#D9D4C8]/80">
              <li className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />{' '}
                {t('footer.occupationalMedicine')}
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> {t('footer.occupationalSafety')}
              </li>
              <li className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> {t('footer.sstManagement')}
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
