migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('payments')

    if (!col.fields.getByName('plan_id')) {
      col.fields.add(new TextField({ name: 'plan_id' }))
    }

    if (!col.fields.getByName('billing_cycle')) {
      col.fields.add(new SelectField({ name: 'billing_cycle', values: ['monthly', 'yearly'] }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('payments')
    const planIdField = col.fields.getByName('plan_id')
    if (planIdField) col.fields.remove(planIdField)
    const billingCycleField = col.fields.getByName('billing_cycle')
    if (billingCycleField) col.fields.remove(billingCycleField)
    app.save(col)
  },
)
