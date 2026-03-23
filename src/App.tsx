import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from './contexts/AuthContext'

import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'

import Index from './pages/Index'
import Cursos from './pages/Cursos'
import CourseDetails from './pages/CourseDetails'
import Mentorias from './pages/Mentorias'
import Revistas from './pages/Revistas'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

import StudentDashboard from './pages/student/Dashboard'
import CourseLesson from './pages/student/Lesson'

import AdminDashboard from './pages/admin/Dashboard'
import AdminCourses from './pages/admin/Courses'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Public Routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/cursos" element={<Cursos />} />
            <Route path="/cursos/:id" element={<CourseDetails />} />
            <Route path="/mentorias" element={<Mentorias />} />
            <Route path="/revistas" element={<Revistas />} />
            <Route path="/login" element={<Login />} />

            {/* Student Routes */}
            <Route path="/aluno" element={<StudentDashboard />} />
            <Route path="/aluno/curso/:id/aula/:lessonId" element={<CourseLesson />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/cursos" element={<AdminCourses />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
