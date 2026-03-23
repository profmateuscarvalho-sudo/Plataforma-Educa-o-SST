migrate(
  (app) => {
    // Seed Admin User
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const admin = new Record(users)
    admin.setEmail('carvalhomateus@icloud.com')
    admin.setPassword('securepassword123')
    admin.setVerified(true)
    admin.set('role', 'admin')
    admin.set('name', 'Administrador SST')
    app.save(admin)

    // Seed Student User
    const student = new Record(users)
    student.setEmail('aluno@exemplo.com')
    student.setPassword('12345678')
    student.setVerified(true)
    student.set('role', 'student')
    student.set('name', 'Aluno Premium')
    app.save(student)

    // Seed Courses
    const coursesCol = app.findCollectionByNameOrId('courses')
    const c1 = new Record(coursesCol)
    c1.set('title', 'Especialização em Higiene Ocupacional Avançada')
    c1.set('description', 'Aprofunde-se nos métodos de avaliação e controle de riscos.')
    c1.set('category', 'Segurança do Trabalho')
    c1.set('price', 1297.0)
    c1.set('panda_video_id', 'dummy')
    app.save(c1)

    const c2 = new Record(coursesCol)
    c2.set('title', 'Gestão Estratégica de SST')
    c2.set('description', 'Desenvolva habilidades de liderança e cultura de segurança.')
    c2.set('category', 'Gestão de SST')
    c2.set('price', 997.0)
    c2.set('panda_video_id', 'dummy')
    app.save(c2)

    // Seed Magazines
    const magCol = app.findCollectionByNameOrId('magazines')
    const m1 = new Record(magCol)
    m1.set('title', 'Revista SST Premium - Edição 42')
    m1.set('summary', 'Exploramos como o trabalho remoto contínuo afeta a ergonomia.')
    m1.set('fliphtml5_link', 'https://fliphtml5.com')
    app.save(m1)

    // Seed News
    const newsCol = app.findCollectionByNameOrId('news')
    const n1 = new Record(newsCol)
    n1.set('title', 'Novas NRs entram em vigor em 2026')
    n1.set(
      'content',
      '<p>As atualizações nas Normas Regulamentadoras trazem novos desafios para as indústrias...</p>',
    )
    app.save(n1)

    // Seed Mentorships
    const mentCol = app.findCollectionByNameOrId('mentorships')
    const ment1 = new Record(mentCol)
    ment1.set('title', 'Sessão de Mentoria Individual (1h)')
    ment1.set('description', 'Aconselhamento de carreira e resolução de casos complexos em SST.')
    ment1.set('price', 497.0)
    ment1.set('scheduling_link', 'https://calendly.com')
    app.save(ment1)
  },
  (app) => {
    try {
      app.delete(app.findAuthRecordByEmail('_pb_users_auth_', 'carvalhomateus@icloud.com'))
      app.delete(app.findAuthRecordByEmail('_pb_users_auth_', 'aluno@exemplo.com'))
      app.truncateCollection(app.findCollectionByNameOrId('courses'))
      app.truncateCollection(app.findCollectionByNameOrId('magazines'))
      app.truncateCollection(app.findCollectionByNameOrId('news'))
      app.truncateCollection(app.findCollectionByNameOrId('mentorships'))
    } catch (e) {}
  },
)
