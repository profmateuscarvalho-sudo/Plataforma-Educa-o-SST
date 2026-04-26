import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNavigate, useLocation } from 'react-router-dom'

export function MagazineTabs() {
  const navigate = useNavigate()
  const location = useLocation()

  let currentTab = 'edicoes'
  if (location.pathname.includes('/artigos')) currentTab = 'artigos'
  else if (location.pathname.includes('/conexoes')) currentTab = 'conexoes'
  else if (location.pathname.includes('/locais')) currentTab = 'locais'

  return (
    <Tabs
      value={currentTab}
      onValueChange={(v) => {
        if (v === 'edicoes') navigate('/admin/revistas')
        if (v === 'artigos') navigate('/admin/revistas/artigos')
        if (v === 'conexoes') navigate('/admin/revistas/conexoes')
        if (v === 'locais') navigate('/admin/revistas/locais')
      }}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-4 max-w-2xl overflow-x-auto">
        <TabsTrigger value="edicoes">Edições</TabsTrigger>
        <TabsTrigger value="artigos">Artigos Submetidos</TabsTrigger>
        <TabsTrigger value="conexoes">Conexões Profissionais</TabsTrigger>
        <TabsTrigger value="locais">Meu Local de Trabalho</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
