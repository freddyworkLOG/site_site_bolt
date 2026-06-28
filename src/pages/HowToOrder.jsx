import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'

export default function HowToOrder() {
  const { t } = useTranslation()

  return (
    <Layout>
      <div className="container" style={{ padding: '40px 16px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginBottom: '16px' }}>
          {t('howToOrder.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>{t('howToOrder.subtitle')}</p>
      </div>
    </Layout>
  )
}
