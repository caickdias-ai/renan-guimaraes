import { NextResponse } from 'next/server'
import { requireTrainer, generateJson, dietDraftSchema } from '@/lib/server/ai-generation'

export async function POST(request: Request) {
  try {
    const { admin, user } = await requireTrainer(request)
    const { studentId } = await request.json()
    if (typeof studentId !== 'string') return NextResponse.json({ error: 'id do aluno obrigatório' }, { status: 400 })
    const { data: client } = await admin.from('clients').select('id,full_name,goal,trainer_id').eq('id', studentId).eq('trainer_id', user.id).single()
    const { data: anamnesis } = await admin.from('anamneses').select('answers,height_cm,weight_kg').eq('client_id', studentId).single()
    if (!client || !anamnesis) return NextResponse.json({ error: 'Aluno ou anamnese não encontrados' }, { status: 404 })
    const answers = anamnesis.answers || {}
    const risks = Object.entries(answers).filter(([key, value]) => /alerg|intoler|doença|medicamento|gesta/i.test(key) && String(value).trim()).map(([key, value]) => `${key}: ${value}`)
    const disliked = Object.entries(answers).filter(([key, value]) => /não gosta|nao gosta|restri/i.test(key) && String(value).trim()).map(([key, value]) => `${key}: ${value}`)
    const draft = await generateJson(`Aluno: ${client.full_name}. Objetivo: ${client.goal || 'não informado'}. Anamnese: ${JSON.stringify(answers)}. Alergias, intolerâncias e condições: ${risks.join('; ') || 'nenhuma informada'}. Alimentos que não gosta/restrições: ${disliked.join('; ') || 'nenhum informado'}. Crie uma dieta em JSON exatamente no formato {"title":string,"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"meals":[{"name":string,"time":string,"items":[{"food":string,"quantity":string,"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number}],"substitutions":string}]}. Respeite alergias, intolerâncias e preferências; não faça diagnóstico médico.`, dietDraftSchema)
    const { data: plan, error } = await admin.from('nutrition_plans').insert({ trainer_id: user.id, client_id: studentId, title: draft.title, calories: draft.calories, protein_g: draft.protein_g, carbs_g: draft.carbs_g, fat_g: draft.fat_g, meals: draft.meals, status: 'draft' }).select('id').single()
    if (error || !plan) throw new Error('Não foi possível salvar o rascunho')
    return NextResponse.json({ nutritionPlanId: plan.id, draft, risks })
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao gerar dieta' }, { status: 500 }) }
}
