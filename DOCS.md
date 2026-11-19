# Documentação — Plataforma Educação SST

Plataforma de educação em **Segurança e Saúde no Trabalho (SST)**: cursos, revista digital, mentorias, aulas ao vivo, simulados, documentários, comunidade "Agora", cases e a campanha **Dia do TST**.

- **Frontend:** React + Vite + TypeScript + Tailwind (kit shadcn/ui), PWA com service worker.
- **Backend:** PocketBase gerenciado na Skip Cloud, com lógica server-side em `pocketbase/hooks/` (JSVM) e migrações em `pocketbase/migrations/`.
- **Idioma:** pt-BR (com i18n para es).

---

## 1. TELAS (rotas)

### 1.1 Públicas (site institucional)

| Rota                                          | Componente                                    | Propósito                                                                                              |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `/`                                           | `src/pages/Index.tsx`                         | Home institucional: hero, planos (`HomePlansSection`), dose do dia pública, revistas, notícias, leads. |
| `/planos`                                     | `src/pages/Planos.tsx`                        | Página de planos de assinatura (Free/Prata/Ouro) com seção de preços.                                  |
| `/login`                                      | `src/pages/Login.tsx`                         | Login de usuários (aluno/admin).                                                                       |
| `/register`                                   | `src/pages/Register.tsx`                      | Cadastro público (com `RegisterErrorBoundary` e `PasswordStrengthChecker`).                            |
| `/forgot-password`                            | `src/pages/ForgotPassword.tsx`                | Solicitação de redefinição de senha.                                                                   |
| `/reset-password`                             | `src/pages/ResetPassword.tsx`                 | Definição de nova senha via token.                                                                     |
| `/ativar`                                     | `src/pages/Ativar.tsx`                        | Ativação de conta via convite/código.                                                                  |
| `/convite`                                    | `src/pages/Convite.tsx`                       | Landing de convites.                                                                                   |
| `/cursos`                                     | `src/pages/Cursos.tsx`                        | Catálogo público de cursos.                                                                            |
| `/cursos/:id`                                 | `src/pages/CourseDetails.tsx`                 | Detalhe do curso (módulos, professor, CTA de compra).                                                  |
| `/noticias`                                   | `src/pages/Noticias.tsx`                      | Listagem de notícias.                                                                                  |
| `/noticias/:id`                               | `src/pages/NewsDetails.tsx`                   | Detalhe da notícia.                                                                                    |
| `/revistas`                                   | `src/pages/Revistas.tsx`                      | Acervo das revistas SST (landing por edição, artigos).                                                 |
| `/mentorias`                                  | `src/pages/Mentorias.tsx`                     | Catálogo de mentorias com compra.                                                                      |
| `/dia-do-tst`                                 | `src/pages/DiaDoTst.tsx`                      | Campanha Dia do TST: capa-story, inscrição/lead, poste & marque, regulamento.                          |
| `/planos/pendentes` (`/subscription/pending`) | `src/pages/SubscriptionPending.tsx`           | Tela "pagamento em processamento" com polling de status.                                               |
| `/privacidade`                                | `src/pages/PrivacyPolicy.tsx`                 | Política de privacidade.                                                                               |
| `/anuncie`, `/anuncie-na-revista`             | — (redirect em `src/App.tsx`)                 | Redirecionam para `/revistas` (módulo de anúncios removido).                                           |
| `/artigos/submit`                             | `src/pages/public/ArticleSubmission.tsx`      | Submissão de artigo por autor convidado (token de link gerado no admin).                               |
| `/documentarios/pitch`                        | `src/pages/public/DocumentaryPitch.tsx`       | Submissão de pitch de documentário.                                                                    |
| `/conexoes`                                   | `src/pages/public/ProfessionalConnection.tsx` | Cadastro de profissionais para conexões.                                                               |
| `/simulados`                                  | `src/pages/public/Simulados.tsx`              | Simulados públicos (marketing de aquisição).                                                           |
| `/simulados/:id`                              | `src/pages/public/SimuladoSession.tsx`        | Execução de um simulado público.                                                                       |
| `/workplaces`                                 | `src/pages/public/WorkplaceSubmission.tsx`    | Submissão de workplaces (empresas) para a revista.                                                     |
| `*`                                           | `src/pages/NotFound.tsx`                      | 404.                                                                                                   |

