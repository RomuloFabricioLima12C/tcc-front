// =====================================================================
// Envio de e-mail pelo Brevo (grátis: 300 e-mails por dia).
// Usa a API HTTPS do Brevo porque o Render grátis bloqueia SMTP (Gmail etc.).
//
// No .env: BREVO_API_KEY, EMAIL_REMETENTE (e-mail confirmado no Brevo) e,
// se quiser, EMAIL_REMETENTE_NOME. Sem BREVO_API_KEY o e-mail não é enviado:
// o texto aparece no terminal da API (bom para testar no computador).
// =====================================================================

async function enviarEmail({ para, assunto, texto, html }) {
  const chave = process.env.BREVO_API_KEY
  if (!chave) {
    console.log(`[email] BREVO_API_KEY vazio: e-mail NÃO enviado. Para ${para}: ${assunto}\n${texto}`)
    return
  }

  const resposta = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': chave, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: process.env.EMAIL_REMETENTE_NOME || 'LightLab', email: process.env.EMAIL_REMETENTE },
      to: [{ email: para }],
      subject: assunto,
      textContent: texto,
      htmlContent: html,
    }),
  })
  if (!resposta.ok) {
    throw new Error(`Brevo respondeu ${resposta.status}: ${await resposta.text()}`)
  }
}

module.exports = { enviarEmail }
