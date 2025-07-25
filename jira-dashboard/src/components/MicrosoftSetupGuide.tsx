import React, { useState } from 'react';

interface MicrosoftSetupGuideProps {
  onClose: () => void;
}

export const MicrosoftSetupGuide: React.FC<MicrosoftSetupGuideProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const steps = [
    {
      title: "1. Crear App Registration en Azure",
      content: (
        <div>
          <p>Ve a <a href="https://portal.azure.com/" target="_blank" rel="noopener noreferrer" style={{color: '#0078d4'}}>Azure Portal</a></p>
          <ol>
            <li>Busca "App registrations" en la barra de búsqueda</li>
            <li>Haz clic en "+ New registration"</li>
            <li>Completa:
              <ul>
                <li><strong>Name:</strong> Jira Dashboard Email Service</li>
                <li><strong>Supported account types:</strong> Accounts in any organizational directory and personal Microsoft accounts</li>
                <li><strong>Redirect URI:</strong> Web - <code>http://localhost:4322/api/auth/callback</code></li>
              </ul>
            </li>
          </ol>
        </div>
      )
    },
    {
      title: "2. Obtener Client ID",
      content: (
        <div>
          <ol>
            <li>En la página "Overview" de tu aplicación</li>
            <li>Copia el <strong>Application (client) ID</strong></li>
            <li>Pégalo en el archivo <code>.env</code> como <code>MICROSOFT_CLIENT_ID</code></li>
          </ol>
        </div>
      )
    },
    {
      title: "3. Crear Client Secret",
      content: (
        <div>
          <ol>
            <li>Ve a "Certificates & secrets"</li>
            <li>Haz clic en "+ New client secret"</li>
            <li>Descripción: "Jira Dashboard Secret"</li>
            <li>Expiración: 24 meses (recomendado)</li>
            <li><strong>¡IMPORTANTE!</strong> Copia inmediatamente el <strong>Value</strong> (no el Secret ID)</li>
            <li>Pégalo en el archivo <code>.env</code> como <code>MICROSOFT_CLIENT_SECRET</code></li>
          </ol>
          <div style={{background: '#fff3cd', padding: '10px', borderRadius: '5px', marginTop: '10px'}}>
            ⚠️ <strong>Advertencia:</strong> Solo podrás ver el secret una vez. Si lo pierdes, tendrás que crear uno nuevo.
          </div>
        </div>
      )
    },
    {
      title: "4. Configurar Permisos de API",
      content: (
        <div>
          <ol>
            <li>Ve a "API permissions"</li>
            <li>Haz clic en "+ Add a permission"</li>
            <li>Selecciona "Microsoft Graph" → "Delegated permissions"</li>
            <li>Busca y agrega:
              <ul>
                <li><code>Mail.Send</code></li>
                <li><code>User.Read</code></li>
              </ul>
            </li>
            <li>Haz clic en "Add permissions"</li>
            <li><strong>Opcional:</strong> "Grant admin consent" si tienes permisos</li>
          </ol>
        </div>
      )
    },
    {
      title: "5. Verificar Configuración",
      content: (
        <div>
          <p>Tu archivo <code>.env</code> debe tener:</p>
          <pre style={{background: '#f5f5f5', padding: '15px', borderRadius: '5px', fontSize: '14px'}}>
{`# Microsoft Azure Configuration
MICROSOFT_CLIENT_ID=tu_client_id_aqui
MICROSOFT_CLIENT_SECRET=tu_client_secret_aqui
MICROSOFT_REDIRECT_URI=http://localhost:4322/api/auth/callback`}
          </pre>
          <div style={{background: '#d4edda', padding: '10px', borderRadius: '5px', marginTop: '10px'}}>
            ✅ <strong>Después de configurar:</strong> Reinicia el servidor con <code>npm run dev</code>
          </div>
        </div>
      )
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ×
        </button>

        <h2 style={{color: '#0078d4', marginBottom: '20px'}}>🔧 Configuración de Microsoft Azure</h2>
        
        <div style={{marginBottom: '20px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
            <span style={{fontSize: '14px', color: '#666'}}>Paso {currentStep} de {totalSteps}</span>
            <div style={{display: 'flex', gap: '5px'}}>
              {Array.from({length: totalSteps}, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: i + 1 <= currentStep ? '#0078d4' : '#ddd'
                  }}
                />
              ))}
            </div>
          </div>
          
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '20px',
            minHeight: '300px'
          }}>
            <h3 style={{color: '#333', marginBottom: '15px'}}>{steps[currentStep - 1].title}</h3>
            {steps[currentStep - 1].content}
          </div>
        </div>

        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            style={{
              background: currentStep === 1 ? '#ddd' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Anterior
          </button>

          <span style={{color: '#666', fontSize: '14px'}}>
            ¿Necesitas ayuda? Revisa el archivo <code>MICROSOFT_SETUP.md</code>
          </span>

          <button
            onClick={() => {
              if (currentStep < totalSteps) {
                setCurrentStep(currentStep + 1);
              } else {
                onClose();
              }
            }}
            style={{
              background: currentStep === totalSteps ? '#28a745' : '#0078d4',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              cursor: 'pointer'
            }}
          >
            {currentStep === totalSteps ? '✅ Finalizar' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
};