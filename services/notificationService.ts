import { supabase } from './supabaseClient';
import { Product, Sale, Client } from '../types';

const NOTIFICATION_THRESHOLD_LARGE_SALE = 200; // S/ 200
const NOTIFICATION_EXPIRING_DAYS = 30; // 30 days

/**
 * Creates a notification if a product's stock is low and no unread notification for it exists.
 * @param product The product object after its stock has been updated.
 */
export const createStockNotification = async (product: Product, sedeId: number, empresaId: number): Promise<void> => {
    if (product.stock_unid === null || product.stock_min === null || product.stock_unid > product.stock_min) {
        return;
    }

    try {
        // Check for existing unread notification for this product
        const { count } = await supabase
            .from('notificaciones')
            .select('id', { count: 'exact', head: true })
            .eq('tipo', 'stock_bajo')
            .eq('referencia_id', product.id)
            .eq('estado', 'no leido')
            .eq('sede_id', sedeId);

        if (count === 0) {
            const mensaje = `¡Stock bajo! El producto "${product.nombre}" solo tiene ${product.stock_unid} unidades restantes.`;
            await supabase.from('notificaciones').insert({
                tipo: 'stock_bajo',
                mensaje,
                estado: 'no leido',
                referencia_id: product.id,
                sede_id: sedeId,
                empresa_id: empresaId,
            });
        }
    } catch (error) {
        console.error("Error creating stock notification:", error);
    }
};

/**
 * Creates a notification for a large sale if it exceeds a predefined threshold.
 * @param sale The completed sale object.
 */
export const createLargeSaleNotification = async (sale: Sale, sedeId: number, empresaId: number): Promise<void> => {
    if (sale.total_a_pagar === null || sale.total_a_pagar < NOTIFICATION_THRESHOLD_LARGE_SALE) {
        return;
    }

    try {
         // Check for existing unread notification for this sale
        const { count } = await supabase
            .from('notificaciones')
            .select('id', { count: 'exact', head: true })
            .eq('tipo', 'venta_grande')
            .eq('referencia_id', sale.id)
            .eq('estado', 'no leido')
            .eq('sede_id', sedeId);

        if (count === 0) {
            const mensaje = `¡Venta grande registrada! Venta N°${sale.id} por un total de S/ ${sale.total_a_pagar.toFixed(2)}.`;
            await supabase.from('notificaciones').insert({
                tipo: 'venta_grande',
                mensaje,
                estado: 'no leido',
                referencia_id: sale.id,
                sede_id: sedeId,
                empresa_id: empresaId,
            });
        }
    } catch (error) {
        console.error("Error creating large sale notification:", error);
    }
};

/**
 * Creates a notification when a new client is registered.
 * @param client The newly created client object.
 */
export const createNewClientNotification = async (client: Client, sedeId: number, empresaId: number): Promise<void> => {
    try {
        const { count } = await supabase
            .from('notificaciones')
            .select('id', { count: 'exact', head: true })
            .eq('tipo', 'nuevo_cliente')
            .eq('referencia_id', client.id)
            .eq('estado', 'no leido')
            .eq('sede_id', sedeId);
        
        if (count === 0) {
            const mensaje = `Nuevo cliente registrado: ${client.nombres}. ¡Dale la bienvenida!`;
            await supabase.from('notificaciones').insert({
                tipo: 'nuevo_cliente',
                mensaje,
                estado: 'no leido',
                referencia_id: client.id,
                sede_id: sedeId,
                empresa_id: empresaId,
            });
        }
    } catch (error) {
        console.error("Error creating new client notification:", error);
    }
};

/**
 * Scans for products that are expired or expiring soon and creates notifications if they don't already have one.
 */
export const checkProductExpirations = async (sedeId: number, empresaId: number): Promise<void> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        const limitDate = new Date();
        limitDate.setDate(today.getDate() + NOTIFICATION_EXPIRING_DAYS);
        const limitDateStr = limitDate.toISOString().split('T')[0];

        // Fetch all products that have an expiration date in the past or within the next 30 days for the current branch.
        const { data: relevantProducts, error } = await supabase
            .from('productos')
            .select('id, nombre, f_vencimiento')
            .eq('sede_id', sedeId)
            .not('f_vencimiento', 'is', null)
            .lte('f_vencimiento', limitDateStr);

        if (error) throw error;
        if (!relevantProducts || relevantProducts.length === 0) return;

        // Get existing unread notifications for expiring and expired products to avoid duplicates
        const productIds = relevantProducts.map(p => p.id);
        const { data: existingNotifications } = await supabase
            .from('notificaciones')
            .select('referencia_id, tipo')
            .eq('estado', 'no leido')
            .eq('sede_id', sedeId)
            .in('tipo', ['vencimiento_proximo', 'producto_vencido'])
            .in('referencia_id', productIds);

        const notifiedProductIds = new Set(existingNotifications?.map(n => `${n.tipo}-${n.referencia_id}`));

        const notificationsToCreate: any[] = [];
        
        for (const p of relevantProducts) {
            const vencimiento = new Date(p.f_vencimiento + 'T00:00:00'); // Ensure correct date parsing
            const isExpired = vencimiento < today;

            if (isExpired) {
                // Handle expired products
                if (!notifiedProductIds.has(`producto_vencido-${p.id}`)) {
                    const mensaje = `¡Producto vencido! "${p.nombre}" expiró el ${vencimiento.toLocaleDateString('es-PE')}. Retirar de stock.`;
                    notificationsToCreate.push({
                        tipo: 'producto_vencido',
                        mensaje,
                        estado: 'no leido',
                        referencia_id: p.id,
                        sede_id: sedeId,
                        empresa_id: empresaId,
                    });
                }
            } else {
                // Handle soon-to-expire products
                 if (!notifiedProductIds.has(`vencimiento_proximo-${p.id}`)) {
                    const diffDays = Math.ceil((vencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const mensaje = `El producto "${p.nombre}" vence en ${diffDays} día(s).`;
                    notificationsToCreate.push({
                        tipo: 'vencimiento_proximo',
                        mensaje,
                        estado: 'no leido',
                        referencia_id: p.id,
                        sede_id: sedeId,
                        empresa_id: empresaId,
                    });
                }
            }
        }

        if (notificationsToCreate.length > 0) {
            await supabase.from('notificaciones').insert(notificationsToCreate);
        }

    } catch (error) {
        console.error("Error checking for product expirations:", error);
    }
};
