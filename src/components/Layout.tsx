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
import { LeadForm } from './LeadForm'
import { LanguageSwitcher } from './LanguageSwitcher'
import { InstallBanner, InstallInstructionsDialog, useInstallFlow } from './InstallBanner'
import pb from '@/lib/pocketbase/client'
import { FEATURE_FLAGS } from '@/lib/constants'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { t } = useTranslation()
  const { isIOS, run: runInstall } = useInstallFlow()
  const [installOpen, setInstallOpen] = useState(false)

  const handleInstall = () => runInstall(() => setInstallOpen(true))

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const navigation = [
    { name: t('nav.home'), href: '/' },
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
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full glass-header">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <SquareLogo variant="yellow" className="group-hover:scale-105 transition-transform" />
            <Logo className="hidden lg:flex" />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.href
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-slate-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-1.5 rounded-full"
                      aria-label={t('nav.panel')}
                    >
                      {user.avatar ? (
                        <img
                          src={pb.files.getUrl(user, user.avatar)}
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover border-2 border-primary/20"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
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
                <LanguageSwitcher />
              </>
            ) : (
              <>
                <LanguageSwitcher />
                <Button variant="ghost" asChild className="font-medium text-slate-600">
                  <Link to="/login">{t('nav.subscriberArea')}</Link>
                </Button>
                <Button asChild className="font-medium shadow-sm">
                  <Link to="/planos">{t('nav.subscribe')}</Link>
                </Button>
              </>
            )}
          </div>

          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-l-0">
              <SheetHeader className="text-left mb-8">
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6">
                <nav className="flex flex-col gap-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="text-lg font-medium text-slate-700 hover:text-primary flex justify-between"
                    >
                      {item.name} <ChevronRight className="w-5 h-5 opacity-50" />
                    </Link>
                  ))}
                </nav>
                <div className="h-px bg-border my-2" />
                <div className="flex flex-col gap-3">
                  {user ? (
                    <>
                      <Link
                        to={user.role === 'admin' ? '/admin' : '/plataforma'}
                        className="flex items-center gap-3 mb-2"
                      >
                        {user.avatar ? (
                          <img
                            src={pb.files.getUrl(user, user.avatar)}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-slate-700">{user.name}</span>
                      </Link>
                      <Button className="w-full justify-start text-lg h-12" asChild>
                        <Link to={user.role === 'admin' ? '/admin' : '/plataforma'}>
                          <LayoutDashboard className="mr-2" /> {t('nav.panel')}
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-lg h-12"
                        onClick={handleInstall}
                      >
                        <Smartphone className="mr-2" /> {t('install.menuItem')}
                      </Button>
                      <div className="px-1">
                        <LanguageSwitcher />
                      </div>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-lg h-12"
                        onClick={() => {
                          signOut()
                          navigate('/')
                        }}
                      >
                        <LogOut className="mr-2" /> {t('nav.logout')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="px-1">
                        <LanguageSwitcher />
                      </div>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-lg h-12"
                        asChild
                      >
                        <Link to="/login">{t('nav.subscriberArea')}</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-secondary text-slate-200 py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <SquareLogo variant="yellow" />
              <Logo className="text-white" />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{t('footer.about')}</p>
            <div className="pt-2">
              <LanguageSwitcher variant="dark" />
            </div>
            <div className="flex items-center gap-4 pt-2">
              <a
                href="https://www.instagram.com/revista.educacaosst"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 p-2 rounded-full text-white hover:bg-primary transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://wa.me/5518997425195"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 p-2 rounded-full text-white hover:bg-green-500 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/revista-educacao-sst"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 p-2 rounded-full text-white hover:bg-blue-600 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-serif font-bold text-lg text-white mb-6">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <Link to="/cursos" className="hover:text-white transition-colors">
                  {t('footer.allCourses')}
                </Link>
              </li>
              <li>
                <Link to="/mentorias" className="hover:text-white transition-colors">
                  {t('footer.mentorships')}
                </Link>
              </li>
              <li>
                <Link to="/revistas" className="hover:text-white transition-colors">
                  {t('footer.digitalMagazines')}
                </Link>
              </li>
              <li>
                <Link to="/noticias" className="hover:text-white transition-colors">
                  {t('footer.sectorNews')}
                </Link>
              </li>
              {FEATURE_FLAGS.anunciePage && (
                <li>
                  <Link to="/anuncie-na-revista" className="hover:text-white transition-colors">
                    {t('footer.advertise')}
                  </Link>
                </li>
              )}
              <li>
                <Link to="/submeter-artigo" className="hover:text-white transition-colors">
                  {t('footer.submitArticle')}
                </Link>
              </li>
              <li>
                <Link to="/politica-de-privacidade" className="hover:text-white transition-colors">
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif font-bold text-lg text-white mb-6">
              {t('footer.contactUs')}
            </h4>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <LeadForm variant="dark" />
            </div>
          </div>
          <div>
            <h4 className="font-serif font-bold text-lg text-white mb-6">
              {t('footer.areasOfPractice')}
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-accent" /> {t('footer.occupationalMedicine')}
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" /> {t('footer.occupationalSafety')}
              </li>
              <li className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" /> {t('footer.sstManagement')}
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