### 1.2 Área do aluno (desktop / "hub")

Protegidas — exigem login; conteúdo adicional depende de plano (Prata/Ouro).

| Rota                            | Componente                                | Propósito                                                                              |
| ------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------- |
| `/plataforma`                   | `src/pages/student/Dashboard.tsx`         | Hub do aluno: continuar de onde parou, dose do dia, fita da semana, agenda, destaques. |
| `/plataforma/cursos/aula/:id`   | `src/pages/student/Lesson.tsx`            | Player de aula com materiais, quiz e avaliação.                                        |
| `/plataforma/estudo`            | `src/pages/student/Study.tsx`             | Área de estudo organizada por trilhas/categorias.                                      |
| `/plataforma/caderno`           | `src/pages/student/Notebook.tsx`          | Caderno de anotações (público/privado, compartilháveis).                               |
| `/plataforma/perfil`            | `src/pages/student/Profile.tsx`           | Perfil, plano, avatar, suporte.                                                        |
| `/plataforma/ao-vivo`           | `src/pages/student/LiveSessions.tsx`      | Agenda de aulas ao vivo.                                                               |
| `/plataforma/ao-vivo/:id`       | `src/pages/student/Live.tsx`              | Sala de live com chat em tempo real.                                                   |
| `/plataforma/cases`             | `src/pages/student/CaseFeed.tsx`          | Feed de cases profissionais (com `CaseFeedContent`/`CaseFeedSidebar`).                 |
| `/plataforma/agora`             | `src/pages/student/AgoraList.tsx`         | Lista de debates "Agora" (moderados, com votação).                                     |
| `/plataforma/agora/criar`       | `src/pages/student/AgoraCreate.tsx`       | Criação de debate.                                                                     |
| `/plataforma/agora/:id`         | `src/pages/student/AgoraRoom.tsx`         | Sala do debate: argumentos, votos, apoios, painel do moderador.                        |
| `/plataforma/documentarios`     | `src/pages/student/Documentaries.tsx`     | Catálogo de documentários.                                                             |
| `/plataforma/documentarios/:id` | `src/pages/student/DocumentaryViewer.tsx` | Visualizador do documentário (com projeto de produção).                                |
| `/plataforma/revistas/:id`      | `src/pages/student/MagazineReader.tsx`    | Leitor da revista.                                                                     |
| `/plataforma/simulados`         | `src/pages/student/Simulados.tsx`         | Simulados do aluno com histórico de resultados.                                        |

### 1.3 App mobile (versão PWA)

| Rota          | Componente                   | Propósito                                                         |
| ------------- | ---------------------------- | ----------------------------------------------------------------- |
| `/app`        | `src/pages/app/Home.tsx`     | Home do app: dose do dia, sequência, continuar assistindo, cases. |
| `/app/estudo` | `src/pages/app/Study.tsx`    | Estudo no formato mobile.                                         |
| `/app/cases`  | `src/pages/app/Cases.tsx`    | Feed de cases mobile.                                             |
| `/app/agora`  | `src/pages/app/AgoraApp.tsx` | Debates no mobile.                                                |
| `/app/perfil` | `src/pages/app/Profile.tsx`  | Perfil no mobile (usa `BottomNav`/`AppLayout`).                   |

### 1.4 Painel administrativo (`/admin`)

Protegidas — exigem conta admin (role admin no `users`).

