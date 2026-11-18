import { useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Extrai do erro do PocketBase (POST /users/records) o motivo exato da
 * recusa. Só reporta "e-mail já cadastrado" quando o PRÓPRIO PocketBase
 * validar o campo email como duplicado — qualquer outro motivo (senha
 * fraca, campo obrigatório, hook, rede) recebe a mensagem específica
 * correspondente, nunca a de duplicidade.
 */
export function getRegisterErrorDetail(error: any): { field: string; message: string } | null {
  // O PocketBase devolve 400 com { data: { <campo>: { message: string } } };
  // em algumas versões o valor do campo vem como string simples.
  const fields = error?.response?.data
  if (!fields || typeof fields !== 'object') return null
  const keys = Object.keys(fields)
  if (keys.length === 0) return null
  const field = keys[0]
  const raw = fields[field]
  const message =
    typeof raw === 'string' ? raw : typeof raw?.message === 'string' ? raw.message : String(raw)
  return { field, message }
}

export function useRegisterError() {
  const { t } = useTranslation()

  const buildRegisterErrorMessage = (error: any): string => {
    if (!error) return t('auth.register.errorDesc')

    const detail = getRegisterErrorDetail(error)

    // Duplicidade REAL: o PocketBase responde 400 com validation_error no campo email
    if (detail && detail.field === 'email') {
      return t('auth.register.errorEmailInUse')
    }

    // Senha (validação do PocketBase ou cliente)
    if (detail && detail.field.startsWith('password')) {
      return t('auth.register.errorPasswordLength')
    }

    // Campo obrigatório ausente
    if (detail && detail.message.toLowerCase().includes('cannot be blank')) {
      return t('auth.register.errorRequiredField')
    }

    // Rede / servidor indisponível
    if (!error.response && (error.code === 'ERR_NETWORK' || error.status === 0)) {
      return t('auth.register.errorNetwork')
    }

    return t('auth.register.errorDesc')
  }

  return { buildRegisterErrorMessage }
}
