import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'

export default function OrderConfirmation() {
  const { t } = useTranslation()
  const { orderId } = useParams()

  return (
    <Layout>
      <div className="container" style={{ padding: '40px 16px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginBottom: '16px' }}>
          {t('confirmation.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {t('confirmation.orderNumber')}: {orderId}
        </p>
      </div>
    </Layout>
  )
}