| Rota                         | Componente                                | Propósito                                                                       |
| ---------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| `/admin`                     | `src/pages/admin/Dashboard.tsx`           | **Dashboard atual**: visão geral (indicadores de alunos, assinaturas, receita). |
| `/admin/alunos`              | `src/pages/admin/Students.tsx`            | Gestão de alunos (edição via `UserEditDialog`, plano via `UserPlanDialog`).     |
| `/admin/acessos`             | `src/pages/admin/AccessDashboard.tsx`     | Dashboard de acessos por área (baseado em `access_events`).                     |
| `/admin/planos`              | `src/pages/admin/SubscriptionPlans.tsx`   | CRUD de planos de assinatura (`SubscriptionPlanFormModal`).                     |
| `/admin/cursos`              | `src/pages/admin/Courses.tsx`             | CRUD de cursos.                                                                 |
| `/admin/cursos/builder`      | `src/pages/admin/CourseBuilder.tsx`       | Construtor do curso: módulos, aulas, materiais, quizzes.                        |
| `/admin/revistas`            | `src/pages/admin/Magazines.tsx`           | CRUD das revistas.                                                              |
| `/admin/revistas/artigos`    | `src/pages/admin/MagazineArticles.tsx`    | Artigos das revistas e workflow editorial (status).                             |
| `/admin/revistas/conexoes`   | `src/pages/admin/MagazineConnections.tsx` | Conexões profissionais ligadas à revista; geração de links de submissão.        |
| `/admin/revistas/workplaces` | `src/pages/admin/MagazineWorkplaces.tsx`  | Workplaces da edição.                                                           |
| `/admin/noticias`            | `src/pages/admin/News.tsx`                | CRUD de notícias.                                                               |
| `/admin/cases`               | `src/pages/admin/Cases.tsx`               | Moderação de cases.                                                             |
| `/admin/mentores`            | `src/pages/admin/Mentors.tsx`             | CRUD de mentores (`InstructorManager`/`MentorManager`).                         |
| `/admin/mentorias`           | `src/pages/admin/Mentorships.tsx`         | CRUD de mentorias.                                                              |
| `/admin/lives`               | `src/pages/admin/Lives.tsx`               | Aulas ao vivo + mensagens de chat.                                              |
| `/admin/simulados`           | `src/pages/admin/Simulados/*`             | CRUD de simulados, questões e wizard de criação.                                |
| `/admin/documentarios`       | `src/pages/admin/Documentaries/*`         | Documentários e wizard de produção.                                             |
| `/admin/base-conhecimento`   | `src/pages/admin/KnowledgeBase.tsx`       | Base de conhecimento da IA (RAG) com `KnowledgeEntryModal`.                     |
| `/admin/avisos`              | `src/pages/admin/Announcements.tsx`       | Avisos/announcements exibidos aos alunos.                                       |
| `/admin/leads`               | `src/pages/admin/Leads.tsx`               | Lista de leads.                                                                 |
| `/admin/leads/importar`      | `src/pages/admin/LeadImport.tsx`          | Importação de leads em massa.                                                   |
| `/admin/pagamentos`          | `src/pages/admin/Payments.tsx`            | Pagamentos registrados.                                                         |
| `/admin/emails`              | `src/pages/admin/EmailLog.tsx`            | Log de e-mails transacionais (envio + sync Brevo).                              |
| `/admin/dia-do-tst`          | `src/pages/admin/DiaTst.tsx`              | Gestão da campanha: leads, regulamento, parceiros.                              |
| `/admin/tags`                | `src/pages/admin/ProfessionalTags.tsx`    | Opções de tags profissionais (usadas em cadastro/conexões).                     |

---

## 2. BANCO DE DADOS — COLEÇÕES E CAMPOS

Todas as coleções são PocketBase (espelho completo em `src/lib/pocketbase/schema.json`). Campos de sistema padrão de toda coleção: `id`, `created`, `updated`.

### 2.1 Usuários e acesso

**users** (auth)
| Campo | Tipo | Significado |
|---|---|---|
| `name` | text | Nome completo. |
| `email` | email | Login (e-mail único). |
| `avatar` | file | Foto de perfil. |
| `phone` | text | Telefone/WhatsApp. |
| `role` | select | Papel: `student` / `admin`. |
| `plan_tier` | select | Nível vigente: `free` / `prata` / `ouro`. |
| `subscription_billing` | select | Ciclo da assinatura paga: `monthly` / `yearly`. |
| `contract_end_date` | date | Validade do contrato (YYYY-MM-DD, horário de SP). |
| `email_verificado` | bool | Verificação de e-mail controlada pela aplicação. |
| `verified` | bool | Flag nativa do PocketBase (cadastro público nasce verificado). |
| `cpf` | text | CPF (compras). |
| `estado`, `cidade` | text | Localização. |
| `profissional_tags` | json/text | Tags profissionais (de `professional_tag_options`). |

