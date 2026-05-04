import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { getMagazineLandingPage, updateMagazineLandingPage } from '@/services/magazine_management'
import type { MagazineLandingPage, MagazineLandingPlan } from '@/types'
import { Loader2, Plus, Trash2, Save } from 'lucide-react'

export default function AdminMagazineLandingConfig() {
  const [data, setData] = useState<MagazineLandingPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const result = await getMagazineLandingPage()
      if (result) {
        setData(result as unknown as MagazineLandingPage)
      }
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof MagazineLandingPage, value: any) => {
    if (!data) return
    setData({ ...data, [field]: value })
  }

  const handlePlanChange = (index: number, field: keyof MagazineLandingPlan, value: any) => {
    if (!data) return
    const newPlans = [...data.plans]
    newPlans[index] = { ...newPlans[index], [field]: value }
    setData({ ...data, plans: newPlans })
  }

  const addPlan = () => {
    if (!data) return
    const newPlan: MagazineLandingPlan = {
      title: 'Novo Plano',
      insertions: '0 Inserções',
      price: 0,
      pricePerInsertion: 0,
      features: ['Nova Funcionalidade'],
      bestValue: false,
    }
    setData({ ...data, plans: [...data.plans, newPlan] })
  }

  const removePlan = (index: number) => {
    if (!data) return
    const newPlans = data.plans.filter((_, i) => i !== index)
    setData({ ...data, plans: newPlans })
  }

  const handleFeatureChange = (planIndex: number, featureIndex: number, value: string) => {
    if (!data) return
    const newPlans = [...data.plans]
    newPlans[planIndex].features[featureIndex] = value
    setData({ ...data, plans: newPlans })
  }

  const addFeature = (planIndex: number) => {
    if (!data) return
    const newPlans = [...data.plans]
    newPlans[planIndex].features.push('Nova funcionalidade')
    setData({ ...data, plans: newPlans })
  }

  const removeFeature = (planIndex: number, featureIndex: number) => {
    if (!data) return
    const newPlans = [...data.plans]
    newPlans[planIndex].features.splice(featureIndex, 1)
    setData({ ...data, plans: newPlans })
  }

  const onSave = async () => {
    if (!data || !data.id) return
    setSaving(true)
    try {
      await updateMagazineLandingPage(data.id, data)
      toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso!' })
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar as configurações.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  if (!data) {
    return <div className="p-8 text-center text-slate-500">Nenhuma configuração encontrada.</div>
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">
            Página "Anuncie na Revista"
          </h2>
          <p className="text-slate-500">
            Configure os textos e planos exibidos na página pública de anúncios.
          </p>
        </div>
        <Button onClick={onSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Alterações
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conteúdo Principal (Hero)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título Principal</Label>
            <Input
              value={data.hero_title}
              onChange={(e) => handleChange('hero_title', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={data.hero_description}
              onChange={(e) => handleChange('hero_description', e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Contador de Leitores</Label>
              <Input
                value={data.readers_count}
                onChange={(e) => handleChange('readers_count', e.target.value)}
                placeholder="+2.000"
              />
            </div>
            <div className="space-y-2">
              <Label>Número do WhatsApp</Label>
              <Input
                value={data.whatsapp_number}
                onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                placeholder="5511999999999"
              />
            </div>
            <div className="space-y-2">
              <Label>Texto do Botão CTA</Label>
              <Input
                value={data.cta_text}
                onChange={(e) => handleChange('cta_text', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
          <CardTitle>Planos de Investimento</CardTitle>
          <Button onClick={addPlan} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Adicionar Plano
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
          {data.plans.map((plan, pIdx) => (
            <div key={pIdx} className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-100"
                onClick={() => removePlan(pIdx)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Nome do Plano</Label>
                  <Input
                    value={plan.title}
                    onChange={(e) => handlePlanChange(pIdx, 'title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Texto de Inserções</Label>
                  <Input
                    value={plan.insertions}
                    onChange={(e) => handlePlanChange(pIdx, 'insertions', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id={`best-value-${pIdx}`}
                  checked={plan.bestValue}
                  onCheckedChange={(c) => handlePlanChange(pIdx, 'bestValue', c)}
                />
                <Label htmlFor={`best-value-${pIdx}`}>Destacar como "Melhor Custo-Benefício"</Label>
              </div>

              <div className="space-y-2">
                <Label>Funcionalidades (Features)</Label>
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => handleFeatureChange(pIdx, fIdx, e.target.value)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeFeature(pIdx, fIdx)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                ))}
                <Button variant="link" size="sm" onClick={() => addFeature(pIdx)} className="px-0">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Funcionalidade
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
