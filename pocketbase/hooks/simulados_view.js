routerAdd('POST', '/backend/v1/simulados/{id}/view', (e) => {
  const id = e.request.pathValue('id')
  try {
    const record = $app.findRecordById('simulados', id)
    record.set('access_count', record.getInt('access_count') + 1)
    $app.saveNoValidate(record)
    return e.json(200, { success: true })
  } catch (_) {
    return e.notFoundError('Simulado não encontrado')
  }
})
