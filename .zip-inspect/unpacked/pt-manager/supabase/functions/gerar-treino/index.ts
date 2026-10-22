// IA geradora de treinos. Deploy: supabase functions deploy gerar-treino
// Segredo: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// App: supabase.functions.invoke('gerar-treino', { body: { objetivo, nivel, dias, foco, exercicios } })
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const { objetivo, nivel, dias, foco, exercicios } = await req.json(); // exercicios: [{id, nome, grupo}]

  const prompt = `Você é um personal trainer. Monte ${dias} treinos semanais (divisão A/B/C...) para objetivo "${objetivo}", nível "${nivel}", foco "${foco}".
Use SOMENTE exercícios desta lista (use o id): ${JSON.stringify(exercicios)}.
Responda APENAS com JSON, sem texto extra: [{"nome":"Treino A - ...","itens":[{"exercicio_id":"...","series":3,"reps":"12"}]}]`;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
  });
  const j = await r.json();
  const txt: string = j.content?.[0]?.text ?? '[]';
  const treinos = JSON.parse(txt.replace(/```json|```/g, '').trim());
  return new Response(JSON.stringify({ treinos }), { headers: { ...cors, 'content-type': 'application/json' } });
});
