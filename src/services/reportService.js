import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEMO_SALES_KEY = 'tb_sa_demo_sales';

function getLocalSales() {
  const stored = localStorage.getItem(DEMO_SALES_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { console.warn(e); }
  }
  return [];
}

export const reportService = {
  async getFinancialReport(period = 'today') {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let localSales = getLocalSales();

    if (!isSupabaseConfigured || !supabase) {
      let sales = localSales;
      if (period === 'today') {
        sales = sales.filter((s) => s.created_at && s.created_at.startsWith(todayStr));
      } else if (period === 'month') {
        sales = sales.filter((s) => s.created_at && s.created_at.startsWith(monthStr));
      }
      let totalOmset = 0;
      let totalCost = 0;
      let totalDiscount = 0;

      const paymentBreakdown = { CASH: 0, QRIS: 0, TRANSFER: 0, DEBIT: 0, CREDIT: 0 };
      const topProductsMap = {};
      let validTxCount = 0;

      sales.forEach((s) => {
        if (s.status === 'VOIDED') return;
        validTxCount++;
        const total = Number(s.total || 0);
        totalOmset += total;
        totalDiscount += Number(s.discount || 0);

        const method = s.payment_method || 'CASH';
        paymentBreakdown[method] = (paymentBreakdown[method] || 0) + total;

        if (Array.isArray(s.sale_items)) {
          s.sale_items.forEach((item) => {
            const qty = Number(item.quantity || 1);
            const cost = Number(item.cost_price || item.unit_price * 0.8 || 0);
            totalCost += cost * qty;

            const prodName = item.product?.name || item.name || 'Produk Material';
            topProductsMap[prodName] = (topProductsMap[prodName] || 0) + qty;
          });
        }
      });

      const grossProfit = Math.max(0, totalOmset - totalCost);
      const topProducts = Object.entries(topProductsMap)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      return {
        data: {
          totalOmset,
          totalCost,
          grossProfit,
          totalDiscount,
          transactionCount: validTxCount,
          paymentBreakdown,
          topProducts,
        },
        error: null,
      };
    }

    try {
      const { data: sales, error } = await supabase
        .from('sales')
        .select(`
          id,
          invoice_number,
          total,
          subtotal,
          discount,
          payment_method,
          status,
          created_at,
          sale_items(
            quantity,
            cost_price,
            unit_price,
            subtotal,
            product:products(name)
          )
        `)
        .neq('status', 'VOIDED')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase getFinancialReport error, falling back to local sales:', error);
      }

      // Merge local sales that are not in cloud
      const cloudInvoiceSet = new Set((sales || []).map((s) => s.invoice_number));
      const unsyncedSales = localSales.filter((s) => !cloudInvoiceSet.has(s.invoice_number) && s.status !== 'VOIDED');
      let combinedSales = [...unsyncedSales, ...(sales || [])];

      if (period === 'today') {
        combinedSales = combinedSales.filter((s) => s.created_at && s.created_at.startsWith(todayStr));
      } else if (period === 'month') {
        combinedSales = combinedSales.filter((s) => s.created_at && s.created_at.startsWith(monthStr));
      }

      let totalOmset = 0;
      let totalCost = 0;
      let totalDiscount = 0;
      let transactionCount = combinedSales.length;

      const paymentBreakdown = { CASH: 0, QRIS: 0, TRANSFER: 0, DEBIT: 0, CREDIT: 0 };
      const topProductsMap = {};

      combinedSales.forEach((s) => {
        const total = Number(s.total || 0);
        totalOmset += total;
        totalDiscount += Number(s.discount || 0);

        const method = s.payment_method || 'CASH';
        paymentBreakdown[method] = (paymentBreakdown[method] || 0) + total;

        if (Array.isArray(s.sale_items)) {
          s.sale_items.forEach((item) => {
            const qty = Number(item.quantity || 1);
            const cost = Number(item.cost_price || 0);
            totalCost += cost * qty;

            const prodName = item.product?.name || item.name || 'Produk Material';
            topProductsMap[prodName] = (topProductsMap[prodName] || 0) + qty;
          });
        }
      });

      const grossProfit = Math.max(0, totalOmset - totalCost);
      const topProducts = Object.entries(topProductsMap)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      return {
        data: {
          totalOmset,
          totalCost,
          grossProfit,
          totalDiscount,
          transactionCount,
          paymentBreakdown,
          topProducts,
        },
        error: null,
      };
    } catch (err) {
      console.warn('Exception in getFinancialReport, using local data:', err);
      return { data: null, error: err };
    }
  },
};

