import React, { useState } from 'react';

interface EmailCredentialsFormProps {
  onSave: (credentials: { email: string; password: string; recipientEmail: string }) => void;
  onClose: () => void;
  currentEmail?: string;
  currentRecipientEmail?: string;
}

export const EmailCredentialsForm: React.FC<EmailCredentialsFormProps> = ({ 
  onSave, 
  onClose, 
  currentEmail,
  currentRecipientEmail 
}) => {
  const [email, setEmail] = useState(currentEmail || '');
  const [password, setPassword] = useState('');
  const [recipientEmail, setRecipientEmail] = useState(currentRecipientEmail || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !recipientEmail) {
      alert('Por favor, completa todos los campos');
      return;
    }

    setIsLoading(true);
    
    try {
      // Guardar credenciales en localStorage de forma segura
      const credentials = { email, password, recipientEmail };
      localStorage.setItem('email_credentials', JSON.stringify(credentials));
      
      onSave(credentials);
      alert('✅ Credenciales guardadas exitosamente');
      onClose();
    } catch (error) {
      alert('❌ Error al guardar las credenciales');
    } finally {
      setIsLoading(false);
    }
  };

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
        maxWidth: '500px',
        width: '90%',
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

        <h2 style={{ color: '#0078d4', marginBottom: '20px' }}>📧 Configurar Credenciales de Correo</h2>
        
        <div style={{
          background: '#e3f2fd',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>📋 Instrucciones:</h4>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Usa tu correo de Microsoft (Outlook, Hotmail, etc.)</li>
            <li>Para la contraseña, usa una <strong>contraseña de aplicación</strong> si tienes 2FA activado</li>
            <li>Ve a <a href="https://account.microsoft.com/security" target="_blank" style={{color: '#1976d2'}}>Seguridad de Microsoft</a> → "Contraseñas de aplicación"</li>
            <li>Crea una nueva contraseña de aplicación para "Jira Dashboard"</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              📧 Correo Electrónico:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu-correo@outlook.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              🔐 Contraseña de Aplicación:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña de aplicación (16 caracteres)"
                style={{
                  width: '100%',
                  padding: '12px',
                  paddingRight: '50px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              📬 Correo de Destino (A quién enviar):
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="destinatario@empresa.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div style={{
            background: '#fff3cd',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
            fontSize: '13px'
          }}>
            ⚠️ <strong>Importante:</strong> Las credenciales se guardan localmente en tu navegador. 
            No se envían a ningún servidor externo.
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: isLoading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {isLoading ? '⏳ Guardando...' : '💾 Guardar Credenciales'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};