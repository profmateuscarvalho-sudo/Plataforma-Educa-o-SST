import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'

import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import StudentLayout from './components/StudentLayout'
import StudentProfile from './pages/student/Profile'

import Index from './pages/Index'
import Cursos from './pages/Cursos'
import CourseDetails from './pages/CourseDetails'
import Mentorias from './pages/Mentorias'
import Revistas from './pages/Revistas'
import Noticias from './pages/Noticias'
import Login from './pages/Login'
import Register from './pages/Register'
import Ativar from './pages/Ativar'
import NotFound from './pages/NotFound'

import ArticleSubmission from './pages/public/ArticleSubmission'
import SubmitArticleInfo from './pages/public/SubmitArticleInfo'
import ProfessionalConnection from './pages/public/ProfessionalConnection'
import WorkplaceSubmission from './pages/public/WorkplaceSubmission'
import PublicSimulados from './pages/public/Simulados'
import SimuladoSession from './pages/public/SimuladoSession'
import Anuncie from './pages/public/Anuncie'
import Planos from './pages/Planos'

import StudentDashboard from './pages/student/Dashboard'
import CourseLesson from './pages/student/Lesson'
import StudentDocumentaries from './pages/student/Documentaries'
import DocumentaryViewer from './pages/student/DocumentaryViewer'
import StudentNotebook from './pages/student/Notebook'
import StudentCaseFeed from './pages/student/CaseFeed'

import AdminDashboard from './pages/admin/Dashboard'
import AdminCourses from './pages/admin/Courses'
import AdminCourseBuilder from './pages/admin/CourseBuilder'
import AdminMagazines from './pages/admin/Magazines'
import AdminPayments from './pages/admin/Payments'
import AdminLives from './pages/admin/Lives'
import StudentLive from './pages/student/Live'
import StudentLiveSessions from './pages/student/LiveSessions'
import NewsDetails from './pages/NewsDetails'
import AdminMagazineArticles from './pages/admin/MagazineArticles'
import AdminMagazineConnections from './pages/admin/MagazineConnections'
import AdminMagazineWorkplaces from './pages/admin/MagazineWorkplaces'
import AdminNews from './pages/admin/News'
import AdminLeads from './pages/admin/Leads'
import AdminLeadImport from './pages/admin/LeadImport'
import AdminMentorships from './pages/admin/Mentorships'
import AdminMentors from './pages/admin/Mentors'
import AdminStudents from './pages/admin/Students'
import AdminDocumentaries from './pages/admin/Documentaries/List'
import AdminDocumentaryWizard from './pages/admin/Documentaries/Wizard'
import AdminSimulados from './pages/admin/Simulados/List'
import AdminSimuladoWizard from './pages/admin/Simulados/Wizard'
import AdminMagazineLanding from './pages/admin/MagazineLandingConfig'
import DocumentaryPitch from './pages/public/DocumentaryPitch'
import AdminSubscriptionPlans from './pages/admin/SubscriptionPlans'
import AdminAnnouncements from './pages/admin/Announcements'
import AdminCases from './pages/admin/Cases'
import AdminTestes from './pages/admin/Testes'
import AdminEmailLog from './pages/admin/EmailLog'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/cursos" element={<Cursos />} />
            <Route path="/cursos/:id" element={<CourseDetails />} />
            <Route path="/mentorias" element={<Mentorias />} />
            <Route path="/revistas" element={<Revistas />} />
            <Route path="/noticias" element={<Noticias />} />
            <Route path="/noticias/:id" element={<NewsDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/ativar" element={<Ativar />} />

            <Route path="/submeter-artigo" element={<ArticleSubmission />} />
            <Route path="/conexao-profissional/:token" element={<ProfessionalConnection />} />
            <Route path="/meu-local-trabalho" element={<WorkplaceSubmission />} />

            <Route path="/simulados" element={<PublicSimulados />} />
            <Route path="/simulados/:id" element={<SimuladoSession />} />
            <Route path="/anuncie-na-revista" element={<Anuncie />} />
            <Route path="/planos" element={<Planos />} />
            <Route path="/documentarios/:id" element={<DocumentaryPitch />} />
          </Route>

          <Route path="/plataforma/documentarios/:id" element={<DocumentaryViewer />} />

          <Route element={<StudentLayout />}>
            <Route path="/plataforma" element={<StudentDashboard />} />
            <Route path="/plataforma/curso/:id/aula" element={<CourseLesson />} />
            <Route path="/plataforma/documentarios" element={<StudentDocumentaries />} />
            <Route path="/plataforma/caderno" element={<StudentNotebook />} />
            <Route path="/plataforma/cases" element={<StudentCaseFeed />} />
            <Route path="/plataforma/live/:id" element={<StudentLive />} />
            <Route path="/plataforma/live-sessions" element={<StudentLiveSessions />} />
            <Route path="/plataforma/perfil" element={<StudentProfile />} />
          </Route>

          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/cursos" element={<AdminCourses />} />
            <Route path="/admin/cursos/:id" element={<AdminCourseBuilder />} />
            <Route path="/admin/alunos" element={<AdminStudents />} />
            <Route path="/admin/mentorias" element={<AdminMentorships />} />
            <Route path="/admin/mentores" element={<AdminMentors />} />
            <Route path="/admin/documentarios" element={<AdminDocumentaries />} />
            <Route path="/admin/documentarios/novo" element={<AdminDocumentaryWizard />} />
            <Route path="/admin/documentarios/:id/editar" element={<AdminDocumentaryWizard />} />
            <Route path="/admin/simulados" element={<AdminSimulados />} />
            <Route path="/admin/simulados/novo" element={<AdminSimuladoWizard />} />
            <Route path="/admin/simulados/:id/editar" element={<AdminSimuladoWizard />} />
            <Route path="/admin/revistas" element={<AdminMagazines />} />
            <Route path="/admin/revistas/artigos" element={<AdminMagazineArticles />} />
            <Route path="/admin/revistas/conexoes" element={<AdminMagazineConnections />} />
            <Route path="/admin/revistas/locais" element={<AdminMagazineWorkplaces />} />
            <Route path="/admin/configuracoes/anuncio-revista" element={<AdminMagazineLanding />} />
            <Route path="/admin/noticias" element={<AdminNews />} />
            <Route path="/admin/leads" element={<AdminLeads />} />
            <Route path="/admin/leads/import" element={<AdminLeadImport />} />
            <Route path="/admin/pagamentos" element={<AdminPayments />} />
            <Route path="/admin/lives" element={<AdminLives />} />
            <Route path="/admin/planos" element={<AdminSubscriptionPlans />} />
            <Route path="/admin/avisos" element={<AdminAnnouncements />} />
            <Route path="/admin/casos" element={<AdminCases />} />
            <Route path="/admin/testes" element={<AdminTestes />} />
            <Route path="/admin/email-log" element={<AdminEmailLog />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>{' '}
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
