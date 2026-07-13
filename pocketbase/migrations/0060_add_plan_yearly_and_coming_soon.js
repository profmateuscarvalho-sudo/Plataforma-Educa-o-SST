migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('subscription_plans')

    if (!col.fields.getByName('price_yearly')) {
      col.fields.add(new NumberField({ name: 'price_yearly' }))
    }
    if (!col.fields.getByName('is_coming_soon')) {
      col.fields.add(new BoolField({ name: 'is_coming_soon' }))
    }
    app.save(col)

    var monthlyNames = ['Free', 'Prata Mensal', 'Ouro Mensal']
    var yearlyMap = {
      Free: 0,
      'Prata Mensal': 358.8,
      'Ouro Mensal': 838.8,
    }
    for (var i = 0; i < monthlyNames.length; i++) {
      var name = monthlyNames[i]
      try {
        var record = app.findFirstRecordByData('subscription_plans', 'name', name)
        if (!record.get('price_yearly')) {
          record.set('price_yearly', yearlyMap[name])
          app.saveNoValidate(record)
        }
      } catch (_) {}
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('subscription_plans')
    if (col.fields.getByName('price_yearly')) {
      col.fields.removeByName('price_yearly')
    }
    if (col.fields.getByName('is_coming_soon')) {
      col.fields.removeByName('is_coming_soon')
    }
    app.save(col)
  },
)
