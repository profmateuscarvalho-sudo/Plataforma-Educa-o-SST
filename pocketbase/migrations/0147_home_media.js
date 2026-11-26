// PARTE A NOVA HOME — mídia do hero da Home.
// Campos novos em magazine_landing_page (coleção já existente, um único
// registro de configuração — mesma usada pelos preços da venda avulsa):
//   - home_video          (FileField .mp4, até 5 MB, maxSelect 1)
//   - home_video_poster   (FileField .jpg,  maxSelect 1)
//   - current_issue_pages (NumberField int, nº de páginas da edição do mês)
// Idempotente: só adiciona o campo se ainda não existir; nada é apagado.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('magazine_landing_page')
    let changed = false
    if (!col.fields.getByName('home_video')) {
      col.fields.add(
        new FileField({
          name: 'home_video',
          maxSelect: 1,
          maxSize: 5242880, // 5 MB
          mimeTypes: ['video/mp4'],
        }),
      )
      changed = true
    }
    if (!col.fields.getByName('home_video_poster')) {
      col.fields.add(
        new FileField({
          name: 'home_video_poster',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg'],
        }),
      )
      changed = true
    }
    if (!col.fields.getByName('current_issue_pages')) {
      col.fields.add(
        new NumberField({
          name: 'current_issue_pages',
          onlyInt: true,
          min: 0,
        }),
      )
      changed = true
    }
    if (changed) app.save(col)

    // Garante o registro de configuração único (mesma semente da 0139).
    const existing = app.findRecordsByFilter('magazine_landing_page', '', '-created', 1, 0)
    if (existing.length === 0) {
      const rec = new Record(col)
      rec.set('current_issue_price', 29.9)
      rec.set('previous_issue_price', 14.9)
      app.save(rec)
      console.log('[0147] magazine_landing_page criada (registro de configuração único)')
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('magazine_landing_page')
    let changed = false
    if (col.fields.getByName('home_video')) {
      col.fields.removeByName('home_video')
      changed = true
    }
    if (col.fields.getByName('home_video_poster')) {
      col.fields.removeByName('home_video_poster')
      changed = true
    }
    if (col.fields.getByName('current_issue_pages')) {
      col.fields.removeByName('current_issue_pages')
      changed = true
    }
    if (changed) app.save(col)
  },
)
