import { SiteLayout } from '../components/Layout.jsx'
import { Button, SectionTitle } from '../components/Bits.jsx'

export default function NotFound() {
  return (
    <SiteLayout title="Página não encontrada">
      <section className="container not-found">
        <SectionTitle as="h1" login>
          PÁGINA NÃO ENCONTRADA
        </SectionTitle>
        <p>O endereço que você abriu não existe no LightLab.</p>
        <Button to="/">VOLTAR AO INÍCIO</Button>
      </section>
    </SiteLayout>
  )
}