**subscriptions**
| Campo | Tipo | Significado |
|---|---|---|
| `user` | relation → users | Dono da assinatura. |
| `plan` | relation → subscription_plans | Plano contratado. |
| `status` | select | `pending` / `active` / `cancelled` (o webhook promove `pending` → `active`). |

**subscription_plans**
| Campo | Tipo | Significado |
|---|---|---|
| `name` | text | Nome (contém "Free", "Prata" ou "Ouro" — base do mapeamento de tier). |
| `price` | number | Preço (0 = Free). |
| `billing_cycle` | select | Ciclo suportado: `monthly` / `yearly`. |
| `features` | json | Lista de benefícios exibidos nas telas de planos. |
| `active` / `order` | bool / number | Exibição no site. |

**payments**
| Campo | Tipo | Significado |
|---|---|---|
| `user` | relation → users | Pagador. |
| `amount` | number | Valor. |
| `status` | select | `pending` / `paid` / `failed`. |
| `product_type` | select | `course` / `mentorship` / `subscription`. |
| `plan_id` | text | Id do plano (quando pagamento de assinatura; `order_id` do iPag = id do payment). |
| `billing_cycle` | text | Ciclo enviado na cobrança. |
| `mentorship_id` | relation → mentorships | Mentoria comprada. |
| `selected_slots` | json | Horários escolhidos da mentoria. |
| `ipag_id` | text | UUID da transação retornado pelo iPag. |

### 2.2 Conteúdo educacional

- **courses** — `title`, `description`, `thumbnail`, `instructor` (relation → instructors), `category`, `level`, `plan_tier` (nível mínimo para acessar), `published`, `order`.
- **modules** — `course` (relation), `title`, `description`, `order`.
- **lessons** — `module` (relation), `title`, `video_url`, `duration`, `content`, `order`, `plan_tier`.
- **materials** — `lesson` (relation), `title`, `file`, `type`.
- **quizzes** — `lesson` (relation), `title`, `passing_score`.
- **quiz_questions** — `quiz` (relation), `question`, `options` (json), `correct_index`, `order`.
- **course_completions** — `user`, `lesson`, `completed` (progresso do aluno).
- **lesson_ratings** — `user`, `lesson`, `rating`.
- **instructors** — `name`, `bio`, `photo`, `specialty`.
- **simulados** — `title`, `description`, `questions` count, `duration`, `public` (acesso público ou de aluno), `active`.
- **simulado_questions** — `simulado` (relation), `statement`, `options`, `correct_index`, `explanation`.
- **simulado_submissions** — `user`, `simulado`, `score`, `answers` (json), data.
- **documentaries** / **doc_projects** — catálogo de documentários e projetos de produção (pitch).
- **student_notes** — caderno: `user`, `lesson?`, `title`, `content`, `public` (compartilhamento).
- **support_messages** — mensagens de suporte do aluno: `user`, `message`, `status`.

### 2.3 Revista, notícias, cases e comunidade

- **magazines** — `title`, `issue`, `cover`, `pdf`, `featured`, `published`.
- **magazine_articles** — `magazine` (relation), `title`, `content`, `author`, `status` (workflow editorial), `submission_token` (link público de submissão), `expires_at`.
- **magazine_connections** — conexões profissionais por edição; `workplace` (relation), `professional`, `edition`.
- **magazine_workplaces** — empresas/workplaces da edição.
- **magazine_landing** — `magazine` (relation) + configuração da landing (hero, cores, textos).
- **news** — `title`, `content`, `cover`, `published`, `date`.
- **professional_cases** — `user`, `title`, `description`, `images`, `status` (moderação), `workplace`.
- **case_comments** — `case` (relation), `user`, `comment`.
- **case_likes** — `case`, `user` (toggle).
- **agora_debates** — debate: `title`, `description`, `tags`, `status` (aberto/fechado), `moderator`, `rules`.
- **agora_votes** — `debate`, `user`, `position` (a favor/contra), `argument`.
- **agora_supports** — apoio a votos (`voto`, `user`).
- **workplaces** — empresas cadastradas (pelos usuários ou na revista).
- **professional_tag_options** — catálogo de tags profissionais: `label`, `active`, `order`.

