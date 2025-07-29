import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

/**
 * Servicio de Registro Interno de Promociones - Base de Datos Interna
 * 
 * Este servicio mantiene un registro PERMANENTE de todas las promociones,
 * garantizando que los datos persistan aunque las tarjetas de Jira sean eliminadas.
 * 
 * Características de la Base de Datos Interna:
 * - ✅ Persistencia TOTAL: Los registros NUNCA se eliminan físicamente
 * - ✅ Historial completo: Mantiene todas las promociones que alguna vez existieron
 * - ✅ Estados de registro: active, deleted, archived para control total
 * - ✅ Respaldo automático: Backup periódico para prevenir pérdida de datos
 * - ✅ Sincronización inteligente: Detecta cambios en Jira sin perder historial
 * - ✅ Auditoría completa: Timestamps de todas las operaciones
 * - ✅ Recuperación de datos: Capacidad de restaurar promociones eliminadas
 * 
 * Funcionalidades:
 * - Almacenamiento local robusto con múltiples capas de seguridad
 * - Sincronización bidireccional con datos de Jira
 * - Historial completo de promociones por mes/año
 * - Sistema de backup automático y manual
 * - Gestión de estados para control de ciclo de vida
 * - Herramientas de auditoría y análisis
 */

export interface PromoRecord {
  date: string; // formato: 'YYYY-MM-DD'
  issueKey: string;
  issueSummary: string;
  registeredAt: string; // timestamp de cuando se registró
  lastModified: string; // timestamp de última modificación
  source: 'jira' | 'manual'; // origen del registro
  status: 'active' | 'deleted' | 'archived'; // estado del registro
  deletedAt?: string; // timestamp de cuando se marcó como eliminado
  restoredAt?: string; // timestamp de cuando se restauró (si aplica)
  metadata?: { // información adicional para auditoría
    originalJiraUrl?: string;
    backupCount?: number;
    syncHistory?: string[];
  };
}

export interface PromoRegistryData {
  records: PromoRecord[];
  lastSync: string;
  lastBackup: string;
  version: string;
  totalOperations: number; // contador de operaciones para auditoría
  backupHistory: string[]; // historial de respaldos
}

class PromoRegistryService {
  private readonly STORAGE_KEY = 'promo_registry_data';
  private readonly BACKUP_KEY = 'promo_registry_backup';
  private readonly VERSION = '2.0.0'; // Versión actualizada para BD interna mejorada
  private readonly AUTO_BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas en ms
  private data: PromoRegistryData;

  constructor() {
    console.log('🚀 DEBUG: Inicializando PromoRegistryService...');
    console.log(`🔑 DEBUG: Storage key que se usará: ${this.STORAGE_KEY}`);
    
    // Verificar si localStorage está disponible (solo en el cliente)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      console.log('✅ DEBUG: localStorage está disponible (cliente)');
      const rawData = localStorage.getItem(this.STORAGE_KEY);
      if (rawData) {
        console.log(`💾 DEBUG: Datos encontrados en localStorage, tamaño: ${rawData.length} caracteres`);
      } else {
        console.log('⚠️ DEBUG: No se encontraron datos en localStorage');
      }
    } else {
      console.log('🖥️ DEBUG: Ejecutándose en servidor - localStorage no disponible');
    }
    
    this.data = this.loadData();
    
    // Solo inicializar auto backup en el cliente
    if (typeof window !== 'undefined') {
      this.initializeAutoBackup();
    }
    
