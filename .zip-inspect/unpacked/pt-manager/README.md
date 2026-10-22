# Guimarães Treinador

Aplicativo mobile para personal trainers gerenciarem alunos e para alunos acompanharem sua rotina. Construído com **Expo Router, React Native, TypeScript e Supabase**.

## Identidade visual Guimarães Treinador

O app usa o símbolo da caveira fornecido pelo personal junto do nome corretamente grafado **Guimarães Treinador** na tela de acesso e nos cabeçalhos das áreas do personal e do aluno. O ícone e a tela de inicialização usam o símbolo sem o wordmark rasterizado. A paleta segue a marca: **grafite `#313131`, carvão `#292929`, branco `#FFFFFF` e cinzas neutros**. Os arquivos da marca estão em `assets/brand/`; `src/components/BrandLockup.tsx` reúne símbolo e nome nas telas.

## O que está implementado

### Área do personal
- Carteira de alunos com busca, criação e edição de cadastro, visualização de dados e remoção com confirmação.
- Convite de cadastro por link compartilhável.
- Montador de treinos manual por aluno, com seleção de exercícios, séries e repetições.
- Geração de treinos com IA via Supabase Edge Function (a chave do provedor fica somente no servidor).
- Dietas por aluno, com refeições editáveis.
- Formulário de anamnese configurável, convite por aluno e leitura das respostas.
- Conversa individual com aluno em tempo real.

### Área do aluno
- Treinos publicados, vídeos de referência e registro de cargas.
- Evolução de medidas e cargas com gráfico e histórico.
- Dieta e feedback de treino.
- Chat em tempo real com o personal.
- Cadastro vinculado ao personal por convite.

## Executar localmente

Pré-requisitos: Node.js LTS, npm e aplicativo **Expo Go** instalado no celular.

1. Crie um projeto em [Supabase](https://supabase.com/) e abra o SQL Editor.
2. Execute o arquivo `supabase/schema.sql` uma vez para criar tabelas, regras de acesso (RLS), convites, funções SQL e exercícios de exemplo.
3. Crie a conta do personal em **Authentication → Users**. Copie o UUID e execute, substituindo os valores:

   ```sql
   insert into profiles (id, role, nome)
   values ('UUID-DO-USUARIO', 'professor', 'Nome do Personal');
   ```

4. Copie `.env.example` para `.env` e preencha os valores do Supabase em **Project Settings → API**:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
   ```

5. Instale e abra o servidor de desenvolvimento:

   ```bash
   npm install
   npx expo install --fix
   npx expo start
   ```

6. Leia o QR code com Expo Go. Faça login com a conta do personal criada no passo 3.

Sem as variáveis Supabase configuradas, o app abre na tela de acesso, mas não consegue autenticar nem carregar dados reais.

## Habilitar geração de treinos por IA (opcional)

A função em `supabase/functions/gerar-treino/` integra com a API Claude. Instale e autentique o Supabase CLI, configure a chave no servidor e publique:

```bash
supabase secrets set ANTHROPIC_API_KEY=sua-chave
supabase functions deploy gerar-treino
```

A IA é opcional: treinos podem ser montados manualmente sem ela.

## Estrutura do projeto

- `app/`: rotas, login e telas de professor/aluno.
- `src/components/`: componentes reutilizados (chat, gráfico, feedback e wordmark).
- `src/lib/`: cliente Supabase, modelos e operações de dados.
- `supabase/schema.sql`: estrutura do backend, políticas RLS, funções e biblioteca de exercícios.
- `supabase/functions/`: funções de servidor, incluindo gerador opcional de treinos.
- `pt-manager.html`: protótipo visual web de referência do projeto original.

## Verificações

```bash
npx tsc --noEmit
npx expo-doctor
```

O `tsconfig.json` exclui deliberadamente `supabase/functions/**`, pois esse código roda no runtime Deno e é verificado/deployado pelo Supabase CLI, não pelo TypeScript do app Expo.
