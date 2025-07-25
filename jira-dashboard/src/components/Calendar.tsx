import React, { useEffect, useState } from 'react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import styles from './JiraIssues.module.css';
import Navigation from './Navigation';
import { EmailCredentialsForm } from './EmailCredentialsForm';
import { emailService } from '../lib/simple-email-service';
interface EmailCredentials {
  username: string;
  password: string;
}

// Estilos CSS para animaciones
const spinKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Inyectar estilos en el head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = spinKeyframes;
  document.head.appendChild(styleSheet);
}

interface Issue {
  key: string;
  fields: {
    summary: string;
    duedate?: string;
  };
}

const Calendar: React.FC = () => {
  const [dates, setDates] = useState([]);
  const [titleDates, setTitleDates] = useState([]);
  const [issuesByDate, setIssuesByDate] = useState(new Map());
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
    activeDate?: string;
    dayName?: string;
  }>({ visible: false, x: 0, y: 0, content: '', activeDate: undefined, dayName: undefined });
  

  const [value, onChange] = useState(new Date());
  
  // Estados para el Sistema de Reportes
  const [showReportsPanel, setShowReportsPanel] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<any>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);
  const [emailCredentials, setEmailCredentials] = useState<EmailCredentials | null>(null);
  const [isEmailAuthenticated, setIsEmailAuthenticated] = useState(false);
  const [quickEmailRecipient, setQuickEmailRecipient] = useState<string>('');
  const [teamsWebhookUrl] = useState<string>(import.meta.env.PUBLIC_TEAMS_WEBHOOK_URL || '');

  // Función para extraer fechas de los títulos
  const extractDateFromTitle = (title: string): Date[] => {
    const dates: Date[] = [];
    // Usar el año que se está mostrando en el calendario
    const currentYear = value.getFullYear();
    

    
    // Patrones para fechas en español
    const patterns = [
      // "23 DE JULIO", "15 ENERO", etc.
      /\b(\d{1,2})\s+DE\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\b/gi,
      // "23 JULIO", "15 ENE", etc. (sin "DE")
      /\b(\d{1,2})\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE|ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\b/gi,
      // "19/07)", "23/12)", etc. (formato DD/MM con paréntesis)
      /\b(\d{1,2})\/(\d{1,2})\)/g,
      // "19/07", "23/12", etc. (formato DD/MM sin paréntesis)
      /\b(\d{1,2})\/(\d{1,2})\b/g,
      // "2707", "1512", etc. (formato DDMM sin separador)
      /\b(\d{2})(\d{2})\b/g,
      // "23 Y 24 DE JULIO" - rangos de fechas
      /\b(\d{1,2})\s+Y\s+(\d{1,2})\s+DE\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\b/gi
    ];
    
    const monthMap: { [key: string]: number } = {
      'ENERO': 0, 'ENE': 0,
      'FEBRERO': 1, 'FEB': 1,
      'MARZO': 2, 'MAR': 2,
      'ABRIL': 3, 'ABR': 3,
      'MAYO': 4, 'MAY': 4,
      'JUNIO': 5, 'JUN': 5,
      'JULIO': 6, 'JUL': 6,
      'AGOSTO': 7, 'AGO': 7,
      'SEPTIEMBRE': 8, 'SEP': 8,
      'OCTUBRE': 9, 'OCT': 9,
      'NOVIEMBRE': 10, 'NOV': 10,
      'DICIEMBRE': 11, 'DIC': 11
    };
    
    patterns.forEach((pattern, index) => {
       let match;
       while ((match = pattern.exec(title)) !== null) {
         
         if (index <= 1) {
           // Patrones con nombres de meses
           const day = parseInt(match[1]);
           const monthStr = match[2].toUpperCase();
           const month = monthMap[monthStr];
           

           
           if (month !== undefined && day >= 1 && day <= 31) {
             const date = new Date(currentYear, month, day);
             
             // Agregar todas las fechas del año actual
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              // Agregar la fecha sin importar si ya pasó (para ver todas las fechas del año)
              dates.push(date);
           }
         } else if (index === 2 || index === 3 || index === 4) {
           // Patrones DD/MM y DDMM
           const day = parseInt(match[1]);
           const month = parseInt(match[2]) - 1; // Los meses en JS van de 0-11
           

           
           if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
             const date = new Date(currentYear, month, day);
             
             // Agregar todas las fechas del año actual
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              // Agregar la fecha sin importar si ya pasó (para ver todas las fechas del año)
              dates.push(date);
           }
         } else if (index === 5) {
           // Patrón de rango "23 Y 24 DE JULIO"
           const day1 = parseInt(match[1]);
           const day2 = parseInt(match[2]);
           const monthStr = match[3].toUpperCase();
           const month = monthMap[monthStr];
           

           
           if (month !== undefined) {
             // Agregar ambas fechas del rango
             [day1, day2].forEach(day => {
               if (day >= 1 && day <= 31) {
                 const date = new Date(currentYear, month, day);
                 
                 // Agregar todas las fechas del año actual
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  // Agregar la fecha sin importar si ya pasó (para ver todas las fechas del año)
                  dates.push(date);
               }
             });
           }
         }
       }
     });
    
    return dates;
  };

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await fetch('/api/all-issues');
        const data = await res.json();
        const issues = data.issues || [];
        
        // Fechas de vencimiento (duedate)
        const dueDates = issues
          .map((issue: { fields: { duedate?: string } }) => {
            if (issue.fields.duedate) {
              // Crear fecha de manera más explícita para evitar problemas de zona horaria
              const dateStr = issue.fields.duedate; // formato: "2025-07-23"
              const [year, month, day] = dateStr.split('-').map(Number);
              const dueDate = new Date(year, month - 1, day); // month - 1 porque JS usa 0-11
              
              return dueDate;
            }
            return null;
          })
          .filter((duedate: Date | null): duedate is Date => duedate !== null);
        
        setDates(dueDates);
        
        // Fechas extraídas de los títulos con información del issue
         const allExtractedDatesWithIssue = issues
           .flatMap((issue: { fields: { summary: string }, key: string }) => {
             const extractedDates = extractDateFromTitle(issue.fields.summary);
             return extractedDates.map(date => ({ date, issueKey: issue.key, issueSummary: issue.fields.summary }));
           });

        
        // 🚨 ELIMINAR FECHAS DUPLICADAS POR FECHA + ISSUE ID
        const uniqueDateIssueKeys = new Set();
        const uniqueExtractedDatesWithIssue = allExtractedDatesWithIssue.filter((item: { date: Date; issueKey: string }) => {
          const dateIssueKey = `${item.date.toDateString()}-${item.issueKey}`;
          if (uniqueDateIssueKeys.has(dateIssueKey)) {
            return false;
          }
          uniqueDateIssueKeys.add(dateIssueKey);
          return true;
        });
        
        // Extraer solo las fechas para el estado
        const extractedDates = uniqueExtractedDatesWithIssue.map((item: { date: Date }) => item.date);

        
        setTitleDates(extractedDates);
        
        // Crear mapa de issues por fecha
        const dateIssueMap = new Map();
        
        // Agregar issues de fechas extraídas de títulos
        uniqueExtractedDatesWithIssue.forEach((item: { date: Date; issueKey: string; issueSummary: string }) => {
          const dateKey = item.date.toDateString();
          if (!dateIssueMap.has(dateKey)) {
            dateIssueMap.set(dateKey, []);
          }
          dateIssueMap.get(dateKey).push({
            key: item.issueKey,
            summary: item.issueSummary,
            type: 'title'
          });
        });
        
        // Agregar issues con duedate
        issues.forEach((issue: Issue) => {
          if (issue.fields.duedate) {
            const dueDate = new Date(issue.fields.duedate);
            const dateKey = dueDate.toDateString();
            if (!dateIssueMap.has(dateKey)) {
              dateIssueMap.set(dateKey, []);
            }
            dateIssueMap.get(dateKey).push({
              key: issue.key,
              summary: issue.fields.summary,
              type: 'duedate'
            });
          }
        });
        
        setIssuesByDate(dateIssueMap);
        
      } catch (error) {
        console.error('Error fetching issues for calendar:', error);
      }
    };

    fetchIssues();
  }, []);

  const handleDayClick = (event: React.MouseEvent<HTMLElement>, date: Date) => {
    const dateKey = date.toDateString();
    const issuesForDate = issuesByDate.get(dateKey);
    
    if (issuesForDate && issuesForDate.length > 0) {
      // Filtrar solo las promociones (type === 'title')
      const promoIssues = issuesForDate.filter((issue: { type: string }) => issue.type === 'title');
      
      if (promoIssues.length > 0) {
        const tooltipContent = promoIssues.map((issue: { key: string; summary: string }) =>
          `${issue.key}: ${issue.summary}`
        ).join('\n');
        
        // Calcular posición del tooltip evitando desbordamiento
        const tooltipWidth = 320; // maxWidth del tooltip
        const tooltipHeight = 200; // altura estimada
        const margin = 20; // margen de seguridad
        
        // Obtener la posición del elemento del día clickeado
        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        
        // Posicionar el tooltip muy cerca del día clickeado
        let x = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        let y = rect.bottom + 5; // Reducido de 10 a 5
        
        // Ajustar posición horizontal
        if (x + tooltipWidth + margin > window.innerWidth) {
          x = window.innerWidth - tooltipWidth - margin;
        }
        if (x < margin) {
          x = margin;
        }
        
        // Ajustar posición vertical si se sale por abajo
        if (y + tooltipHeight + margin > window.innerHeight) {
          y = rect.top - tooltipHeight - 5; // Reducido de 10 a 5
        }
        
        // Si también se sale por arriba, posicionar al lado
        if (y < margin) {
          y = rect.top + (rect.height / 2) - (tooltipHeight / 2);
          x = rect.right + 5; // Reducido de 10 a 5
          
          // Si se sale por la derecha, posicionar a la izquierda
          if (x + tooltipWidth + margin > window.innerWidth) {
            x = rect.left - tooltipWidth - 5; // Reducido de 10 a 5
          }
        }
        
        // Obtener el nombre del día en español
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayName = dayNames[date.getDay()];
        
        setTooltip({
          visible: true,
          x,
          y,
          content: tooltipContent,
          activeDate: dateKey,
          dayName: `${dayName} ${date.getDate()}`
        });
      }
    }
  };
  
 const handleCloseTooltip = () => {
    setTooltip({ visible: false, x: 0, y: 0, content: '' });
  };
  
  // Funciones para el Sistema de Reportes
  const handleEmailLogin = () => {
    setShowCredentialsForm(true);
  };
  
  const handleLogout = () => {
    emailService.clearCredentials();
    setEmailCredentials(null);
    setIsEmailAuthenticated(false);
  };
  
  const handleQuickSendEmail = async () => {
    if (!quickEmailRecipient.trim()) {
      alert('Por favor, ingresa al menos un destinatario');
      return;
    }

    // Procesar múltiples destinatarios separados por comas
    const recipients = quickEmailRecipient.split(',').map(email => email.trim()).filter(email => email.length > 0);
    
    if (recipients.length === 0) {
      alert('Por favor, ingresa al menos un destinatario válido');
      return;
    }

    console.log('🚀 Iniciando envío de email a múltiples destinatarios:', recipients);
    setIsEmailLoading(true);
    setEmailError(null);
    setEmailResult(null);

    try {
      // Primero obtenemos los datos del análisis desde la API
      console.log('📊 Obteniendo datos de análisis...');
      const analysisResponse = await fetch('/api/send-missing-promos-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: recipients, analysisOnly: true }),
      });

      const analysisData = await analysisResponse.json();
      console.log('📄 Datos de análisis:', analysisData);

      if (!analysisResponse.ok) {
        throw new Error(analysisData.error || 'Error al obtener datos de análisis');
      }

      // Si hay días sin promociones, enviamos el email usando EmailJS desde el cliente
      if (analysisData.daysWithoutPromos && analysisData.daysWithoutPromos.length > 0) {
        console.log('📧 Enviando emails usando EmailJS desde el cliente...');
        
        // Importar EmailJS service dinámicamente
        const { emailJSService } = await import('../lib/emailjs-service');

        let successCount = 0;
        let errorCount = 0;
        const results = [];
        
        // Enviar a cada destinatario
        for (const recipient of recipients) {
          try {
            console.log(`📧 Enviando a: ${recipient}`);
            const emailResult = await emailJSService.sendEmail({
              to: recipient,
              subject: analysisData.emailSubject || 'Reporte de Promociones Faltantes',
              html: analysisData.emailBody || 'No hay contenido disponible',
              from: 'julio.caniunir@estelarbet.com'
            });
            
            console.log(`📧 Resultado para ${recipient}:`, emailResult);
            
            if (emailResult.success) {
              successCount++;
              results.push({ recipient, success: true });
              console.log(`✅ Email enviado exitosamente a ${recipient}`);
            } else {
              errorCount++;
              results.push({ recipient, success: false, error: emailResult.message });
              console.log(`❌ Error enviando a ${recipient}:`, emailResult.message);
            }
          } catch (error: any) {
            errorCount++;
            results.push({ recipient, success: false, error: error.message });
            console.error(`❌ Error enviando a ${recipient}:`, error);
          }
        }
        
        // Mostrar resultado final
        if (successCount === recipients.length) {
          setEmailResult({ message: `Correos enviados exitosamente a todos los destinatarios (${successCount}/${recipients.length})` });
          alert(`✅ Correos enviados exitosamente a todos los destinatarios (${successCount}/${recipients.length})`);
        } else if (successCount > 0) {
          setEmailResult({ message: `Enviados ${successCount} de ${recipients.length} correos exitosamente` });
          alert(`⚠️ Enviados ${successCount} de ${recipients.length} correos exitosamente`);
        } else {
          throw new Error('No se pudo enviar ningún correo');
        }
        
        console.log('📊 Resumen de envíos:', results);
      } else {
        setEmailResult({ message: 'No hay días sin promociones para reportar' });
        alert('ℹ️ No hay días sin promociones para reportar');
      }
    } catch (err: any) {
      console.error('❌ Error al enviar correos:', err);
      setEmailError(err.message);
      alert('❌ Error al enviar correos: ' + err.message);
    } finally {
      setIsEmailLoading(false);
    }
  };
  
  const handleSendToTeams = async () => {
    setIsEmailLoading(true);
    setEmailError(null);
    setEmailResult(null);

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

      setEmailResult({ message: 'Reporte enviado exitosamente a Microsoft Teams' });
      alert('✅ Reporte enviado exitosamente a Microsoft Teams');
    } catch (err: any) {
      setEmailError(err.message);
      alert('❌ Error al enviar a Teams: ' + err.message);
    } finally {
      setIsEmailLoading(false);
    }
  };
  
  // Verificar credenciales al cargar el componente
  useEffect(() => {
    const credentials = emailService.getStoredCredentials();
    if (credentials) {
      setEmailCredentials(credentials as unknown as EmailCredentials);
      setIsEmailAuthenticated(true);
    }
  }, []);

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      let classes = '';
      const dateKey = date.toDateString();
      const dayNumber = date.getDate();
      

      
      // Verificar si hay promociones extraídas de títulos (prioridad alta)
      const matchingTitleDates = (titleDates as Date[]).filter(tDate => tDate.toDateString() === dateKey);
      
      if (matchingTitleDates.length > 0) {
        // Días con promociones - verde
        classes = `title-date title-date-${matchingTitleDates.length}`;
      } else {
        // Verificar si hay issues en el mapa general
        const hasAnyIssue = issuesByDate.has(dateKey);
        
        if (!hasAnyIssue) {
          // Días sin ningún tipo de issue - rojo
          classes = 'highlight';
        } else {
          // Días con issues pero sin promociones - aplicar clase especial para distinguirlos
          classes = 'has-issues-no-promos';
        }
      }
      
      // Agregar clase active-tooltip si este día tiene el tooltip activo
      if (tooltip.visible && tooltip.activeDate === dateKey) {
        classes += (classes ? ' ' : '') + 'active-tooltip';
      }

      
      return classes || null;
    }
    return null;
  };
  
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
     if (view === 'month') {
       const dateKey = date.toDateString();
       const issuesForDate = issuesByDate.get(dateKey);
       
       if (issuesForDate && issuesForDate.length > 0) {
         
         return (
           <div 
             onClick={(e) => {
               e.stopPropagation();
               handleDayClick(e, date);
             }}
             style={{ 
               width: '100%', 
               height: '100%', 
               position: 'absolute', 
               top: 0, 
               left: 0,
               cursor: 'pointer',
               zIndex: 1
             }}
           />
         );
       }
     }
     return null;
   };

  return (
    <div>
      <Navigation currentPage="calendar" />
      <div style={{ 
        marginTop: '70px', 
        padding: '20px', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        position: 'relative'
      }}>

      
      <ReactCalendar
        onChange={(value, event) => onChange(value as Date)}
        value={value}
        locale="es-ES"
        tileClassName={tileClassName}
        tileContent={tileContent}
        className="calendar-container"
      />
      

      
      {/* Botón para mostrar/ocultar Sistema de Reportes */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={() => setShowReportsPanel(!showReportsPanel)}
          style={{
            padding: '14px 28px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: '0 auto',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            letterSpacing: '0.5px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #3730a3 0%, #6b21a8 100%)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.5), 0 4px 12px rgba(0, 0, 0, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 70, 229, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          📊 Sistema de Reportes
          <span style={{
            transform: showReportsPanel ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>▼</span>
        </button>
      </div>
      
      {/* Panel desplegable del Sistema de Reportes */}
      {showReportsPanel && (
        <div style={{
          marginTop: '15px',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)',
          animation: 'slideDown 0.3s ease-out',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>


            {/* Sección de envío por correo */}
            <div style={{
              padding: '18px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ 
                marginBottom: '16px', 
                fontSize: '18px', 
                fontWeight: '700',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                letterSpacing: '0.3px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                📧 Envío por Correo
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Input de destinatarios */}
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
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      fontSize: '15px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      width: '100%',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 255, 255, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                
                {/* Botón de envío */}
                <button
                  onClick={handleQuickSendEmail}
                  disabled={!quickEmailRecipient.trim() || isEmailLoading}
                  style={{
                    background: (!quickEmailRecipient.trim() || isEmailLoading) 
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)' 
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: 'white',
                    padding: '14px 24px',
                    cursor: (!quickEmailRecipient.trim() || isEmailLoading) ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '700',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    transition: 'all 0.3s ease',
                    opacity: (!quickEmailRecipient.trim() || isEmailLoading) ? 0.6 : 1,
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                    letterSpacing: '0.5px',
                    boxShadow: (!quickEmailRecipient.trim() || isEmailLoading) 
                      ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                      : '0 4px 15px rgba(16, 185, 129, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (!(!quickEmailRecipient.trim() || isEmailLoading)) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5), 0 4px 12px rgba(0, 0, 0, 0.25)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(!quickEmailRecipient.trim() || isEmailLoading)) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)';
                    }
                  }}
                >
                  {isEmailLoading ? (
                    <>
                      <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                      Enviando reporte...
                    </>
                  ) : (
                    <>
                      📧 Enviar Reporte por Correo
                    </>
                  )}
                </button>
                {/* Información y consejos */}
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
              </div>
            </div>

            {/* Sección de Microsoft Teams */}
            <div style={{
              padding: '18px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ 
                marginBottom: '16px', 
                fontSize: '18px', 
                fontWeight: '700',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                letterSpacing: '0.3px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                🚀 Envío a Microsoft Teams
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={handleSendToTeams}
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

            {/* Resultados */}
            {(emailResult || emailError) && (
              <div style={{
                padding: '18px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
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
            )}
          </div>
        </div>
      )}
      
      {/* Tooltip */}
      {tooltip.visible && (
        <>
          {/* Overlay para cerrar tooltip */}
          <div
            onClick={handleCloseTooltip}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 999,
              backgroundColor: 'transparent',
              pointerEvents: 'auto'
            }}
          />

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: tooltip.x,
              top: tooltip.y,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'pre-line',
              zIndex: 1001,
              maxWidth: '320px',
              minWidth: '200px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              lineHeight: '1.4',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              transform: 'translateY(-8px)',
              animation: 'tooltipFadeIn 0.2s ease-out',
              pointerEvents: 'auto'
            }}
          >
          <div style={{
            fontSize: '11px',
            opacity: 0.8,
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: '600',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Promociones</span>
            {tooltip.dayName && (
              <span style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '700'
              }}>
                {tooltip.dayName}
              </span>
            )}
          </div>
          {tooltip.content.split('\n').map((line, index) => {
             const issueKey = line.split(':')[0];
             const issueTitle = line.split(':').slice(1).join(':').trim();
             const jiraUrl = `https://prontopaga.atlassian.net/browse/${issueKey}`;
             
             return (
               <div 
                 key={index} 
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   window.open(jiraUrl, '_blank');
                 }}
                 style={{
                   marginBottom: index < tooltip.content.split('\n').length - 1 ? '8px' : '0',
                   paddingLeft: '8px',
                   borderLeft: '3px solid rgba(255, 255, 255, 0.4)',
                   paddingBottom: '4px',
                   cursor: 'pointer',
                   transition: 'all 0.2s ease',
                   borderRadius: '6px',
                   padding: '6px 8px',
                   pointerEvents: 'auto',
                   userSelect: 'none'
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                   e.currentTarget.style.transform = 'translateX(4px)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.backgroundColor = 'transparent';
                   e.currentTarget.style.transform = 'translateX(0)';
                 }}
               >
                 <div style={{
                   fontSize: '12px',
                   fontWeight: '600',
                   color: '#FFE066',
                   marginBottom: '2px',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '6px'
                 }}>
                   {issueKey}
                   <span style={{
                     fontSize: '10px',
                     opacity: 0.7,
                     fontWeight: '400'
                   }}>↗</span>
                 </div>
                 <div style={{
                   fontSize: '13px',
                   opacity: 0.95
                 }}>
                   {issueTitle}
                 </div>
               </div>
             );
           })}
          </div>
        </>
       )}
      <style>{`
        .react-calendar {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border: none;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.125em;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }
        .react-calendar--doubleView {
          width: 700px;
        }
        .react-calendar--doubleView .react-calendar__viewContainer {
          display: flex;
          margin: -0.5em;
        }
        .react-calendar--doubleView .react-calendar__viewContainer > * {
          width: 50%;
          margin: 0.5em;
        }
        .react-calendar *,
        .react-calendar *:before,
        .react-calendar *:after {
          -moz-box-sizing: border-box;
          -webkit-box-sizing: border-box;
          box-sizing: border-box;
        }
        .react-calendar button {
          margin: 0;
          border: 0;
          outline: none;
        }
        .react-calendar button:enabled:hover,
        .react-calendar button:enabled:focus {
          background-color: #e6f3ff;
        }
        .react-calendar__navigation {
          display: flex;
          height: 70px;
          margin-bottom: 1em;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px 16px 0 0;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        .react-calendar__navigation button {
          min-width: 60px;
          background: none;
          font-size: 18px;
          font-weight: bold;
          color: white;
          transition: all 0.3s ease;
          border-radius: 8px;
          margin: 8px 4px;
        }
        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: bold;
          font-size: 0.9em;
          background: linear-gradient(135deg, #f1f3f4 0%, #e9ecef 100%);
          border-bottom: 2px solid #dee2e6;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          padding: 10px;
        }
        .react-calendar__month-view__weekdays__weekday {
          padding: 1.5em 0.5em;
          font-size: 1.1em;
          color: #495057;
          font-weight: 600;
          letter-spacing: 0.5px;
          background: rgba(255,255,255,0.3);
          border-radius: 8px;
          margin: 0;
          border: 1px solid rgba(222, 226, 230, 0.5);
        }
        .react-calendar__month-view__weekNumbers .react-calendar__tile {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75em;
          font-weight: bold;
        }
        .react-calendar__month-view__days__day--weekend {
          color: #d10000;
        }
        .react-calendar__month-view__days__day--neighboringMonth {
          color: #757575;
        }
        .react-calendar__year-view .react-calendar__tile,
        .react-calendar__decade-view .react-calendar__tile,
        .react-calendar__century-view .react-calendar__tile {
          padding: 2em 0.5em;
        }
        .react-calendar__tile {
          max-width: 100%;
          padding: 25px 8px;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          text-align: center;
          line-height: 20px;
          font-size: 18px;
          border: 2px solid #dee2e6;
          flex: 1;
          min-height: 80px;
          transition: all 0.3s ease;
          position: relative;
          font-weight: 500;
          margin: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .react-calendar__tile:disabled {
          background-color: #f0f0f0;
        }
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border-radius: 12px;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(33, 150, 243, 0.2);
          border-color: #2196f3;
        }
        .react-calendar__tile--now {
          background: linear-gradient(135deg, #fff59d 0%, #ffeb3b 100%);
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(255, 235, 59, 0.4);
          font-weight: bold;
          border: 2px solid #ffc107;
        }
        .react-calendar__tile--now:enabled:hover,
        .react-calendar__tile--now:enabled:focus {
          background: #ffffa9;
        }
        .react-calendar__tile--hasActive {
          background: #76baff;
        }
        .react-calendar__tile--hasActive:enabled:hover,
        .react-calendar__tile--hasActive:enabled:focus {
          background: #a9d4ff;
        }
        .react-calendar__tile--active {
          background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
          color: white;
          border-radius: 12px;
          box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4);
          transform: scale(1.05);
          font-weight: bold;
        }
        .react-calendar__tile--active:enabled:hover,
        .react-calendar__tile--active:enabled:focus {
          background: #1087ff;
        }
        .highlight {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
          color: white !important;
          border-radius: 12px;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4) !important;
          border: 2px solid #ff5252 !important;
        }
        .title-date {
          background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%) !important;
          color: white !important;
          border-radius: 12px;
          font-weight: bold;
          position: relative;
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4) !important;
          border: 2px solid #4caf50 !important;
        }
        .has-issues-no-promos {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
          color: white !important;
          border-radius: 12px;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4) !important;
          border: 2px solid #ff5252 !important;
        }
        
        .react-calendar__tile {
          position: relative;
          overflow: hidden;
        }
        
        .react-calendar__tile::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s ease;
        }
        
        .react-calendar__tile:hover::before {
          left: 100%;
        }
        
        .react-calendar__tile.active-tooltip {
          border: 3px solid #667eea !important;
          box-shadow: 0 0 12px rgba(102, 126, 234, 0.4) !important;
          z-index: 10;
          transform: scale(1.02);
          transition: all 0.2s ease;
        }
        
        /* Números para todas las promociones */
         .title-date-1::after,
         .title-date-2::after,
         .title-date-3::after,
         .title-date-4::after,
         .title-date-5::after,
         .title-date-6::after,
         .title-date-7::after,
         .title-date-8::after,
         .title-date-9::after {
           position: absolute;
           top: 4px;
           right: 4px;
           color: #ffffff;
           font-size: 12px;
           font-weight: bold;
           text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
           background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
           border-radius: 50%;
           width: 22px;
           height: 22px;
           display: flex;
           align-items: center;
           justify-content: center;
           line-height: 1;
           box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
           border: 2px solid white;
         }
         
         .title-date-1::after { content: '1'; }
         .title-date-2::after { content: '2'; }
         .title-date-3::after { content: '3'; }
         .title-date-4::after { content: '4'; }
         .title-date-5::after { content: '5'; }
         .title-date-6::after { content: '6'; }
         .title-date-7::after { content: '7'; }
         .title-date-8::after { content: '8'; }
         .title-date-9::after { content: '9'; }
         
         @keyframes tooltipFadeIn {
           from {
             opacity: 0;
             transform: translateY(-4px) scale(0.95);
           }
           to {
             opacity: 1;
             transform: translateY(-8px) scale(1);
           }
         }
         
         @keyframes slideDown {
           from {
             opacity: 0;
             transform: translateY(-10px);
             max-height: 0;
           }
           to {
             opacity: 1;
             transform: translateY(0);
             max-height: 500px;
           }}
      `}</style>
      
      {/* Modal de credenciales de correo */}
      {showCredentialsForm && (
        <EmailCredentialsForm
          onSave={(credentials) => {
            setEmailCredentials({ 
              username: credentials.email,
              password: credentials.password 
            });
            setIsEmailAuthenticated(true);
            setShowCredentialsForm(false);
          }}
          onClose={() => setShowCredentialsForm(false)}
        />
      )}
      </div>
    </div>
  );
};

export default Calendar;