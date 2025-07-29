import React, { useState, useEffect } from 'react';
import { promoRegistryService, type PromoRecord } from '../lib/promo-registry-service';

interface PromoRegistryPanelProps {
  isVisible: boolean;
  onClose: () => void;
  selectedMonth: number;
  selectedYear: number;
}

const PromoRegistryPanel: React.FC<PromoRegistryPanelProps> = ({
  isVisible,
  onClose,
  selectedMonth,
  selectedYear
}) => {
  const [stats, setStats] = useState<any>(null);
  const [monthPromos, setMonthPromos] = useState<PromoRecord[]>([]);
  const [missingDays, setMissingDays] = useState<string[]>([]);
  const [newPromoDate, setNewPromoDate] = useState('');
  const [newPromoDescription, setNewPromoDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(selectedMonth);
  const [selectedYearIndex, setSelectedYearIndex] = useState(selectedYear);
  const [activeTab, setActiveTab] = useState<'overview' | 'missing' | 'manual' | 'backup' | 'database'>('overview');
  const [deletedRecords, setDeletedRecords] = useState<PromoRecord[]>([]);
  const [advancedStats, setAdvancedStats] = useState<any>(null);

  useEffect(() => {
    if (isVisible) {
      loadData();
    }
  }, [isVisible, selectedMonthIndex, selectedYearIndex]);

  useEffect(() => {
    setSelectedMonthIndex(selectedMonth);
    setSelectedYearIndex(selectedYear);
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Cargar estadísticas
      const statsData = promoRegistryService.getStats();
      setStats(statsData);

      // Cargar estadísticas avanzadas
      const advancedStatsData = promoRegistryService.getAdvancedStats();
      setAdvancedStats(advancedStatsData);

      // Cargar promociones del mes
      const promos = promoRegistryService.getPromosForMonth(selectedYearIndex, selectedMonthIndex);
      setMonthPromos(promos);

      // Cargar registros eliminados
      const deleted = promoRegistryService.getDeletedRecords();
      setDeletedRecords(deleted);

      // Cargar días faltantes
      const missing = promoRegistryService.getDaysWithoutPromos(selectedYearIndex, selectedMonthIndex);
      setMissingDays(missing.map(d => d.toISOString().split('T')[0]));
    } catch (error) {
      console.error('Error loading registry data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncWithJira = async () => {
    setIsLoading(true);
    try {
      // Obtener datos de Jira
      const response = await fetch('/api/all-issues');
      if (!response.ok) {
        throw new Error('Error al obtener datos de Jira');
      }
      
      const data = await response.json();
      const issues = data.issues || [];
      
      // Extraer fechas de los títulos usando la misma lógica del Calendar
      const extractDateFromTitle = (title: string): Date[] => {
        const dates: Date[] = [];
        const currentYear = new Date().getFullYear();
        
        const patterns = [
          /\b(\d{1,2})\s+DE\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\b/gi,
          /\b(\d{1,2})\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE|ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\b/gi,
          /\b(\d{1,2})\/(\d{1,2})\)/g,
          /\b(\d{1,2})\/(\d{1,2})\b/g,
          /\b(\d{2})(\d{2})\b/g,
          /\b(\d{1,2})\s+Y\s+(\d{1,2})\s+DE\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\b/gi
        ];
        
        const monthMap: { [key: string]: number } = {
          'ENERO': 0, 'ENE': 0, 'FEBRERO': 1, 'FEB': 1, 'MARZO': 2, 'MAR': 2,
          'ABRIL': 3, 'ABR': 3, 'MAYO': 4, 'MAY': 4, 'JUNIO': 5, 'JUN': 5,
          'JULIO': 6, 'JUL': 6, 'AGOSTO': 7, 'AGO': 7, 'SEPTIEMBRE': 8, 'SEP': 8,
          'OCTUBRE': 9, 'OCT': 9, 'NOVIEMBRE': 10, 'NOV': 10, 'DICIEMBRE': 11, 'DIC': 11
        };
        
        patterns.forEach((pattern, index) => {
          let match;
          while ((match = pattern.exec(title)) !== null) {
            if (index <= 1) {
              const day = parseInt(match[1]);
              const monthStr = match[2].toUpperCase();
              const month = monthMap[monthStr];
              
              if (month !== undefined && day >= 1 && day <= 31) {
                const date = new Date(currentYear, month, day);
                dates.push(date);
              }
            } else if (index === 2 || index === 3) {
              const day = parseInt(match[1]);
              const month = parseInt(match[2]) - 1;
              
              if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
                const date = new Date(currentYear, month, day);
                dates.push(date);
              }
            } else if (index === 4) {
              const day = parseInt(match[1]);
              const month = parseInt(match[2]) - 1;
              
              if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
                const date = new Date(currentYear, month, day);
                dates.push(date);
              }
            } else if (index === 5) {
              const day1 = parseInt(match[1]);
              const day2 = parseInt(match[2]);
              const monthStr = match[3].toUpperCase();
              const month = monthMap[monthStr];
              
              if (month !== undefined) {
                if (day1 >= 1 && day1 <= 31) {
                  const date1 = new Date(currentYear, month, day1);
                  dates.push(date1);
                }
                if (day2 >= 1 && day2 <= 31) {
                  const date2 = new Date(currentYear, month, day2);
                  dates.push(date2);
                }
              }
            }
          }
        });
        
        return dates;
      };
      
      // Extraer promociones de los issues
      const allExtractedDatesWithIssue = issues
        .flatMap((issue: any) => {
          const extractedDates = extractDateFromTitle(issue.fields.summary);
          return extractedDates.map(date => ({ 
            date, 
            issueKey: issue.key, 
            issueSummary: issue.fields.summary 
          }));
        });
      
      // Eliminar duplicados
      const uniqueDateIssueKeys = new Set();
      const uniqueExtractedDatesWithIssue = allExtractedDatesWithIssue.filter((item: any) => {
        const dateIssueKey = `${item.date.toDateString()}-${item.issueKey}`;
        if (uniqueDateIssueKeys.has(dateIssueKey)) {
          return false;
        }
        uniqueDateIssueKeys.add(dateIssueKey);
        return true;
      });
      
      // Sincronizar con el registro interno
      promoRegistryService.syncWithJiraData(uniqueExtractedDatesWithIssue);
      
      // Esperar un momento para que se complete la persistencia
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recargar datos
      loadData();
      
      alert(`✅ Sincronización completada. Se encontraron ${uniqueExtractedDatesWithIssue.length} promociones en Jira.`);
    } catch (error) {
      console.error('Error en sincronización:', error);
      alert('❌ Error al sincronizar con Jira');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddManualPromo = () => {
    if (!newPromoDate || !newPromoDescription) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      promoRegistryService.addManualPromo(new Date(newPromoDate), newPromoDescription);
      setNewPromoDate('');
      setNewPromoDescription('');
      loadData();
      alert('✅ Promoción manual agregada exitosamente');
    } catch (error) {
      console.error('Error adding manual promo:', error);
      alert('❌ Error al agregar promoción manual');
    }
  };

  const handleRemovePromo = (record: PromoRecord) => {
    if (confirm(`¿Estás seguro de eliminar la promoción ${record.issueKey}?`)) {
      try {
        if (record.source === 'manual') {
          promoRegistryService.removeManualPromo(new Date(record.date), record.issueKey);
        } else {
          promoRegistryService.markPromoAsDeleted(new Date(record.date), record.issueKey);
        }
        loadData();
        alert('✅ Promoción eliminada exitosamente');
      } catch (error) {
        console.error('Error removing promo:', error);
        alert('❌ Error al eliminar promoción');
      }
    }
  };

  const handleExportData = () => {
    try {
      const data = promoRegistryService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promo-registry-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('✅ Backup exportado exitosamente');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('❌ Error al exportar backup');
    }
  };

  const handleExportGlobalStatsToExcel = async () => {
    console.log('🖱️ FRONTEND: Botón de exportar Excel presionado');
    
    // Verificar si hay datos sincronizados
    const stats = promoRegistryService.getAdvancedStats();
    console.log('📊 FRONTEND: Verificando datos antes de exportar:', stats);
    
    if (stats.totalRecords === 0) {
      const shouldSync = confirm('⚠️ No hay datos en el registro interno. ¿Deseas sincronizar con Jira primero?');
      if (shouldSync) {
        await handleSyncWithJira();
        // Esperar un momento para que se complete la sincronización
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    try {
      console.log('📡 FRONTEND: Obteniendo datos del cliente para enviar al servidor...');
      
      // Obtener los datos del localStorage del cliente
      const clientData = promoRegistryService.exportData();
      console.log('📦 FRONTEND: Datos del cliente obtenidos, tamaño:', clientData.length, 'caracteres');
      
      console.log('📡 FRONTEND: Enviando datos al servidor...');
      const response = await fetch('/api/promo-registry?action=export-global-stats-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'export-global-stats-excel',
          clientData: clientData
        })
      });
      
      console.log('📨 FRONTEND: Respuesta recibida, status:', response.status, 'ok:', response.ok);
      console.log('📋 FRONTEND: Headers de respuesta:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ FRONTEND: Error en respuesta:', errorText);
        throw new Error('Error al exportar estadísticas a Excel');
      }
      
      console.log('📦 FRONTEND: Convirtiendo respuesta a blob...');
      const blob = await response.blob();
      console.log('📊 FRONTEND: Blob creado, tamaño:', blob.size, 'bytes, tipo:', blob.type);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estadisticas-globales-promociones-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ FRONTEND: Descarga iniciada exitosamente');
      alert('✅ Estadísticas globales exportadas a Excel correctamente');
    } catch (error) {
      console.error('❌ FRONTEND: Error exporting global stats to Excel:', error);
      alert('❌ Error al exportar estadísticas a Excel');
    }
  };





  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const success = promoRegistryService.importData(jsonData);
        if (success) {
          loadData();
          alert('✅ Backup importado exitosamente');
        } else {
          alert('❌ Error al importar backup');
        }
      } catch (error) {
        console.error('Error importing data:', error);
        alert('❌ Error al procesar el archivo');
      }
    };
    reader.readAsText(file);
  };

  const handleRestorePromo = (record: PromoRecord) => {
    if (confirm(`¿Estás seguro de restaurar la promoción ${record.issueKey}?`)) {
      try {
        promoRegistryService.restoreDeletedPromo(new Date(record.date), record.issueKey);
        loadData();
        alert('✅ Promoción restaurada exitosamente');
      } catch (error) {
        console.error('Error restoring promo:', error);
        alert('❌ Error al restaurar promoción');
      }
    }
  };

  const handleCreateBackup = () => {
    try {
      promoRegistryService.createBackup();
      loadData();
      alert('✅ Backup automático creado exitosamente');
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('❌ Error al crear backup');
    }
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '800px',
        maxHeight: '80vh',
        width: '90%',
        overflow: 'auto',
        color: 'white'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #374151',
          paddingBottom: '16px'
        }}>
          <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '20px' }}>
            📊 Registro Interno de Promociones
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid #374151'
        }}>
          {[
            { key: 'overview', label: '📈 Resumen', icon: '📈' },
            { key: 'missing', label: '❌ Días Faltantes', icon: '❌' },
            { key: 'manual', label: '✏️ Gestión Manual', icon: '✏️' },
            { key: 'backup', label: '💾 Backup', icon: '💾' },
            { key: 'database', label: '🗄️ Base de Datos', icon: '🗄️' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                background: activeTab === tab.key ? '#3b82f6' : 'transparent',
                border: 'none',
                color: activeTab === tab.key ? 'white' : '#94a3b8',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '18px', color: '#94a3b8' }}>Cargando...</div>
          </div>
        ) : (
          <div>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h3 style={{ color: '#f1f5f9', marginBottom: '16px' }}>
                  📊 Estadísticas Globales (Todos los Meses)
                </h3>
                
                {stats && (
                  <>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        backgroundColor: '#374151',
                        padding: '16px',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                          {stats.activeRecords}
                        </div>
                        <div style={{ fontSize: '14px', color: '#94a3b8' }}>Promociones Activas (Global)</div>
                      </div>
                      
                      <div style={{
                        backgroundColor: '#374151',
                        padding: '16px',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                          {stats.deletedRecords}
                        </div>
                        <div style={{ fontSize: '14px', color: '#94a3b8' }}>Promociones Eliminadas (Global)</div>
                      </div>
                      
                      <div style={{
                        backgroundColor: '#374151',
                        padding: '16px',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                          {stats.manualRecords}
                        </div>
                        <div style={{ fontSize: '14px', color: '#94a3b8' }}>Promociones Manuales (Global)</div>
                      </div>
                    </div>
                    
                    {/* Estadísticas del mes actual */}
                    <div style={{
                      backgroundColor: '#065f46',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '24px'
                    }}>
                      <h4 style={{ color: '#10b981', marginBottom: '12px', fontSize: '16px' }}>
                        📅 Estadísticas de {monthNames[selectedMonthIndex]} {selectedYearIndex}
                      </h4>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '12px'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                            {monthPromos.length}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6ee7b7' }}>Promociones del Mes</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                            {monthPromos.filter(p => p.source === 'manual').length}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6ee7b7' }}>Manuales del Mes</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                            {monthPromos.filter(p => p.source === 'jira').length}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6ee7b7' }}>De Jira del Mes</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Selector de meses */}
                <div style={{
                  marginBottom: '20px',
                  backgroundColor: '#1f2937',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #374151'
                }}>
                  <h4 style={{ color: '#e5e7eb', marginBottom: '12px', fontSize: '16px' }}>🗓️ Seleccionar Mes</h4>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    padding: '8px 0',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#4b5563 #1f2937'
                  }}>
                    {(() => {
                      const months = [];
                      const currentDate = new Date();
                      const currentMonth = currentDate.getMonth();
                      const currentYear = currentDate.getFullYear();
                      
                      // Generar 24 meses desde el mes actual
                      for (let i = 0; i < 24; i++) {
                        const monthDate = new Date(currentYear, currentMonth + i, 1);
                        const month = monthDate.getMonth();
                        const year = monthDate.getFullYear();
                        const isSelected = month === selectedMonthIndex && year === selectedYearIndex;
                        
                        months.push(
                          <button
                            key={`${year}-${month}`}
                            onClick={() => {
                              setSelectedMonthIndex(month);
                              setSelectedYearIndex(year);
                            }}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '6px',
                              border: isSelected ? '2px solid #10b981' : '1px solid #4b5563',
                              backgroundColor: isSelected ? '#065f46' : '#374151',
                              color: isSelected ? '#10b981' : '#e5e7eb',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: isSelected ? 'bold' : 'normal',
                              minWidth: '120px',
                              textAlign: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = '#4b5563';
                                e.currentTarget.style.borderColor = '#6b7280';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = '#374151';
                                e.currentTarget.style.borderColor = '#4b5563';
                              }
                            }}
                          >
                            {monthNames[month]} {year}
                          </button>
                        );
                      }
                      return months;
                    })()}
                  </div>
                </div>

                <h4 style={{ color: '#f1f5f9', marginBottom: '12px' }}>
                  📅 Promociones de {monthNames[selectedMonthIndex]} {selectedYearIndex} ({monthPromos.length})
                </h4>
                
                <div style={{
                  backgroundColor: '#1e40af',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#bfdbfe',
                  marginBottom: '16px'
                }}>
                  💡 <strong>Nota:</strong> Las estadísticas de arriba muestran el total de promociones de todos los meses. 
                  Aquí abajo solo se muestran las promociones del mes seleccionado ({monthNames[selectedMonthIndex]} {selectedYearIndex}).
                </div>
                
                <div style={{
                  maxHeight: '300px',
                  overflow: 'auto',
                  backgroundColor: '#374151',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  {monthPromos.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                      No hay promociones registradas para este mes
                    </div>
                  ) : (
                    monthPromos
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((promo, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#1e293b',
                        borderRadius: '6px',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#f1f5f9' }}>
                            {new Date(promo.date).toLocaleDateString('es-ES')} - {promo.issueKey}
                          </div>
                          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                            {promo.issueSummary}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {promo.source === 'manual' ? '✏️ Manual' : '🔗 Jira'} • {new Date(promo.registeredAt).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemovePromo(promo)}
                          style={{
                            background: '#ef4444',
                            border: 'none',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Missing Days Tab */}
            {activeTab === 'missing' && (
              <div>
                <h3 style={{ color: '#f1f5f9', marginBottom: '16px' }}>
                  ❌ Días sin Promociones - {monthNames[selectedMonthIndex]} {selectedYearIndex}
                </h3>
                
                {missingDays.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    backgroundColor: '#065f46',
                    borderRadius: '8px',
                    color: '#10b981'
                  }}>
                    🎉 ¡Excelente! Todos los días del mes tienen promociones registradas.
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '8px'
                  }}>
                    {missingDays.map(day => (
                      <div key={day} style={{
                        backgroundColor: '#7f1d1d',
                        color: '#fca5a5',
                        padding: '8px',
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontSize: '14px'
                      }}>
                        {new Date(day).toLocaleDateString('es-ES')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Manual Management Tab */}
            {activeTab === 'manual' && (
              <div>
                <h3 style={{ color: '#f1f5f9', marginBottom: '16px' }}>
                  ✏️ Gestión Manual de Promociones
                </h3>
                
                {/* Botón de Sincronización con Jira */}
                <div style={{
                  backgroundColor: '#1e40af',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '24px'
                }}>
                  <h4 style={{ color: '#bfdbfe', marginBottom: '12px', fontSize: '16px' }}>
                    🔄 Sincronización con Jira
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '12px' }}>
                    Sincroniza el registro interno con los datos actuales de Jira. Esto importará todas las promociones encontradas en los títulos de los issues.
                  </p>
                  <button
                    onClick={handleSyncWithJira}
                    disabled={isLoading}
                    style={{
                      backgroundColor: isLoading ? '#6b7280' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    {isLoading ? '🔄 Sincronizando...' : '🔄 Sincronizar con Jira'}
                  </button>
                </div>
                
                <div style={{
                  backgroundColor: '#374151',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ color: '#f1f5f9', marginBottom: '12px' }}>Agregar Promoción Manual</h4>
                  
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <input
                      type="date"
                      value={newPromoDate}
                      onChange={(e) => setNewPromoDate(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #4b5563',
                        backgroundColor: '#1e293b',
                        color: 'white'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Descripción de la promoción"
                      value={newPromoDescription}
                      onChange={(e) => setNewPromoDescription(e.target.value)}
                      style={{
                        flex: 2,
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #4b5563',
                        backgroundColor: '#1e293b',
                        color: 'white'
                      }}
                    />
                  </div>
                  
                  <button
                    onClick={handleAddManualPromo}
                    style={{
                      backgroundColor: '#10b981',
                      border: 'none',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ➕ Agregar Promoción
                  </button>
                </div>
                
                <div style={{
                  backgroundColor: '#1e40af',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#bfdbfe'
                }}>
                  💡 <strong>Tip:</strong> Las promociones manuales te permiten registrar días con promociones 
                  que no están en Jira o que fueron eliminadas. Esto asegura un control más preciso de tu calendario promocional.
                </div>
              </div>
            )}

            {/* Backup Tab */}
            {activeTab === 'backup' && (
              <div>
                <h3 style={{ color: '#f1f5f9', marginBottom: '16px' }}>
                  💾 Backup y Restauración
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px'
                }}>
                  <div style={{
                    backgroundColor: '#374151',
                    padding: '16px',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ color: '#f1f5f9', marginBottom: '12px' }}>📤 Exportar Datos</h4>
                    <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
                      Descarga un backup completo de tu registro interno de promociones.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        onClick={handleExportData}
                        style={{
                          backgroundColor: '#3b82f6',
                          border: 'none',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        📥 Descargar Backup (JSON)
                      </button>
                      <button
                        onClick={handleExportGlobalStatsToExcel}
                        style={{
                          backgroundColor: '#059669',
                          border: 'none',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        📊 Exportar Estadísticas a Excel
                      </button>


                    </div>
                  </div>
                  
                  <div style={{
                    backgroundColor: '#374151',
                    padding: '16px',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ color: '#f1f5f9', marginBottom: '12px' }}>📥 Importar Datos</h4>
                    <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
                      Restaura tu registro desde un archivo de backup.
                    </p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #4b5563',
                        backgroundColor: '#1e293b',
                        color: 'white'
                      }}
                    />
                  </div>
                </div>
                
                {stats && (
                  <div style={{
                    backgroundColor: '#065f46',
                    padding: '12px',
                    borderRadius: '6px',
                    marginTop: '16px',
                    fontSize: '14px',
                    color: '#10b981'
                  }}>
                    📊 <strong>Última sincronización:</strong> {new Date(stats.lastSync).toLocaleString('es-ES')}
                  </div>
                )}
              </div>
            )}

            {/* Database Tab */}
            {activeTab === 'database' && (
              <div>
                <h3 style={{ color: '#f1f5f9', marginBottom: '16px' }}>
                  🗄️ Base de Datos Interna
                </h3>
                
                {/* Estadísticas Avanzadas */}
                {advancedStats && (
                  <div style={{
                    backgroundColor: '#374151',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <h4 style={{ color: '#f1f5f9', marginBottom: '12px' }}>📊 Estadísticas Avanzadas</h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                          {advancedStats.totalOperations}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>Operaciones Totales</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
                          {advancedStats.backupHistory?.length || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>Backups Automáticos</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>
                          {advancedStats.archivedRecords}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>Registros Archivados</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8b5cf6' }}>
                          {advancedStats.jiraRecords}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>Desde Jira</div>
                      </div>
                    </div>
                    
                    {advancedStats.lastBackup && (
                      <div style={{
                        marginTop: '12px',
                        padding: '8px',
                        backgroundColor: '#065f46',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#10b981'
                      }}>
                        🕒 Último backup automático: {new Date(advancedStats.lastBackup).toLocaleString('es-ES')}
                      </div>
                    )}
                  </div>
                )}

                {/* Acciones de Base de Datos */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    backgroundColor: '#374151',
                    padding: '16px',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ color: '#f1f5f9', marginBottom: '12px' }}>🔄 Backup Automático</h4>
                    <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
                      Crea un backup automático de la base de datos interna.
                    </p>
                    <button
                      onClick={handleCreateBackup}
                      style={{
                        backgroundColor: '#059669',
                        border: 'none',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      💾 Crear Backup Ahora
                    </button>
                  </div>
                </div>

                {/* Registros Eliminados */}
                <div style={{
                  backgroundColor: '#374151',
                  padding: '16px',
                  borderRadius: '8px'
                }}>
                  <h4 style={{ color: '#f1f5f9', marginBottom: '12px' }}>🗑️ Registros Eliminados ({deletedRecords.length})</h4>
                  
                  {deletedRecords.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: '#94a3b8',
                      fontSize: '14px'
                    }}>
                      ✨ No hay registros eliminados
                    </div>
                  ) : (
                    <div style={{
                      maxHeight: '300px',
                      overflowY: 'auto',
                      border: '1px solid #4b5563',
                      borderRadius: '4px'
                    }}>
                      {deletedRecords.map((record, index) => (
                        <div
                          key={`${record.date}-${record.issueKey}-${index}`}
                          style={{
                            padding: '12px',
                            borderBottom: index < deletedRecords.length - 1 ? '1px solid #4b5563' : 'none',
                            backgroundColor: index % 2 === 0 ? '#1e293b' : 'transparent'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <div style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: '14px' }}>
                                {record.issueKey}
                              </div>
                              <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                                {record.issueSummary}
                              </div>
                              <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>
                                📅 {new Date(record.date).toLocaleDateString('es-ES')} | 
                                🗑️ Eliminado: {record.deletedAt ? new Date(record.deletedAt).toLocaleDateString('es-ES') : 'N/A'}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRestorePromo(record)}
                              style={{
                                backgroundColor: '#059669',
                                border: 'none',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              🔄 Restaurar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{
                  backgroundColor: '#1e40af',
                  padding: '12px',
                  borderRadius: '6px',
                  marginTop: '16px',
                  fontSize: '14px',
                  color: '#bfdbfe'
                }}>
                  💡 <strong>Base de Datos Interna:</strong> Todos los registros se mantienen permanentemente 
                  en localStorage, incluso si se eliminan de Jira. Los backups automáticos se crean cada 10 operaciones 
                  para garantizar la integridad de los datos.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoRegistryPanel;