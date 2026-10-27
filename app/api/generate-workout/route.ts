import { NextResponse } from 'next/server'
import { requireTrainer, generateJson, workoutDraftSchema } from '@/lib/server/ai-generation'

export async function POST(request: Request) {
  try {
    const { admin, user } = await requireTrainer(request)
    const { studentId } = await request.json()
    if (typeof studentId !== 'string') return NextResponse.json({ error: 'id do aluno obrigatório' }, { status: 400 })
    const { data: client } = await admin.from('clients').select('id,full_name,goal,trainer_id').eq('id', studentId).eq('trainer_id', user.id).single()
    const { data: anamnesis } = await admin.from('anamneses').select('answers,height_cm,weight_kg').eq('client_id', studentId).single()
    const { data: exercises } = await admin.from('exercises').select('id,name,muscle_group,equipment').or(`trainer_id.is.null,trainer_id.eq.${user.id}`).order('name')
    if (!client || !anamnesis) return NextResponse.json({ error: 'Aluno ou anamnese não encontrados' }, { status: 404 })
    const answers = anamnesis.answers || {}
    const risks = Object.entries(answers).filter(([key, value]) => /par-q|lesão|doença|medicamento|hormônio|gesta/i.test(key) && String(value).trim()).map(([key, value]) => `${key}: ${value}`)
    const draft = await generateJson(`Aluno: ${client.full_name}. Objetivo: ${client.goal || 'não informado'}. Anamnese: ${JSON.stringify(answers)}. Riscos e restrições: ${risks.join('; ') || 'nenhum informado'}. Biblioteca permitida: ${JSON.stringify(exercises)}. Crie um treino seguro em JSON exatamente no formato {"title":string,"goal":string,"days":[{"name":string,"position":number,"items":[{"exercise_id":UUID da biblioteca,"sets":number,"reps":string,"rest_seconds":number,"notes":string,"position":number}]}]}. Use somente exercise_id da biblioteca. Respeite as restrições e não prescreva exercícios incompatíveis com riscos.`, workoutDraftSchema)
    const { data: workout, error } = await admin.from('workouts').insert({ trainer_id: user.id, client_id: studentId, name: draft.title, goal: draft.goal, status: 'draft' }).select('id').single()
    if (error || !workout) throw new Error('Não foi possível salvar o rascunho')
    for (const day of draft.days) { const { data: dayRow, error: dayError } = await admin.from('workout_days').insert({ workout_id: workout.id, name: day.name, position: day.position }).select('id').single(); if (dayError || !dayRow) throw new Error('Não foi possível salvar os dias')
      await admin.from('workout_items').insert(day.items.map((item) => ({ ...item, day_id: dayRow.id }))) }
    return NextResponse.json({ workoutId: workout.id, draft, risks })
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao gerar treino' }, { status: 500 }) }
}
