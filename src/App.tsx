import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'

import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'

import Index from './pages/Index'
import Cursos from './pages/Cursos'
import CourseDetails from './pages/CourseDetails'
import Mentorias from './pages/Mentorias'
import Revistas from './pages/Revistas'
import Noticias from './pages/Noticias'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

import StudentDashboard from './pages/student/Dashboard'
import CourseLesson from './pages/student/Lesson'

import AdminDashboard from './pages/admin/Dashboard'
import AdminCourses from './pages/admin/Courses'
import AdminCourseBuilder from './pages/admin/CourseBuilder'
import AdminMagazines from './pages/admin/Magazines'
import AdminNews from './pages/admin/News'
import AdminLeads from './pages/admin/Leads'

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
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/aluno" element={<StudentDashboard />} />
            <Route path="/aluno/curso/:id/aula" element={<CourseLesson />} />
          </Route>

          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/cursos" element={<AdminCourses />} />
            <Route path="/admin/cursos/:id" element={<AdminCourseBuilder />} />
            <Route path="/admin/revistas" element={<AdminMagazines />} />
            <Route path="/admin/noticias" element={<AdminNews />} />
            <Route path="/admin/leads" element={<AdminLeads />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