### 2.4 Mentorias e lives

- **mentors** — `name`, `title`, `bio`, `photo`, `specialties`.
- **mentorships** — `mentor` (relation), `title`, `description`, `price`, `slots` (json com datas/horários), `plan_tier`.
- **live_sessions** — `title`, `description`, `starts_at`, `youtube_url`/`vimeo_url`, `instructor`, `plan_tier`.
- **live_messages** — chat da live: `session` (relation), `user`, `message` (realtime).

### 2.5 Campanha Dia do TST

- **leads_dia_tst** — leads da campanha: `nome`, `whatsapp`, `email` (único), `empresa`, `cargo`, `aceites` (regulamento/marketing), `ip`, `enviado_em`.
- **dia_tst_config** — configuração da campanha: `data_limite` (DATA_LIMITE_ISO), `regulamento` (texto/resumo), `encerrado`.
- **dia_tst_partners** — parceiros da campanha (`nome`, `logo`, `link`).

### 2.6 Operação / infra

- **banners** — `location`, `title`, `image`, `link`, `active`, `order`. **Sem uso desde a remoção do módulo "Banners de Patrocínio"**; mantida apenas como histórico (dados e coleção intactos).
- **announcements** — avisos exibidos na plataforma: `title`, `body`, `active`, `period`.
- **leads** — leads gerais do site: `name`, `email`, `phone`, `source`.
- **email_logs** — log de e-mails: `recipient_email`, `recipient_name`, `email_type` (`payment_confirmed`/`upgrade`/lead…), `sent` (bool), `sent_at`, `brevo_synced` (bool), `brevo_list_id`, `brevo_status` (HTTP), `error_message`, `user`, `subscription`.
- **access_events** — telemetria de uso: `user`, `area` (área da plataforma), `created` — alimenta `/admin/acessos` e a termômetro de tendências.
- **knowledge_base** — documentos da IA: `title`, `content`, `status`, `vector/embedding` (RAG do agente).
- **Coleções sem uso (mantidas apenas como histórico — dados e coleção intactos, nenhuma migração de exclusão criada):**
  - **clientes**, **oportunidades**, **etapa_historico** (comercial) — módulo Comercial removido (Kanban/Clientes); os dados continuam no banco.
  - **banners** — módulo "Banners de Patrocínio" removido.
  - **magazine_landing_page** — módulo "Anúncios Revista" removido (a página `/anuncie` agora redireciona para `/revistas`).
- **agent_limits / agent_messages** — limites de uso e histórico de conversas do assistente de IA.
- **ipag_probe** (coleções de diagnóstico das migrações 0114–0130) — sondas de teste do iPag; pendentes de remoção via painel Skip Cloud.

---

## 3. REGRAS DE NEGÓCIO

### 3.1 Planos e níveis (tiers)

- Três níveis: **Free**, **Prata** e **Ouro** (`plan_tier`: `free` / `prata` / `ouro`).
- O tier é derivado do **nome do plano** da assinatura paga: nome contendo "ouro" → `ouro`; "prata" → `prata`; "free" ou `price = 0` → `free`; qualquer outro nome pago cai em `prata` (fallback).
- **Nível efetivo do usuário = o maior** entre o `plan_tier` gravado no `users` e o tier do plano da assinatura ativa (`tierFromSubscriptions`, em `src/hooks/use-student-access.ts`).
- Ciclos de cobrança: **mensal** (`monthly`) e **anual** (`yearly`), gravados em `users.subscription_billing` e no pagamento.

### 3.2 Validade de assinatura (`contract_end_date`)