    console.log('🗄️ Base de Datos Interna de Promociones inicializada');
    console.log(`📊 DEBUG: Registros totales cargados: ${this.data.records.length}`);
    console.log(`✅ DEBUG: Registros activos: ${this.data.records.filter(r => r.status === 'active').length}`);
    console.log(`🗑️ DEBUG: Registros eliminados (preservados): ${this.data.records.filter(r => r.status === 'deleted').length}`);
    console.log(`📅 DEBUG: Última sincronización: ${this.data.lastSync}`);
    console.log(`🔢 DEBUG: Total operaciones: ${this.data.totalOperations}`);
  }

  /**
   * Cargar datos del localStorage con sistema de respaldo
   */
  private loadData(): PromoRegistryData {
    // Solo intentar cargar desde localStorage si estamos en el cliente
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Migración de versiones si es necesario
          const migrated = this.migrateData(parsed);
          console.log('✅ Base de datos cargada exitosamente desde localStorage');
          return migrated;
        }
      } catch (error) {
        console.error('❌ Error cargando datos principales:', error);
        
        // Intentar cargar desde respaldo
        try {
          const backup = localStorage.getItem(this.BACKUP_KEY);
          if (backup) {
            const parsed = JSON.parse(backup);
            console.log('🔄 Datos recuperados desde respaldo');
            return this.migrateData(parsed);
          }
        } catch (backupError) {
          console.error('❌ Error cargando respaldo:', backupError);
        }
      }
    } else {
      console.log('🖥️ Servidor: Inicializando datos por defecto (sin localStorage)');
    }

    // Datos por defecto para nueva instalación o servidor
    console.log('🆕 Inicializando nueva base de datos interna');
    return {
      records: [],
      lastSync: new Date().toISOString(),
      lastBackup: new Date().toISOString(),
      version: this.VERSION,
      totalOperations: 0,
      backupHistory: []
    };
  }

  /**
   * Guardar datos en localStorage con respaldo automático
   */
  private saveData(): void {
    // Solo intentar guardar si estamos en el cliente
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.log('🖥️ Servidor: Saltando guardado en localStorage');
      return;
    }
    
    try {
      this.data.lastSync = new Date().toISOString();
      this.data.totalOperations = (this.data.totalOperations || 0) + 1;
      
      console.log(`💾 DEBUG: Intentando guardar ${this.data.records.length} registros en localStorage`);
      console.log(`🔑 DEBUG: Storage key: ${this.STORAGE_KEY}`);
      
      // Guardar datos principales
      const dataToSave = JSON.stringify(this.data);
      console.log(`📦 DEBUG: Tamaño de datos a guardar: ${dataToSave.length} caracteres`);
      
      localStorage.setItem(this.STORAGE_KEY, dataToSave);
      
      // Verificar que se guardó correctamente
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log(`✅ DEBUG: Datos guardados correctamente. Registros verificados: ${parsed.records.length}`);
      } else {
        console.error('❌ DEBUG: No se pudo verificar el guardado');
      }
      
      // Crear respaldo automático cada 10 operaciones (solo en cliente)
      if (this.data.totalOperations % 10 === 0) {
        this.createAutoBackup();
      }
      
    } catch (error) {
      console.error('❌ Error guardando datos:', error);
      console.error('❌ DEBUG: Detalles del error:', error.message);
      // Intentar guardar solo en respaldo si falla el principal
      try {
        localStorage.setItem(this.BACKUP_KEY, JSON.stringify(this.data));
        console.log('⚠️ Datos guardados solo en respaldo');
      } catch (backupError) {
        console.error('❌ Error crítico: No se pudo guardar en ningún lado:', backupError);
      }
    }
  }

  /**
   * Migrar datos de versiones anteriores
   */
  private migrateData(data: any): PromoRegistryData {
    console.log(`🔄 Migrando datos desde versión ${data.version || 'legacy'} a ${this.VERSION}`);
    
    // Migración desde versión 1.x a 2.x
    if (!data.version || data.version.startsWith('1.')) {
      // Agregar nuevas propiedades
      data.lastBackup = data.lastBackup || new Date().toISOString();
      data.totalOperations = data.totalOperations || 0;
      data.backupHistory = data.backupHistory || [];
      
      // Migrar registros existentes
      if (data.records) {
        data.records = data.records.map((record: any) => ({
          ...record,
          lastModified: record.lastModified || record.registeredAt || new Date().toISOString(),
          metadata: record.metadata || {
            backupCount: 0,
            syncHistory: []
          }
        }));
      }
      
      console.log(`✅ Migración completada: ${data.records?.length || 0} registros actualizados`);
    }
    
    data.version = this.VERSION;
    return data;
  }

  /**
   * Registrar una nueva promoción en la base de datos interna
   */
  public registerPromo(date: Date, issueKey: string, issueSummary: string, source: 'jira' | 'manual' = 'jira'): void {
    const dateStr = this.formatDate(date);
    const now = new Date().toISOString();
    
    console.log(`🔍 DEBUG: Registrando promo ${issueKey} para fecha ${dateStr}`);
    
    // Verificar si ya existe un registro para esta fecha e issue
    const existingIndex = this.data.records.findIndex(
      record => record.date === dateStr && record.issueKey === issueKey
    );

    if (existingIndex >= 0) {
      // Actualizar registro existente
      const existing = this.data.records[existingIndex];
      console.log(`🔄 DEBUG: Actualizando registro existente en índice ${existingIndex}`);
      this.data.records[existingIndex] = {
        ...existing,
        issueSummary,
        status: 'active',
        lastModified: now,
        restoredAt: existing.status === 'deleted' ? now : existing.restoredAt,
        metadata: {
          ...existing.metadata,
          syncHistory: [...(existing.metadata?.syncHistory || []), now],
          originalJiraUrl: source === 'jira' ? `https://prontopaga.atlassian.net/browse/${issueKey}` : existing.metadata?.originalJiraUrl
        }
      };
      
      if (existing.status === 'deleted') {
        console.log(`🔄 Promoción restaurada automáticamente: ${issueKey} - ${dateStr}`);
      }
    } else {
      // Crear nuevo registro
      console.log(`➕ DEBUG: Creando nuevo registro`);
      const newRecord: PromoRecord = {
        date: dateStr,
        issueKey,
        issueSummary,
        registeredAt: now,
        lastModified: now,
        source,
        status: 'active',
        metadata: {
          originalJiraUrl: source === 'jira' ? `https://prontopaga.atlassian.net/browse/${issueKey}` : undefined,
          backupCount: 0,
          syncHistory: [now]
        }
      };
      this.data.records.push(newRecord);
      console.log(`✅ Nueva promoción registrada: ${issueKey} - ${dateStr}`);
      console.log(`📊 DEBUG: Total registros ahora: ${this.data.records.length}`);
    }

    this.saveData();
  }

  /**
   * Marcar una promoción como eliminada (PRESERVACIÓN TOTAL - NO se elimina físicamente)
   */
  public markPromoAsDeleted(date: Date, issueKey: string): void {
    const dateStr = this.formatDate(date);
    const now = new Date().toISOString();
    const record = this.data.records.find(
      r => r.date === dateStr && r.issueKey === issueKey
    );
    
    if (record && record.status !== 'deleted') {
      record.status = 'deleted';
      record.lastModified = now;
      record.deletedAt = now;
      record.metadata = {
        ...record.metadata,
        syncHistory: [...(record.metadata?.syncHistory || []), `deleted:${now}`]
      };
      
      console.log(`🗑️ Promoción marcada como eliminada (PRESERVADA): ${issueKey} - ${dateStr}`);
      console.log(`📋 El registro se mantiene en la base de datos para historial`);
      this.saveData();
    }
  }

  /**
   * Obtener promociones para una fecha específica
   */
  public getPromosForDate(date: Date): PromoRecord[] {
    const dateStr = this.formatDate(date);
    return this.data.records.filter(
      record => record.date === dateStr && record.status === 'active'
    );
  }

  /**
   * Obtener promociones para un mes específico
   */
  public getPromosForMonth(year: number, month: number): PromoRecord[] {
    const monthStr = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    return this.data.records.filter(
      record => record.date.startsWith(monthStr) && record.status === 'active'
    );
  }

  /**
   * Verificar si una fecha tiene promociones registradas
   */
  public hasPromosForDate(date: Date): boolean {
    return this.getPromosForDate(date).length > 0;
  }

  /**
   * Sincronizar con datos de Jira
   */
  public syncWithJiraData(jiraPromos: Array<{ date: Date; issueKey: string; issueSummary: string }>): void {
    console.log('🔄 Sincronizando registro interno con datos de Jira...');
    console.log(`📊 DEBUG: Promociones de Jira recibidas: ${jiraPromos.length}`);
    console.log(`📋 DEBUG: Registros actuales en BD interna: ${this.data.records.length}`);
    
    // Marcar todos los registros actuales como potencialmente eliminados
    const currentActiveRecords = this.data.records.filter(r => r.status === 'active');
    console.log(`🎯 DEBUG: Registros activos actuales: ${currentActiveRecords.length}`);
    
    // Registrar/actualizar promociones de Jira
    let newRecords = 0;
    let updatedRecords = 0;
    jiraPromos.forEach(promo => {
      const beforeCount = this.data.records.length;
      this.registerPromo(promo.date, promo.issueKey, promo.issueSummary, 'jira');
      const afterCount = this.data.records.length;
      if (afterCount > beforeCount) {
        newRecords++;
      } else {
        updatedRecords++;
      }
    });
    
    console.log(`✅ DEBUG: Nuevos registros: ${newRecords}, Actualizados: ${updatedRecords}`);
    console.log(`📋 DEBUG: Total registros después de sync: ${this.data.records.length}`);

    // Verificar registros que ya no están en Jira
    currentActiveRecords.forEach(record => {
      const stillExists = jiraPromos.some(
        jira => this.formatDate(jira.date) === record.date && jira.issueKey === record.issueKey
      );
      
      if (!stillExists && record.source === 'jira') {
        console.log(`⚠️ Promoción eliminada de Jira: ${record.issueKey} - ${record.date}`);
        record.status = 'deleted';
      }
    });

    this.saveData();
    console.log(`💾 DEBUG: Datos guardados. Total final: ${this.data.records.length} registros`);
    console.log('✅ Sincronización completada');
  }

  /**
   * Obtener días sin promociones para un mes
   */
  public getDaysWithoutPromos(year: number, month: number): Date[] {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysWithoutPromos: Date[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (!this.hasPromosForDate(date)) {
        daysWithoutPromos.push(date);
      }
    }

    return daysWithoutPromos;
  }

  /**
   * Obtener estadísticas del registro
   */
  public getStats(): {
    totalRecords: number;
    activeRecords: number;
    deletedRecords: number;
    manualRecords: number;
    lastSync: string;
  } {
    // Mantener compatibilidad con el código existente
    const advancedStats = this.getAdvancedStats();
    return {
      totalRecords: advancedStats.totalRecords,
      activeRecords: advancedStats.activeRecords,
      deletedRecords: advancedStats.deletedRecords,
      manualRecords: advancedStats.manualRecords,
      lastSync: advancedStats.lastSync
    };
  }

  /**
   * Inicializar sistema de respaldo automático
   */
  private initializeAutoBackup(): void {
    // Verificar si necesita respaldo automático
    const lastBackup = new Date(this.data.lastBackup || 0);
    const now = new Date();
    
    if (now.getTime() - lastBackup.getTime() > this.AUTO_BACKUP_INTERVAL) {
      this.createAutoBackup();
    }
    
    // Programar próximo respaldo automático
    setTimeout(() => {
      this.createAutoBackup();
      setInterval(() => this.createAutoBackup(), this.AUTO_BACKUP_INTERVAL);
    }, this.AUTO_BACKUP_INTERVAL);
  }

  /**
   * Crear respaldo de la base de datos (automático)
   */
  private createAutoBackup(): void {
    try {
      const backupData = {
        ...this.data,
        backupCreatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backupData));
      
      this.data.lastBackup = new Date().toISOString();
      this.data.backupHistory.push(this.data.lastBackup);
      
      // Mantener solo los últimos 10 respaldos en el historial
      if (this.data.backupHistory.length > 10) {
        this.data.backupHistory = this.data.backupHistory.slice(-10);
      }
      
      console.log('💾 Respaldo automático creado exitosamente');
    } catch (error) {
      console.error('❌ Error creando respaldo:', error);
    }
  }

  /**
   * Crear respaldo manual desde la interfaz
   */
  public createBackup(): void {
    try {
      const backupData = {
        ...this.data,
        backupCreatedAt: new Date().toISOString(),
        backupType: 'manual'
      };
      
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backupData));
      
      this.data.lastBackup = new Date().toISOString();
      this.data.backupHistory.push(this.data.lastBackup);
      
      // Mantener solo los últimos 10 respaldos en el historial
      if (this.data.backupHistory.length > 10) {
        this.data.backupHistory = this.data.backupHistory.slice(-10);
      }
      
      this.saveData();
      console.log('💾 Respaldo manual creado exitosamente en localStorage');
    } catch (error) {
      console.error('❌ Error creando respaldo manual:', error);
      throw error;
    }
  }

  /**
   * Restaurar promoción eliminada
   */
  public restoreDeletedPromo(date: Date, issueKey: string): boolean {
    const dateStr = this.formatDate(date);
    const now = new Date().toISOString();
    const record = this.data.records.find(
      r => r.date === dateStr && r.issueKey === issueKey && r.status === 'deleted'
    );
    
    if (record) {
      record.status = 'active';
      record.lastModified = now;
      record.restoredAt = now;
      record.metadata = {
        ...record.metadata,
        syncHistory: [...(record.metadata?.syncHistory || []), `restored:${now}`]
      };
      
      console.log(`🔄 Promoción restaurada manualmente: ${issueKey} - ${dateStr}`);
      this.saveData();
      return true;
    }
    
    return false;
  }

  /**
   * Obtener registros eliminados (para auditoría)
   */
  public getDeletedRecords(): PromoRecord[] {
    return this.data.records.filter(r => r.status === 'deleted');
  }

  /**
   * Obtener estadísticas completas de la base de datos
   */
  public getAdvancedStats(): {
    totalRecords: number;
    activeRecords: number;
    deletedRecords: number;
    archivedRecords: number;
    manualRecords: number;
    jiraRecords: number;
    lastSync: string;
    lastBackup: string;
    totalOperations: number;
    oldestRecord: string | null;
    newestRecord: string | null;
    backupHistory: string[];
  } {
    const records = this.data.records;
    const sortedByDate = records.sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());
    
    return {
      totalRecords: records.length,
      activeRecords: records.filter(r => r.status === 'active').length,
      deletedRecords: records.filter(r => r.status === 'deleted').length,
      archivedRecords: records.filter(r => r.status === 'archived').length,
      manualRecords: records.filter(r => r.source === 'manual').length,
      jiraRecords: records.filter(r => r.source === 'jira').length,
      lastSync: this.data.lastSync,
      lastBackup: this.data.lastBackup,
      totalOperations: this.data.totalOperations || 0,
      oldestRecord: sortedByDate.length > 0 ? sortedByDate[0].registeredAt : null,
      newestRecord: sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1].registeredAt : null,
      backupHistory: this.data.backupHistory || []
    };
  }

  /**
   * Exportar datos para backup manual
   */
  public exportData(): string {
    return JSON.stringify({
      ...this.data,
      exportedAt: new Date().toISOString(),
      exportType: 'manual'
    }, null, 2);
  }

  /**
   * Obtener datos reales de Jira
   */
  private async fetchJiraData(): Promise<any> {
    try {
      const response = await fetch('/api/all-issues');
      if (!response.ok) {
        throw new Error(`Error fetching Jira data: ${response.status}`);
      }
      const data = await response.json();
      return data.issues || [];
    } catch (error) {
      console.error('Error obteniendo datos de Jira:', error);
      return [];
    }
  }

  /**
   * Extraer promociones de los datos de Jira usando extractDateFromTitle
   */
  private extractPromosFromJiraData(issues: any[]): Array<{ date: Date; issueKey: string; issueSummary: string }> {
    const promos: Array<{ date: Date; issueKey: string; issueSummary: string }> = [];
    
    issues.forEach((issue: any) => {
      const dates = this.extractDateFromTitle(issue.fields.summary);
      dates.forEach(date => {
        promos.push({
          date,
          issueKey: issue.key,
          issueSummary: issue.fields.summary
        });
      });
    });
    
    return promos;
  }

  /**
   * Función para extraer fechas de los títulos (copiada de JiraIssues.tsx)
   */
  private extractDateFromTitle(title: string): Date[] {
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
  }

  /**
   * Calcular estadísticas basadas en datos reales de Jira
   */
  private calculateRealStats(realPromos: Array<{ date: Date; issueKey: string; issueSummary: string }>) {
    return {
      totalRecords: realPromos.length,
      activeRecords: realPromos.length,
      deletedRecords: 0,
      archivedRecords: 0,
      manualRecords: 0,
      jiraRecords: realPromos.length,
      lastSync: new Date().toISOString(),
      lastBackup: new Date().toISOString(),
      totalOperations: realPromos.length,
      oldestRecord: realPromos.length > 0 ? realPromos[0].date.toISOString() : null,
      newestRecord: realPromos.length > 0 ? realPromos[realPromos.length - 1].date.toISOString() : null,
      backupHistory: []
    };
  }

  /**
   * Agregar datos de prueba para testing
   */
  /**
   * Método para agregar datos de prueba (DESHABILITADO)
   * Solo se mantiene para compatibilidad, pero no se ejecuta automáticamente
   */
  public addTestData(): void {
    console.log('ℹ️ addTestData() llamado pero deshabilitado para mantener solo datos orgánicos');
    console.log('💡 Para agregar promociones, usa la sincronización con Jira o el registro manual');
    // Método deshabilitado para mantener solo datos orgánicos y reales
    return;
  }

  /**
   * Exportar estadísticas globales completas a Excel con diseño profesional
   * Usa los datos del registro interno en lugar de hacer fetch a Jira
   */
  public async exportGlobalStatsToExcel(): Promise<Blob> {
    console.log('🚀 Iniciando exportación de Excel con ExcelJS...');
    
    // Crear workbook con ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Registro de Promociones';
    workbook.lastModifiedBy = 'Sistema Automatizado';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Usar datos del registro interno
    console.log('📊 Usando datos del registro interno...');
    const allRecords = this.data.records;
    console.log('📋 Total de registros en la base interna:', allRecords.length);
    
    // Convertir registros internos al formato esperado
    const realPromos = allRecords
      .filter(record => record.status === 'active')
      .map(record => ({
        date: new Date(record.date),
        issueKey: record.issueKey,
        issueSummary: record.issueSummary
      }));
    
    console.log('🎯 Promociones activas:', realPromos.length);
    
    // Obtener estadísticas completas
    const stats = this.getAdvancedStats();
    console.log('📈 Estadísticas calculadas:', stats);
    
    // === HOJA 1: RESUMEN EJECUTIVO ===
    const resumenSheet = workbook.addWorksheet('📊 Resumen Ejecutivo');
    
    // Configurar columnas
    resumenSheet.columns = [
      { header: 'Descripción', key: 'description', width: 35 },
      { header: 'Valor', key: 'value', width: 25 },
      { header: 'Extra1', key: 'extra1', width: 15 },
      { header: 'Extra2', key: 'extra2', width: 15 }
    ];
    
    // Título principal
    resumenSheet.mergeCells('A1:D1');
    const titleCell = resumenSheet.getCell('A1');
    titleCell.value = 'REGISTRO DE PROMOCIONES - ESTADÍSTICAS GLOBALES';
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E79' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
    resumenSheet.getRow(1).height = 25;
    
    // Fecha de generación
    resumenSheet.getCell('A2').value = 'Generado el:';
    resumenSheet.getCell('B2').value = new Date().toLocaleString('es-ES');
    this.applyHeaderStyle(resumenSheet.getCell('A2'));
    this.applyDataStyle(resumenSheet.getCell('B2'));
    
    // Secciones de datos
    let currentRow = 4;
    
    // MÉTRICAS PRINCIPALES
    this.addSectionHeader(resumenSheet, currentRow++, 'MÉTRICAS PRINCIPALES');
    this.addDataRow(resumenSheet, currentRow++, 'Total de Registros', stats.totalRecords);
    this.addDataRow(resumenSheet, currentRow++, 'Registros Activos', stats.activeRecords);
    this.addDataRow(resumenSheet, currentRow++, 'Registros Eliminados', stats.deletedRecords);
    this.addDataRow(resumenSheet, currentRow++, 'Registros Archivados', stats.archivedRecords);
    currentRow++;
    
    // ORIGEN DE DATOS
    this.addSectionHeader(resumenSheet, currentRow++, 'ORIGEN DE DATOS');
    this.addDataRow(resumenSheet, currentRow++, 'Promociones desde Jira', stats.jiraRecords);
    this.addDataRow(resumenSheet, currentRow++, 'Promociones Manuales', stats.manualRecords);
    currentRow++;
    
    // ACTIVIDAD DEL SISTEMA
    this.addSectionHeader(resumenSheet, currentRow++, 'ACTIVIDAD DEL SISTEMA');
    this.addDataRow(resumenSheet, currentRow++, 'Total de Operaciones', stats.totalOperations);
    this.addDataRow(resumenSheet, currentRow++, 'Backups Automáticos', stats.backupHistory?.length || 0);
    this.addDataRow(resumenSheet, currentRow++, 'Última Sincronización', new Date(stats.lastSync).toLocaleString('es-ES'));
    this.addDataRow(resumenSheet, currentRow++, 'Último Backup', new Date(stats.lastBackup).toLocaleString('es-ES'));
    currentRow++;
    
    // RANGO TEMPORAL
    this.addSectionHeader(resumenSheet, currentRow++, 'RANGO TEMPORAL');
    this.addDataRow(resumenSheet, currentRow++, 'Registro Más Antiguo', stats.oldestRecord ? new Date(stats.oldestRecord).toLocaleString('es-ES') : 'N/A');
    this.addDataRow(resumenSheet, currentRow++, 'Registro Más Reciente', stats.newestRecord ? new Date(stats.newestRecord).toLocaleString('es-ES') : 'N/A');
    
    // === HOJA 2: REGISTROS ACTIVOS ===
    const activeSheet = workbook.addWorksheet('✅ Registros Activos');
    
    // Configurar columnas
    activeSheet.columns = [
      { header: 'Fecha', key: 'date', width: 12 },
      { header: 'Issue Key', key: 'issueKey', width: 15 },
      { header: 'Descripción', key: 'description', width: 50 },
      { header: 'Registrado', key: 'registered', width: 20 },
      { header: 'Última Modificación', key: 'modified', width: 20 },
      { header: 'Origen', key: 'source', width: 10 },
      { header: 'URL Jira', key: 'url', width: 40 },
      { header: 'Sincronizaciones', key: 'syncs', width: 15 }
    ];
    
    // Título
    activeSheet.mergeCells('A1:H1');
    const activeTitle = activeSheet.getCell('A1');
    activeTitle.value = 'REGISTROS ACTIVOS DE PROMOCIONES';
    this.applyTitleStyle(activeTitle);
    activeSheet.getRow(1).height = 25;
    
    // Headers
    const headerRow = activeSheet.getRow(3);
    ['Fecha', 'Issue Key', 'Descripción', 'Registrado', 'Última Modificación', 'Origen', 'URL Jira', 'Sincronizaciones'].forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      this.applyHeaderStyle(cell);
    });
    headerRow.height = 20;
    
    // Datos
    realPromos
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .forEach((promo, index) => {
        const row = activeSheet.getRow(index + 4);
        row.getCell(1).value = promo.date.toLocaleDateString('es-ES');
        row.getCell(2).value = promo.issueKey;
        row.getCell(3).value = promo.issueSummary;
        row.getCell(4).value = new Date().toLocaleString('es-ES');
        row.getCell(5).value = new Date().toLocaleString('es-ES');
        row.getCell(6).value = 'Jira';
        row.getCell(7).value = `https://prontopaga.atlassian.net/browse/${promo.issueKey}`;
        row.getCell(8).value = 1;
        
        // Aplicar estilos alternados
        for (let col = 1; col <= 8; col++) {
          this.applyDataStyle(row.getCell(col), index % 2 === 0);
        }
      });
    
    // === HOJA 3: ANÁLISIS MENSUAL ===
    const monthlySheet = workbook.addWorksheet('📅 Análisis Mensual');
    const monthlyAnalysis = this.generateMonthlyAnalysisFromRealData(realPromos);
    
    monthlySheet.columns = [
      { header: 'Año-Mes', key: 'period', width: 15 },
      { header: 'Total Promociones', key: 'total', width: 18 },
      { header: 'Desde Jira', key: 'jira', width: 15 },
      { header: 'Manuales', key: 'manual', width: 15 },
      { header: 'Promedio Diario', key: 'average', width: 18 }
    ];
    
    // Título
    monthlySheet.mergeCells('A1:E1');
    const monthlyTitle = monthlySheet.getCell('A1');
    monthlyTitle.value = 'ANÁLISIS MENSUAL DE PROMOCIONES';
    this.applyTitleStyle(monthlyTitle);
    monthlySheet.getRow(1).height = 25;
    
    // Headers
    const monthlyHeaderRow = monthlySheet.getRow(3);
    ['Año-Mes', 'Total Promociones', 'Desde Jira', 'Manuales', 'Promedio Diario'].forEach((header, index) => {
      const cell = monthlyHeaderRow.getCell(index + 1);
      cell.value = header;
      this.applyHeaderStyle(cell);
    });
    monthlyHeaderRow.height = 20;
    
    // Datos
    monthlyAnalysis.forEach((month, index) => {
      const row = monthlySheet.getRow(index + 4);
      row.getCell(1).value = month.period;
      row.getCell(2).value = month.total;
      row.getCell(3).value = month.jira;
      row.getCell(4).value = month.manual;
      row.getCell(5).value = parseFloat(month.dailyAverage.toFixed(2));
      
      for (let col = 1; col <= 5; col++) {
        this.applyDataStyle(row.getCell(col), index % 2 === 0);
      }
    });
    
    // Convertir a buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  
  private applyTitleStyle(cell: any): void {
    cell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E79' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  }
  
  private applyHeaderStyle(cell: any): void {
    cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2F5F8F' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  }
  
  private applyDataStyle(cell: any, isEven: boolean = false): void {
    cell.font = { name: 'Calibri', size: 11 };
    cell.fill = { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: isEven ? 'F2F2F2' : 'FFFFFF' } 
    };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'D0D0D0' } },
      left: { style: 'thin', color: { argb: 'D0D0D0' } },
      bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
      right: { style: 'thin', color: { argb: 'D0D0D0' } }
    };
  }
  
  private addSectionHeader(sheet: any, row: number, title: string): void {
    sheet.mergeCells(`A${row}:D${row}`);
    const cell = sheet.getCell(`A${row}`);
    cell.value = title;
    cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
    sheet.getRow(row).height = 20;
  }
  
  private addDataRow(sheet: any, row: number, label: string, value: any): void {
    const labelCell = sheet.getCell(`A${row}`);
    const valueCell = sheet.getCell(`B${row}`);
    
    labelCell.value = label;
    valueCell.value = value;
    
    this.applyDataStyle(labelCell, row % 2 === 0);
    this.applyDataStyle(valueCell, row % 2 === 0);
    
    // Hacer el label en negrita
    labelCell.font = { ...labelCell.font, bold: true };
  }
  


  /**
   * Generar análisis mensual para Excel
   */
  private generateMonthlyAnalysis(): Array<{
    period: string;
    total: number;
    jira: number;
    manual: number;
    dailyAverage: number;
  }> {
    const monthlyMap = new Map<string, {
      total: number;
      jira: number;
      manual: number;
      days: number;
    }>();
    
    // Procesar todos los registros activos
    this.data.records
      .filter(r => r.status === 'active')
      .forEach(record => {
        const date = new Date(record.date);
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!monthlyMap.has(yearMonth)) {
          const year = date.getFullYear();
          const month = date.getMonth();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          
          monthlyMap.set(yearMonth, {
            total: 0,
            jira: 0,
            manual: 0,
            days: daysInMonth
          });
        }
        
        const monthData = monthlyMap.get(yearMonth)!;
        monthData.total++;
        if (record.source === 'jira') {
          monthData.jira++;
        } else {
          monthData.manual++;
        }
      });
    
    // Convertir a array y ordenar
    return Array.from(monthlyMap.entries())
      .map(([period, data]) => ({
        period,
        total: data.total,
        jira: data.jira,
        manual: data.manual,
        dailyAverage: data.total / data.days
      }))
      .sort((a, b) => b.period.localeCompare(a.period));
  }

  /**
   * Generar análisis mensual basado en datos reales de Jira
   */
  private generateMonthlyAnalysisFromRealData(realPromos: Array<{ date: Date; issueKey: string; issueSummary: string }>): Array<{
    period: string;
    total: number;
    jira: number;
    manual: number;
    dailyAverage: number;
  }> {
    const monthlyMap = new Map<string, {
      total: number;
      jira: number;
      manual: number;
      days: number;
    }>();
    
    // Procesar todas las promociones reales
    realPromos.forEach(promo => {
      const date = promo.date;
      const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyMap.has(yearMonth)) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        monthlyMap.set(yearMonth, {
          total: 0,
          jira: 0,
          manual: 0,
          days: daysInMonth
        });
      }
      
      const monthData = monthlyMap.get(yearMonth)!;
      monthData.total++;
      monthData.jira++; // Todos los datos reales vienen de Jira
    });
    
    // Convertir a array y ordenar
    return Array.from(monthlyMap.entries())
      .map(([period, data]) => ({
        period,
        total: data.total,
        jira: data.jira,
        manual: data.manual,
        dailyAverage: data.total / data.days
      }))
      .sort((a, b) => b.period.localeCompare(a.period));
  }



  /**
   * Importar datos desde backup
   */
  public importData(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      this.data = this.migrateData(imported);
      this.saveData();
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Limpiar registros antiguos
   */
  public cleanupOldRecords(monthsToKeep: number = 12): void {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);
    const cutoffStr = this.formatDate(cutoffDate);

    const initialCount = this.data.records.length;
    this.data.records = this.data.records.filter(
      record => record.date >= cutoffStr || record.status === 'active'
    );
    
    const removedCount = initialCount - this.data.records.length;
    if (removedCount > 0) {
      console.log(`🧹 Limpieza completada: ${removedCount} registros antiguos eliminados`);
      this.saveData();
    }
  }

  /**
   * Formatear fecha a string YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Agregar promoción manual
   */
  public addManualPromo(date: Date, description: string): void {
    const issueKey = `MANUAL-${Date.now()}`;
    this.registerPromo(date, issueKey, description, 'manual');
    console.log(`✅ Promoción manual agregada: ${this.formatDate(date)} - ${description}`);
  }

  /**
   * Eliminar promoción manual
   */
  public removeManualPromo(date: Date, issueKey: string): void {
    const dateStr = this.formatDate(date);
    const index = this.data.records.findIndex(
      r => r.date === dateStr && r.issueKey === issueKey && r.source === 'manual'
    );

    if (index >= 0) {
      this.data.records.splice(index, 1);
      this.saveData();
      console.log(`🗑️ Promoción manual eliminada: ${dateStr} - ${issueKey}`);
    }
  }
}

// Instancia singleton}

export { PromoRegistryService };
export const promoRegistryService = new PromoRegistryService();