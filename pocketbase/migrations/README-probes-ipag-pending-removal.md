# Sondas iPag (migrações de teste) — pendência de remoção física

Estes 8 arquivos em `pocketbase/migrations/` são **sondas de teste** que fazem chamadas HTTP
ao iPag e gravam resultados em `access_events` — o usuário pediu a remoção deles do projeto:

- 0114_probe_ipag.js
- 0115_probe_ipag_db.js
- 0116_probe_callbacks.js
- 0117_probe_card_token.js
- 0118_probe_cpf_validation.js
- 0119_probe_card_hypotheses.js
- 0123_probe_ipag_new_key_read.js
- 0130_probe_ipag_new_key_read_v7.js

## Por que ainda existem

A plataforma recusa remover/neutralizar migrações já aplicadas pelo backend
(`delete_file`, `patch_file` e `delete_migration` todos recusam com "is applied and
cannot be deleted"). A remoção física precisa ser feita no painel Skip Cloud
(Collections/migrations) ou pelo suporte, apagando os registros correspondentes de
`_migrations` e os arquivos da árvore.

## Importante: risco real hoje

Migrações aplicadas **não rodam de novo** a cada deploy/inicialização do backend — as
sondas não fazem chamadas ativas ao iPag por deploy. O risco do usuário existe apenas
quando a história de migrações é **replayada do zero** (duplicação ou restauração do
projeto), quando as 8 sondas refazem as chamadas HTTP ao iPag em sequência.

## Referências

Nenhum outro arquivo do projeto (`src/`, `pocketbase/hooks/`) importa ou referencia
estes 8 arquivos — grep limpo. Os registros resultantes em `access_events`
(`PROBE_*`, `IPAG_KEY_CHECK_RESULT*`) foram mantidos intocados, conforme pedido do usuário.
