import React, { useState } from 'react';

interface EmailControllerProps {
  onEmailSent?: (result: any) => void;
  recipientEmail?: string;
}

const EmailController: React.FC<EmailControllerProps> = ({ onEmailSent, recipientEmail }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [teamsWebhookUrl, setTeamsWebhookUrl] = useState<string>('');

  const sendMissingPromosEmail = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/send-missing-promos-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: recipientEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el correo');
      }

      setResult(data);
      if (onEmailSent) {
        onEmailSent(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendToTeams = async () => {
    if (!teamsWebhookUrl.trim()) {
      setError('Por favor ingresa la URL del webhook de Teams');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/send-to-teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhookUrl: teamsWebhookUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar a Teams');
      }

      setResult(data);
      if (onEmailSent) {
        onEmailSent(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const showPreview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/preview-email-data');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar la vista previa');
      }

      setPreviewData(data);
      setShowModal(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      padding: '0',
      borderRadius: '8px',
      width: '100%'
    }}>

      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Teams Webhook URL Input */}
        <div style={{ marginBottom: '8px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            color: '#333',
            marginBottom: '4px'
          }}>
            🔗 URL del Webhook de Teams:
          </label>
          <input
            type="url"
            value={teamsWebhookUrl}
            onChange={(e) => setTeamsWebhookUrl(e.target.value)}
            placeholder="https://outlook.office.com/webhook/..."
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '12px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <button
          onClick={showPreview}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: isLoading ? '#ccc' : '#48bb78',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#38a169';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#48bb78';
            }
          }}
        >
          👁️ Vista Previa del Correo
        </button>
        
        <button
          onClick={sendMissingPromosEmail}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px 15px',
            backgroundColor: isLoading ? '#ccc' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#5a67d8';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#667eea';
            }
          }}
        >
          {isLoading ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Analizando...
            </>
          ) : (
            <>
              📧 Enviar Reporte por Email
            </>
          )}
        </button>
        
        <button
          onClick={sendToTeams}
          disabled={isLoading || !teamsWebhookUrl.trim()}
          style={{
            width: '100%',
            padding: '10px 15px',
            backgroundColor: isLoading || !teamsWebhookUrl.trim() ? '#ccc' : '#6264a7',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isLoading || !teamsWebhookUrl.trim() ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (!isLoading && teamsWebhookUrl.trim()) {
              e.currentTarget.style.backgroundColor = '#464775';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && teamsWebhookUrl.trim()) {
              e.currentTarget.style.backgroundColor = '#6264a7';
            }
          }}
        >
          {isLoading ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Enviando...
            </>
          ) : (
            <>
              🚀 Enviar a Microsoft Teams
            </>
          )}
        </button>
      </div>

      {error && (
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          fontSize: '13px',
          color: '#c33'
        }}>
          ❌ {error}
        </div>
      )}

      {result && (
        <div style={{
          marginTop: '10px',
          padding: '10px 12px',
          backgroundColor: result.daysWithoutPromos.length === 0 ? '#d4edda' : '#fff3cd',
          border: `1px solid ${result.daysWithoutPromos.length === 0 ? '#c3e6cb' : '#ffeaa7'}`,
          borderRadius: '4px',
          fontSize: '13px',
          color: result.daysWithoutPromos.length === 0 ? '#155724' : '#856404'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '5px' }}>
            {result.daysWithoutPromos.length === 0 ? '✅ Todos los días tienen promociones' : '⚠️ Días sin promociones:'}
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>Total:</strong> {result.totalDays} días
          </div>
          
          {/* Email status */}
          <div style={{ marginBottom: '8px', fontSize: '12px' }}>
            {result.emailSent ? (
              <span style={{ color: '#155724' }}>📧 ✅ Correo enviado exitosamente</span>
            ) : result.emailError ? (
              <span style={{ color: '#721c24' }}>📧 ❌ Error: {result.emailError}</span>
            ) : (
              <span style={{ color: '#856404' }}>📧 ⚠️ Correo no configurado</span>
            )}
          </div>
          
          {result.daysWithoutPromos.length > 0 && (
            <div style={{
              maxHeight: '120px',
              overflowY: 'auto',
              fontSize: '12px',
              lineHeight: '1.4'
            }}>
              {result.daysWithoutPromos.slice(0, 10).map((day: string, index: number) => (
                <div key={index} style={{ marginBottom: '2px' }}>
                  • {day}
                </div>
              ))}
              {result.daysWithoutPromos.length > 10 && (
                <div style={{ fontStyle: 'italic', marginTop: '5px' }}>
                  ... y {result.daysWithoutPromos.length - 10} días más
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '800px',
            maxHeight: '90vh',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8f9fa'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                📧 Vista Previa del Reporte
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '5px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{
              padding: '20px',
              maxHeight: 'calc(90vh - 140px)',
              overflowY: 'auto'
            }}>
              {previewData ? (
                <div>
                  {/* Summary */}
                  <div style={{
                    backgroundColor: '#f8f9ff',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #e0e7ff'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>📊 Resumen del Mes Actual</h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '10px',
                      marginTop: '10px'
                    }}>
                      <div style={{
                        textAlign: 'center',
                        padding: '10px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        border: '1px solid #e0e0e0'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#667eea' }}>
                          {previewData.totalDays}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>
                          Total Días
                        </div>
                      </div>
                      <div style={{
                        textAlign: 'center',
                        padding: '10px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        border: '1px solid #e0e0e0'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#48bb78' }}>
                          {previewData.daysWithPromos}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>
                          Con Promociones
                        </div>
                      </div>
                      <div style={{
                        textAlign: 'center',
                        padding: '10px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        border: '1px solid #e0e0e0'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f56565' }}>
                          {previewData.daysWithoutPromos.length}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>
                          Sin Promociones
                        </div>
                      </div>
                      <div style={{
                        textAlign: 'center',
                        padding: '10px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        border: '1px solid #e0e0e0'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#667eea' }}>
                          {Math.round((previewData.daysWithPromos / previewData.totalDays) * 100)}%
                        </div>
                        <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>
                          Cobertura
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Days with promos */}
                  {previewData.daysWithPromosList && previewData.daysWithPromosList.length > 0 && (
                    <div style={{
                      backgroundColor: '#f8f9ff',
                      border: '1px solid #e0e7ff',
                      borderRadius: '8px',
                      padding: '15px',
                      marginBottom: '20px'
                    }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#667eea' }}>✅ Días con Promociones</h4>
                      <div style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        border: '1px solid #ddd',
                        padding: '10px',
                        borderRadius: '5px',
                        backgroundColor: 'white'
                      }}>
                        {previewData.daysWithPromosList.map((dayData: any, index: number) => (
                          <div key={index} style={{
                            marginBottom: '15px',
                            padding: '10px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '5px'
                          }}>
                            <strong style={{ color: '#333' }}>{dayData.date}</strong>
                            <ul style={{ margin: '5px 0 0 20px' }}>
                              {dayData.promos.map((promo: any, promoIndex: number) => (
                                <li key={promoIndex} style={{ fontSize: '14px', color: '#666' }}>
                                  <strong>{promo.id}</strong>: {promo.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Days without promos */}
                  {previewData.daysWithoutPromos.length > 0 ? (
                    <div style={{
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '8px',
                      padding: '15px',
                      marginBottom: '20px'
                    }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>🚨 Días sin Promociones</h4>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '8px',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {previewData.daysWithoutPromos.map((day: string, index: number) => (
                          <div key={index} style={{
                            padding: '6px 10px',
                            backgroundColor: '#fff',
                            border: '1px solid #ffeaa7',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}>
                            {day}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: '#d4edda',
                      border: '1px solid #c3e6cb',
                      borderRadius: '8px',
                      padding: '15px',
                      marginBottom: '20px',
                      textAlign: 'center'
                    }}>
                      <h4 style={{ margin: '0', color: '#155724' }}>✅ ¡Excelente! Todos los días del mes tienen promociones</h4>
                    </div>
                  )}

                  {/* Month info */}
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    textAlign: 'center',
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px'
                  }}>
                    Análisis del mes: {previewData.currentMonth} • {previewData.issuesAnalyzed} issues analizadas
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #667eea',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px'
                  }} />
                  Cargando vista previa...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailController;