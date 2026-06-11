import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'

export default function ProductPage() {
  const { t } = useTranslation()
  const { id } = useParams()

  return (
    <Layout>
      <div className="container" style={{ padding: '40px 16px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginBottom: '16px' }}>
          {t('common.viewProduct')}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Product ID: {id}</p>
      </div>
    </Layout>
  )
}
