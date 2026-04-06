onRecordAfterCreateSuccess((e) => {
  const projectId = e.record.get('project')
  const costs = $app.findRecordsByFilter('doc_project_costs', `project = '${projectId}'`, '', 0, 0)
  let total = 0
  costs.forEach((c) => (total += c.get('estimated_value') || 0))
  const project = $app.findRecordById('doc_projects', projectId)
  project.set('total_budget', total)
  $app.saveNoValidate(project)
  e.next()
}, 'doc_project_costs')

onRecordAfterUpdateSuccess((e) => {
  const projectId = e.record.get('project')
  const costs = $app.findRecordsByFilter('doc_project_costs', `project = '${projectId}'`, '', 0, 0)
  let total = 0
  costs.forEach((c) => (total += c.get('estimated_value') || 0))
  const project = $app.findRecordById('doc_projects', projectId)
  project.set('total_budget', total)
  $app.saveNoValidate(project)
  e.next()
}, 'doc_project_costs')

onRecordAfterDeleteSuccess((e) => {
  const projectId = e.record.get('project')
  const costs = $app.findRecordsByFilter('doc_project_costs', `project = '${projectId}'`, '', 0, 0)
  let total = 0
  costs.forEach((c) => (total += c.get('estimated_value') || 0))
  const project = $app.findRecordById('doc_projects', projectId)
  project.set('total_budget', total)
  $app.saveNoValidate(project)
  e.next()
}, 'doc_project_costs')
