import React from 'react';
import styles from './ReportsPanel.module.css';
import { calendarUtils } from '../config/calendar.config';

interface EmailResult {
  message: string;
}

interface ReportsPanelProps {
  isVisible: boolean;
  quickEmailRecipient: string;
  setQuickEmailRecipient: (value: string) => void;
  isEmailLoading: boolean;
  emailResult: EmailResult | null;
  emailError: string | null;
  onQuickSendEmail: () => void;
  onSendToTeams: () => void;
  isEmailFormValid: boolean;
}

const ReportsPanel: React.FC<ReportsPanelProps> = ({
  isVisible,
  quickEmailRecipient,
  setQuickEmailRecipient,
  isEmailLoading,
  emailResult,
  emailError,
  onQuickSendEmail,
  onSendToTeams,
  isEmailFormValid
}) => {
  if (!isVisible) return null;

  return (
    <div className={styles.reportsPanel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* Email Section */}
        <EmailSection
          quickEmailRecipient={quickEmailRecipient}
          setQuickEmailRecipient={setQuickEmailRecipient}
          isEmailLoading={isEmailLoading}
          onQuickSendEmail={onQuickSendEmail}
          isEmailFormValid={isEmailFormValid}
        />

        {/* Teams Section */}
        <TeamsSection
          isEmailLoading={isEmailLoading}
          onSendToTeams={onSendToTeams}
        />

        {/* Results Section */}
        {(emailResult || emailError) && (
          <ResultsSection
            emailResult={emailResult}
            emailError={emailError}
          />
        )}
      </div>
    </div>
  );
};

interface EmailSectionProps {
  quickEmailRecipient: string;
  setQuickEmailRecipient: (value: string) => void;
  isEmailLoading: boolean;
  onQuickSendEmail: () => void;
  isEmailFormValid: boolean;
}

const EmailSection: React.FC<EmailSectionProps> = ({
  quickEmailRecipient,
  setQuickEmailRecipient,
  isEmailLoading,
  onQuickSendEmail,
  isEmailFormValid
}) => {
  return (
    <div className={styles.emailSection}>
      <div className={styles.sectionTitle}>
        📧 Envío por Correo
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Recipients Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.9)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
          }}>
            📬 Destinatarios del reporte
          </label>
          <input
            type="text"
            placeholder="Ingresa uno o más emails separados por comas..."
            value={quickEmailRecipient}
            onChange={(e) => setQuickEmailRecipient(e.target.value)}
            className={styles.emailInput}
            aria-label="Destinatarios del reporte por email"
          />
        </div>
        
        {/* Send Button */}
        <button
          onClick={onQuickSendEmail}
          disabled={!isEmailFormValid}
          className={styles.sendButton}
          aria-label="Enviar reporte por correo electrónico"
        >
          {isEmailLoading ? (
            <>
              <span className={styles.spinner}>⏳</span>
              Enviando reporte...
            </>
          ) : (
            <>
              📧 Enviar Reporte por Correo
            </>
          )}
        </button>
        
        {/* Information */}
        <InfoSection />
      </div>
    </div>
  );
};

const InfoSection: React.FC = () => {
  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      padding: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{ 
        fontSize: '13px', 
        opacity: 0.95, 
        marginBottom: '8px',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
        lineHeight: '1.5',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px'
      }}>
        <span style={{ fontSize: '14px' }}>💡</span>
        <div>
          <strong style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.95)' }}>Múltiples destinatarios:</strong>
          <br />
          <span style={{ opacity: 0.85 }}>Separa los emails con comas para enviar a varios destinatarios</span>
        </div>
      </div>
      <div style={{ 
        fontSize: '13px', 
        opacity: 0.95,
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
        lineHeight: '1.5',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px'
      }}>
        <span style={{ fontSize: '14px' }}>📊</span>
        <div>
          <strong style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.95)' }}>Contenido del reporte:</strong>
          <br />
          <span style={{ opacity: 0.85 }}>Análisis automático de promociones y días sin cobertura del calendario</span>
        </div>
      </div>
    </div>
  );
};

interface TeamsSectionProps {
  isEmailLoading: boolean;
  onSendToTeams: () => void;
}

const TeamsSection: React.FC<TeamsSectionProps> = ({
  isEmailLoading,
  onSendToTeams
}) => {
  return (
    <div className={styles.emailSection}>
      <div className={styles.sectionTitle}>
        🚀 Envío a Microsoft Teams
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={onSendToTeams}
          disabled={isEmailLoading}
          style={{
            background: isEmailLoading ? 'rgba(255, 255, 255, 0.3)' : 'linear-gradient(135deg, #6264a7 0%, #5a5fc7 100%)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            padding: '10px 20px',
            cursor: isEmailLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            opacity: isEmailLoading ? 0.7 : 1
          }}
          aria-label="Enviar reporte a Microsoft Teams"
        >
          {isEmailLoading ? '⏳ Enviando...' : '🚀 Enviar a Teams'}
        </button>
        <div style={{ 
          fontSize: '14px', 
          opacity: 0.9,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
          lineHeight: '1.4'
        }}>
          💡 <strong style={{ fontWeight: '600' }}>Webhook configurado:</strong> Los reportes se enviarán automáticamente al canal de Teams configurado.
        </div>
      </div>
    </div>
  );
};

interface ResultsSectionProps {
  emailResult: EmailResult | null;
  emailError: string | null;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({
  emailResult,
  emailError
}) => {
  return (
    <div className={styles.emailSection}>
      {emailResult && (
        <div style={{ 
          fontSize: '15px', 
          opacity: 1, 
          color: '#86efac',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
          fontWeight: '600',
          lineHeight: '1.4'
        }}>
          ✅ {emailResult.message}
        </div>
      )}
      {emailError && (
        <div style={{ 
          fontSize: '15px', 
          color: '#fca5a5',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
          fontWeight: '600',
          lineHeight: '1.4'
        }}>
          ❌ {emailError}
        </div>
      )}
    </div>
  );
};

export default ReportsPanel;