- Calculada no fuso de **São Paulo (UTC-3)**, gravada como `YYYY-MM-DD`.
- **Cadastro Free: validade de +1 ano** a partir da criação.
- Em pagamento confirmado: base = maior entre a data atual e o `contract_end_date` atual (renovação estende a partir do fim vigente); mensal soma 1 mês, anual soma 1 ano, com ajuste para último dia do mês.
- Extensão só acontece **uma vez por pagamento** (idempotência via status anterior ≠ `paid`).

### 3.3 Cadastro público

- Cadastro público nasce **ativo e verificado**: o hook de registro (`on_user_register`) marca `verified = true` **após a criação do registro, com privilégio de admin** (o cliente não pode autodeclarar-se verificado), e define a validade Free de +1 ano.
- E-mail de boas-vindas/transacional é enviado e o contato é sincronizado com o Brevo.

### 3.4 Checkout

- **Assinatura** (`SubscriptionCheckoutModal` + `ipag_subscription_payment`): tokenização server-side → cobrança → `payments` com `product_type = subscription` → webhook ativa a assinatura.
- **Cursos/Mentorias** (`CheckoutModal` + `ipag_payment`): rota `/backend/v1/ipag/pay` recebe **apenas token + bandeira** (nunca número/CVV), cria `payments` com `product_type = course|mentorship`, chama `/service/payment` e grava o resultado.
- Quando o iPag recusa, a razão real (sanitizada — números de cartão e CVV mascarados) é repassada ao frontend; o `payment` vira `failed`.
- Tela `/planos/pendentes` faz polling de status para pagamentos que ficam `pending`.

### 3.5 Liberação de conteúdo por plano

- Cursos, aulas, mentorias, lives e documentários carregam um `plan_tier` mínimo; `useStudentAccess` calcula o nível efetivo e libera/bloqueia o conteúdo (badges `LockedBadge`, CTAs de upgrade em `PlanSection`/`PricingSection`).
- Ouro acessa tudo; Prata acessa conteúdo free+prata; Free acessa apenas conteúdo free.
- Simulados públicos não exigem login; os de aluno exigem assinatura conforme regra do item.

### 3.6 Campanha Dia do TST

- Lead de inscrição (`criarInscricaoDiaTst`) valida: **e-mail único** na campanha, **limite de envios por IP por hora**, aceites obrigatórios (regulamento e/ou marketing), WhatsApp válido (`validarWhatsApp` em `src/lib/dia-tst-form.ts`).
- Campanha tem **data limite** (`DATA_LIMITE_ISO` / `dia_tst_config.data_limite`); após ela, inscrições são encerradas (`MSG_INSCRICOES_ENCERRADAS`).
- Regulamento é editável no admin (`/admin/dia-do-tst`) e tem resumo público (`REGULAMENTO_RESUMO`).
- Parceiros da campanha são gerenciados em `dia_tst_partners`.
- Confirmação de inscrição dispara e-mail transacional (hook `enviar_email_lead`).

### 3.7 Editoria da revista

- Artigos entram por **link público com token** (`generateSubmissionLink` → `/artigos/submit`), validados por `validateToken` com expiração.
- Workflow de status do artigo gerenciado em `/admin/revistas/artigos`; landing por edição configurável.

---

## 4. PERMISSÕES

### 4.1 Autenticação e papéis

- Auth nativa do PocketBase com e-mail/senha. Papéis no campo `users.role`: **`student`** e **`admin`**.
- Frontend: `useAuth` (`src/hooks/use-auth.tsx`) guarda a sessão; rotas do aluno e de `/admin` exigem login; `/admin` exige `role = admin` (o painel não aparece para alunos).
- Fluxo de senha: `/forgot-password` → e-mail do PocketBase → `/reset-password`.
- Convites/ativação: `/ativar` e `/convite`.

### 4.2 Acesso por coleção

