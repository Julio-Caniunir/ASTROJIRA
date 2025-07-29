import type { APIRoute } from 'astro';
import { promoRegistryService } from '../../lib/promo-registry-service';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const action = searchParams.get('action');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const date = searchParams.get('date');

    switch (action) {
      case 'stats':
        return new Response(JSON.stringify({
          success: true,
          data: promoRegistryService.getStats()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'month':
        if (!year || !month) {
          return new Response(JSON.stringify({
            error: 'Year and month parameters are required'
          }), { status: 400 });
        }
        
        const monthPromos = promoRegistryService.getPromosForMonth(
          parseInt(year), 
          parseInt(month)
        );
        
        return new Response(JSON.stringify({
          success: true,
          data: monthPromos
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'date':
        if (!date) {
          return new Response(JSON.stringify({
            error: 'Date parameter is required'
          }), { status: 400 });
        }
        
        const datePromos = promoRegistryService.getPromosForDate(new Date(date));
        
        return new Response(JSON.stringify({
          success: true,
          data: datePromos
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'missing-days':
        if (!year || !month) {
          return new Response(JSON.stringify({
            error: 'Year and month parameters are required'
          }), { status: 400 });
        }
        
        const missingDays = promoRegistryService.getDaysWithoutPromos(
          parseInt(year), 
          parseInt(month)
        );
        
        return new Response(JSON.stringify({
          success: true,
          data: missingDays.map(d => d.toISOString().split('T')[0])
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'export':
        return new Response(JSON.stringify({
          success: true,
          data: promoRegistryService.exportData()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'export-data':
        const exportData = promoRegistryService.exportData();
        return new Response(exportData, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="promo-registry-backup-${new Date().toISOString().split('T')[0]}.json"`
          }
        });


      default:
        return new Response(JSON.stringify({
          error: 'Invalid action parameter'
        }), { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in promo-registry GET:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, date, issueKey, issueSummary, description, jsonData, clientData } = body;

    switch (action) {
      case 'export-global-stats-excel':
        try {
          console.log('🔥 API POST: Iniciando exportación de Excel con datos del cliente...');
          
          if (!clientData) {
            console.error('❌ API POST: No se recibieron datos del cliente');
            return new Response(JSON.stringify({ error: 'No se recibieron datos del cliente' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          console.log('📦 API POST: Datos del cliente recibidos, tamaño:', clientData.length, 'caracteres');
          
          // Crear una instancia temporal del servicio con los datos del cliente
           const { PromoRegistryService } = await import('../../lib/promo-registry-service');
           const tempService = new PromoRegistryService();
          
          // Importar los datos del cliente
          const success = tempService.importData(clientData);
          if (!success) {
            console.error('❌ API POST: Error importando datos del cliente');
            return new Response(JSON.stringify({ error: 'Error importando datos del cliente' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          console.log('✅ API POST: Datos del cliente importados correctamente');
          
          // Generar el Excel con los datos importados
          const excelBlob = await tempService.exportGlobalStatsToExcel();
          console.log('📊 API POST: Excel blob generado, tamaño:', excelBlob.size, 'bytes');
          
          const buffer = Buffer.from(await excelBlob.arrayBuffer());
          console.log('💾 API POST: Buffer creado, tamaño:', buffer.length, 'bytes');
          
          return new Response(buffer, {
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'Content-Disposition': `attachment; filename="estadisticas-globales-promociones-${new Date().toISOString().split('T')[0]}.xlsx"`
            }
          });
        } catch (error) {
          console.error('❌ API POST: Error exporting global stats to Excel:', error);
          return new Response(JSON.stringify({ error: 'Error al exportar estadísticas a Excel', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

      case 'register':
        if (!date || !issueKey || !issueSummary) {
          return new Response(JSON.stringify({
            error: 'Date, issueKey, and issueSummary are required'
          }), { status: 400 });
        }
        
        promoRegistryService.registerPromo(
          new Date(date), 
          issueKey, 
          issueSummary, 
          'jira'
        );
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Promo registered successfully'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'add-manual':
        if (!date || !description) {
          return new Response(JSON.stringify({
            error: 'Date and description are required'
          }), { status: 400 });
        }
        
        promoRegistryService.addManualPromo(new Date(date), description);
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Manual promo added successfully'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'remove-manual':
        if (!date || !issueKey) {
          return new Response(JSON.stringify({
            error: 'Date and issueKey are required'
          }), { status: 400 });
        }
        
        promoRegistryService.removeManualPromo(new Date(date), issueKey);
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Manual promo removed successfully'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'mark-deleted':
        if (!date || !issueKey) {
          return new Response(JSON.stringify({
            error: 'Date and issueKey are required'
          }), { status: 400 });
        }
        
        promoRegistryService.markPromoAsDeleted(new Date(date), issueKey);
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Promo marked as deleted successfully'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'sync-jira':
        // Este endpoint será llamado desde el frontend después de obtener datos de Jira
        const { jiraPromos } = body;
        if (!jiraPromos || !Array.isArray(jiraPromos)) {
          return new Response(JSON.stringify({
            error: 'jiraPromos array is required'
          }), { status: 400 });
        }
        
        const formattedPromos = jiraPromos.map((promo: any) => ({
          date: new Date(promo.date),
          issueKey: promo.issueKey,
          issueSummary: promo.issueSummary
        }));
        
        promoRegistryService.syncWithJiraData(formattedPromos);
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Sync with Jira completed successfully'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'import':
        if (!jsonData) {
          return new Response(JSON.stringify({
            error: 'jsonData is required'
          }), { status: 400 });
        }
        
        const importSuccess = promoRegistryService.importData(jsonData);
        
        return new Response(JSON.stringify({
          success: importSuccess,
          message: importSuccess ? 'Data imported successfully' : 'Failed to import data'
        }), {
          status: importSuccess ? 200 : 400,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'cleanup':
        const { monthsToKeep = 12 } = body;
        promoRegistryService.cleanupOldRecords(monthsToKeep);
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Cleanup completed successfully'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({
          error: 'Invalid action parameter'
        }), { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in promo-registry POST:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};