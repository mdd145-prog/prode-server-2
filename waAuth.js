// waAuth.js — persiste las credenciales de Baileys en Supabase (tabla wa_auth)
// para sobrevivir redeploys de Render, cuyo filesystem es efímero. Reemplaza a
// useMultiFileAuthState. Tabla:
//
//   CREATE TABLE wa_auth (
//     session text NOT NULL DEFAULT 'default',
//     key text NOT NULL,
//     value jsonb NOT NULL,
//     updated_at timestamptz NOT NULL DEFAULT now(),
//     PRIMARY KEY (session, key)
//   );
//
// La tabla tiene RLS habilitada sin políticas: el anon key no puede leerla.
// El bot accede vía service_role / sb_secret_* key (que bypasea RLS).

const { BufferJSON, initAuthCreds, proto } = require('@whiskeysockets/baileys')

const TABLE = 'wa_auth'

// Buffers ↔ JSON via los helpers de Baileys (convierte Buffer ⇄ {type:"Buffer",data:base64}).
const encode = v => JSON.parse(JSON.stringify(v, BufferJSON.replacer))
const decode = v => JSON.parse(JSON.stringify(v), BufferJSON.reviver)

async function useSupabaseAuthState(supabase, sessionId = 'default') {
  const readKey = async (key) => {
    const { data, error } = await supabase
      .from(TABLE).select('value').eq('session', sessionId).eq('key', key).maybeSingle()
    if (error) throw error
    return data ? decode(data.value) : null
  }
  const writeKeys = async (rows) => {
    if (!rows.length) return
    const { error } = await supabase.from(TABLE).upsert(
      rows.map(r => ({ session: sessionId, key: r.key, value: encode(r.value) })),
      { onConflict: 'session,key' }
    )
    if (error) console.error('waAuth.upsert error:', error.message)
  }
  const deleteKeys = async (keys) => {
    if (!keys.length) return
    const { error } = await supabase.from(TABLE).delete().eq('session', sessionId).in('key', keys)
    if (error) console.error('waAuth.delete error:', error.message)
  }

  const creds = (await readKey('creds')) || initAuthCreds()

  const keys = {
    get: async (type, ids) => {
      const out = {}
      const { data } = await supabase.from(TABLE)
        .select('key,value').eq('session', sessionId)
        .in('key', ids.map(id => `${type}-${id}`))
      for (const row of data || []) {
        const id = row.key.slice(type.length + 1)
        let val = decode(row.value)
        if (type === 'app-state-sync-key' && val) val = proto.Message.AppStateSyncKeyData.fromObject(val)
        out[id] = val
      }
      return out
    },
    set: async (data) => {
      const ups = [], dels = []
      for (const type in data) for (const id in data[type]) {
        const key = `${type}-${id}`
        const v = data[type][id]
        if (v) ups.push({ key, value: v }); else dels.push(key)
      }
      await Promise.all([writeKeys(ups), deleteKeys(dels)])
    }
  }

  return {
    state: { creds, keys },
    saveCreds: () => writeKeys([{ key: 'creds', value: creds }])
  }
}

// Limpia toda la sesión (al detectar loggedOut o WA invalidando la sesión).
async function clearSupabaseAuthState(supabase, sessionId = 'default') {
  const { error } = await supabase.from(TABLE).delete().eq('session', sessionId)
  if (error) throw error
}

module.exports = { useSupabaseAuthState, clearSupabaseAuthState }