| Nível                           | Coleções                                                                                                                                                                                                       | Regra                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Público (leitura)**           | `courses`, `modules`, `lessons` (metadados), `instructors`, `news`, `magazines`, `announcements`, `subscription_plans`, `mentors`, `mentorships`, `simulados` (públicos), `dia_tst_config`, `dia_tst_partners` | Catálogo visível sem login; conteúdo restrito por plano é filtrado no frontend e protegido por regras de API. |
| **Só autenticado (dono)**       | `subscriptions`, `payments`, `student_notes`, `support_messages`, `course_completions`, `lesson_ratings`, `access_events`, `simulado_submissions`, `agora_votes`, `case_likes`                                 | Cada usuário lê/escreve apenas os próprios registros (regra de `@request.auth.id`).                           |
| **Só autenticado (comunidade)** | `professional_cases`, `case_comments`, `live_messages`, `agora_debates`                                                                                                                                        | Leitura para usuários logados; escrita autoral; moderação/admin altera status.                                |
| **Só admin**                    | `users` (listar/editar outros), `email_logs`, `access_events` (visão global), `knowledge_base`, `agent_limits`, `leads`, `leads_dia_tst`, `ipag_probe`                                                         | Somente `role = admin`.                                                                                       |
| **Public write (formulários)**  | `leads`, `leads_dia_tst`, `lista_espera`, `workplaces`, `support_messages`, submissões da revista                                                                                                              | Criação pública sem login (com as validações do item 3.6); leitura só admin.                                  |

### 4.3 Papéis do painel `/admin`

O painel é monolítico (um único papel admin), com módulos por área: alunos, acessos, planos, financeiro (pagamentos/e-mails), conteúdo (cursos, revistas, notícias, lives, simulados, documentários), comunidade (cases, agora), marketing (avisos, leads, Dia do TST) e IA (base de conhecimento). Os módulos Comercial, Banners de Patrocínio, Anúncios Revista e Testes iPag foram removidos (seção 1.4).

---

## 5. INTEGRAÇÕES

### 5.1 iPag (gateway de pagamento) — produção

- **Base URL:** `https://api.ipag.com.br` (o hook força produção se `IPAG_BASE_URL` contiver "sandbox").
- **Autenticação:** HTTP Basic com `API_ID:API_KEY`, header `x-api-version: 2`. Credenciais lidas **exclusivamente** de secrets/env no runtime (`$secrets.get` / `$os.getenv`, sempre com `.trim()`): **`IPAG_API_ID`**, **`IPAG_API_KEY`**, **`IPAG_BASE_URL`**, **`IPAG_CALLBACK_URL`**. Nenhum valor hardcoded; nada é exposto ao frontend; logs só mostram 4 primeiros + 4 últimos caracteres e o tamanho da chave.
- **Tokenização de cartão (só no backend):** rota custom `POST /backend/v1/ipag/tokenize-card` (`pocketbase/hooks/ipag_tokenize_card.js`) → iPag `POST /service/resources/card_tokens`, com `validate: false` (a validação real acontece na cobrança; `validate: true` dispararia Zero Auth e devolveria 422) e objeto **`holder` de nível superior** (o iPag devolve 406 "Holder is required" sem ele). O frontend (`src/lib/ipag.ts`) chama essa rota e recebe só o token.
- **Cobrança:** `POST /service/payment` —
  - assinaturas: `pocketbase/hooks/ipag_subscription_payment.js`;
  - cursos/mentorias: `POST /backend/v1/ipag/pay` (`pocketbase/hooks/ipag_payment.js`), com `capture: true`, `installments` e `card.token`.
- **Webhook:** `POST|GET /backend/v1/ipag-webhook` (`pocketbase/hooks/ipag_webhook.js`). Por segurança, **não confia no corpo**: consulta `GET /service/consult?order_id=...` no iPag antes de atualizar. `order_id` = id do registro `payments`. Em `paid` de assinatura: estende `contract_end_date`, promove `plan_tier`, marca `email_verificado`, promove/cria a `subscriptions` como `active` e dispara e-mail + sync Brevo (idempotente para webhooks repetidos).
- **Sync de pendentes:** `pocketbase/hooks/sync_ipag_payment.js` reconsulta transações pendentes e atualiza status (usado pela tela `/planos/pendentes`).
- **Mapeamento de status:** APPROV*/CAPTUR*/PAID* → `paid`; DENIED/REFUS*/FAIL*/CANCEL* → `failed`; demais → `pending`.

