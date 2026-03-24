routerAdd(
  'POST',
  '/backend/v1/panda/upload',
  (e) => {
    const files = e.findUploadedFiles('video')

    if (!files || files.length === 0) {
      throw new BadRequestError('Nenhum arquivo de vídeo recebido.')
    }

    // Simulate successful upload response to Panda Video API
    // A real integration requires sending a multipart request via $http
    const fakePandaId = 'v-' + $security.randomString(8) + '-' + $security.randomString(4)

    return e.json(200, {
      success: true,
      video_id: fakePandaId,
      message: 'Vídeo enviado para o Panda Video com sucesso.',
    })
  },
  $apis.requireAuth(),
)