### 5.2 Brevo (e-mail e CRM de contatos)

- Secret **`BREVO_API_KEY`** (nomes apenas; nunca no código/front).
- **Envio transacional:** `POST https://api.brevo.com/v3/smtp/email` — e-mails de pagamento confirmado, upgrade de plano, boas-vindas no cadastro, leads Dia do TST e redefinição de senha (remetente institucional `assinante@educacaosst.com.br`, templates HTML próprios).
- **Sincronização de contatos:** `POST https://api.brevo.com/v3/contacts` com atributos `NOME` e `PLAN`, na **lista de ID 7**, `updateEnabled: true`.
- Todo envio é auditado em `email_logs` (`sent`, `brevo_synced`, `brevo_status`, `error_message`).
- **Redefinição de senha:** rota pública `POST /backend/v1/auth/request-password-reset` (`pocketbase/hooks/request_password_reset.js`). O frontend (`src/pages/ForgotPassword.tsx`) chama essa rota — **não** usa o `requestPasswordReset` nativo do PocketBase (SMTP não configurado). O hook gera o token nativo de reset via `user.newPasswordResetToken()` (o mesmo aceito por `confirmPasswordReset` no `src/pages/ResetPassword.tsx`), monta o link `https://www.educacaosst.com.br/reset-password/{token}` e envia "Redefinição de senha — Educação SST" via Brevo. E-mail inexistente responde 200 genérico (não revela existência). Anti-abuso: máx. 3 pedidos por e-mail a cada 15 min e 10 por IP por hora (acima disso, 200 genérico sem enviar). O envio é registrado em `email_logs` com `email_type='password_reset'`; o token nunca é logado por completo (apenas 4+4 caracteres).

### 5.3 Outros

- **Assistente de IA (agente nativo Skip Cloud):** agente definido via `$ai.agents` com base de conhecimento RAG (`knowledge_base`); chat do aluno em `AgentChatWidget` + `src/lib/skipAi.ts` (streaming).
- **PWA:** service worker e prompts de instalação (`src/lib/pwa.ts`, `InstallBanner`/`InstallPrompt`).
- **Realtime:** chat de lives e atualizações da plataforma via realtime do PocketBase (`useRealtime`).

### 5.4 Topologia de rede

- **Site publicado** (`www.educacaosst.com.br`): serve **apenas o frontend estático**; `/backend/*` não é roteável ao PocketBase por esse domínio (exige proxy no painel).
- **Backend direto:** `https://educacao-sst-premium-969c2.shrd00.internal.goskip.dev` — host usado pelas rotas custom (`/backend/v1/...`) e **obrigatoriamente o host do webhook iPag** configurado no gateway.
- O frontend resolve a URL do backend em `src/lib/constants.ts` (`BACKEND_URL`/`PUBLIC_URL`).

---

## 6. ESTRUTURA DE CÓDIGO (referência rápida)

| Caminho                           | Papel                                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| `src/pages/**`                    | Telas (públicas, aluno, app mobile, admin) — rotas em `src/App.tsx`.                    |
| `src/components/**`               | Componentes de UI, incluindo `CheckoutModal` e `SubscriptionCheckoutModal` (checkouts). |
| `src/services/**`                 | Camada de acesso a dados (PocketBase CRUD) por domínio.                                 |
| `src/hooks/use-student-access.ts` | Nível efetivo de plano e liberação de conteúdo.                                         |
| `src/lib/ipag.ts`                 | Cliente frontend da tokenização server-side.                                            |
| `src/lib/pocketbase/schema.json`  | Espelho do schema live (fonte de verdade dos campos).                                   |
| `pocketbase/hooks/*.js`           | Lógica server-side (JSVM): iPag, Brevo, cadastro, Dia do TST, e-mails.                  |
| `pocketbase/migrations/*.js`      | Migrações JS de coleções (imutáveis após aplicadas).                                    |
