import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { debtService } from './debtService';

const DEMO_SALES_KEY = 'tb_sa_demo_sales';
const DEMO_PRODUCTS_KEY = 'tb_sa_demo_products';
const DEMO_PIUTANG_KEY = 'tb_sa_demo_piutang';
const DEMO_HUTANG_KEY = 'tb_sa_demo_hutang';

function getLocalSales() {
  const stored = localStorage.getItem(DEMO_SALES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse local sales:', e);
    }
  }
  return [];
}

function getLocalProducts() {
  const stored = localStorage.getItem(DEMO_PRODUCTS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse local products:', e);
    }
  }
  return [];
}

function getLocalPiutang() {
  const stored = localStorage.getItem(DEMO_PIUTANG_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse local piutang:', e);
    }
  }
  return [];
}

function getLocalHutang() {
  const stored = localStorage.getItem(DEMO_HUTANG_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse local hutang:', e);
    }
  }
  return [];
}

export const dashboardService = {
  /**
   * Mengambil seluruh data metriks dashboard secara komprehensif & realtime
   */
  async getDashboardRealtimeData() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Yesterday string YYYY-MM-DD
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Last 7 days labels and initial map
    const last7DaysMap = {};
    const last7DaysList = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
      last7DaysMap[dateKey] = { date: dateKey, label: dayName, sales: 0, count: 0, profit: 0 };
      last7DaysList.push(dateKey);
    }

    if (!isSupabaseConfigured) {
      const sales = getLocalSales();
      const products = getLocalProducts();
      const piutangList = getLocalPiutang();
      const hutangList = getLocalHutang();

      // Filter sales today & yesterday
      let todaySales = 0;
      let todayTxCount = 0;
      let todayTotalCost = 0;
      let yesterdaySales = 0;

      const topProductsMap = {};
      const recentTransactions = sales
        .filter((s) => s.status !== 'VOIDED')
        .slice(0, 7)
        .map((s) => ({
          id: s.id,
          invoice_number: s.invoice_number || `INV-${s.id}`,
          total: Number(s.total || 0),
          payment_method: s.payment_method || 'CASH',
          created_at: s.created_at,
          customer_name: s.customer?.name || 'Pelanggan Umum',
          item_count: Array.isArray(s.sale_items)
            ? s.sale_items.reduce((acc, it) => acc + Number(it.quantity || 1), 0)
            : 1,
        }));

      sales.forEach((s) => {
        if (s.status === 'VOIDED') return;
        const total = Number(s.total || 0);
        const saleDate = s.created_at ? s.created_at.split('T')[0] : '';

        // Check last 7 days
        if (saleDate && last7DaysMap[saleDate]) {
          last7DaysMap[saleDate].sales += total;
          last7DaysMap[saleDate].count += 1;
        }

        // Today metrics
        if (saleDate === todayStr) {
          todaySales += total;
          todayTxCount += 1;

          let saleCost = 0;
          if (Array.isArray(s.sale_items)) {
            s.sale_items.forEach((item) => {
              const qty = Number(item.quantity || 1);
              const cost = Number(item.cost_price || item.unit_price * 0.8 || 0);
              saleCost += cost * qty;

              const prodName = item.product?.name || item.name || 'Material Bangunan';
              if (!topProductsMap[prodName]) {
                topProductsMap[prodName] = {
                  name: prodName,
                  sold: 0,
                  revenue: 0,
                  category: item.category || 'Material',
                };
              }
              topProductsMap[prodName].sold += qty;
              topProductsMap[prodName].revenue += Number(item.unit_price || 0) * qty;
            });
          }
          todayTotalCost += saleCost;
        }

        // Yesterday metrics
        if (saleDate === yesterdayStr) {
          yesterdaySales += total;
        }
      });

      const todayProfit = Math.max(0, todaySales - todayTotalCost);

      // Comparison with yesterday
      let salesGrowthPercent = 0;
      if (yesterdaySales > 0) {
        salesGrowthPercent = Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100);
      } else if (todaySales > 0) {
        salesGrowthPercent = 100;
      }

      // Top Selling Products sorted by quantity sold
      const topProducts = Object.values(topProductsMap)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

      // Low Stock & Out of Stock Analysis
      const lowStockItems = [];
      let lowStockCount = 0;
      let outOfStockCount = 0;
      let totalInventoryValue = 0;

      products.forEach((p) => {
        const stock = Number(p.stock || 0);
        const minStock = Number(p.minimum_stock || 5);
        const costPrice = Number(p.cost_price || p.selling_price || 0);
        totalInventoryValue += stock * costPrice;

        if (stock <= 0) {
          outOfStockCount++;
          lowStockItems.push({
            id: p.id,
            name: p.name,
            sku: p.sku || '-',
            stock: 0,
            minStock: minStock,
            unit: p.unit || 'PCS',
            category: p.category_name || 'Material',
            status: 'OUT_OF_STOCK',
          });
        } else if (stock <= minStock) {
          lowStockCount++;
          lowStockItems.push({
            id: p.id,
            name: p.name,
            sku: p.sku || '-',
            stock: stock,
            minStock: minStock,
            unit: p.unit || 'PCS',
            category: p.category_name || 'Material',
            status: 'LOW_STOCK',
          });
        }
      });

      // Sort low stock by most critical
      lowStockItems.sort((a, b) => a.stock - b.stock);

      // Piutang pending
      const totalPiutangPending = piutangList
        .filter((p) => p.status !== 'PAID')
        .reduce((sum, it) => sum + Number(it.remaining_amount || 0), 0);

      // Hutang pending
      const totalHutangPending = hutangList
        .filter((h) => h.status !== 'PAID')
        .reduce((sum, it) => sum + Number(it.remaining_amount || 0), 0);

      // 7-day chart array
      const weeklyChartData = last7DaysList.map((key) => last7DaysMap[key]);

      return {
        data: {
          metrics: {
            todaySales,
            todayTxCount,
            todayProfit,
            todayProfitMargin: todaySales > 0 ? ((todayProfit / todaySales) * 100).toFixed(1) : '0',
            yesterdaySales,
            salesGrowthPercent,
            averageTicket: todayTxCount > 0 ? Math.round(todaySales / todayTxCount) : 0,
            totalProducts: products.length,
            lowStockCount,
            outOfStockCount,
            totalInventoryValue,
            totalPiutangPending,
            totalHutangPending,
          },
          topProducts,
          lowStockItems: lowStockItems.slice(0, 6),
          recentTransactions,
          weeklyChartData,
          lastUpdated: new Date().toISOString(),
        },
        error: null,
      };
    }

    // SUPABASE CLOUD IMPLEMENTATION
    try {
      const localSales = getLocalSales();

      // 1. Fetch Sales
      let cloudSales = [];
      try {
        const { data: sales, error: salesErr } = await supabase
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
            customer:customers(name),
            sale_items(
              quantity,
              cost_price,
              unit_price,
              subtotal,
              product:products(id, name, unit, category:categories(name))
            )
          `)
          .order('created_at', { ascending: false });

        if (!salesErr && sales) {
          cloudSales = sales;
        } else if (salesErr) {
          console.warn('Supabase dashboard sales fetch error:', salesErr);
        }
      } catch (e) {
        console.warn('Exception fetching sales from supabase:', e);
      }

      // Merge local sales that might not be in cloud
      const cloudInvoiceSet = new Set(cloudSales.map((s) => s.invoice_number));
      const unsyncedSales = localSales.filter((s) => !cloudInvoiceSet.has(s.invoice_number));
      const allSales = [...unsyncedSales, ...cloudSales];

      // 2. Fetch Products
      let products = [];
      try {
        const { data: prods, error: prodErr } = await supabase
          .from('products')
          .select('id, name, sku, stock, minimum_stock, unit, cost_price, selling_price, category:categories(name)')
          .eq('is_active', true);

        if (!prodErr && prods) {
          products = prods;
        } else {
          products = getLocalProducts();
        }
      } catch {
        products = getLocalProducts();
      }

      // 3. Fetch Piutang & Hutang
      let piutang = [];
      let hutang = [];
      try {
        const { data: piutangData } = await debtService.getPiutangList();
        const { data: hutangData } = await debtService.getHutangList();
        piutang = piutangData || getLocalPiutang();
        hutang = hutangData || getLocalHutang();
      } catch {
        piutang = getLocalPiutang();
        hutang = getLocalHutang();
      }

      let todaySales = 0;
      let todayTxCount = 0;
      let todayTotalCost = 0;
      let yesterdaySales = 0;
      const topProductsMap = {};

      const recentTransactions = allSales
        .filter((s) => s.status !== 'VOIDED')

        .slice(0, 7)
        .map((s) => ({
          id: s.id,
          invoice_number: s.invoice_number,
          total: Number(s.total || 0),
          payment_method: s.payment_method || 'CASH',
          created_at: s.created_at,
          customer_name: s.customer?.name || 'Pelanggan Umum',
          item_count: Array.isArray(s.sale_items)
            ? s.sale_items.reduce((acc, it) => acc + Number(it.quantity || 1), 0)
            : 1,
        }));

      allSales.forEach((s) => {
        if (s.status === 'VOIDED') return;
        const total = Number(s.total || 0);
        const saleDate = s.created_at ? s.created_at.split('T')[0] : '';

        // Last 7 days
        if (saleDate && last7DaysMap[saleDate]) {
          last7DaysMap[saleDate].sales += total;
          last7DaysMap[saleDate].count += 1;
        }

        // Today
        if (saleDate === todayStr) {
          todaySales += total;
          todayTxCount += 1;

          if (Array.isArray(s.sale_items)) {
            s.sale_items.forEach((item) => {
              const qty = Number(item.quantity || 1);
              const cost = Number(item.cost_price || 0);
              todayTotalCost += cost * qty;

              const prodName = item.product?.name || 'Produk Material';
              const catName = item.product?.category?.name || 'Material Bangunan';
              if (!topProductsMap[prodName]) {
                topProductsMap[prodName] = {
                  name: prodName,
                  sold: 0,
                  revenue: 0,
                  category: catName,
                };
              }
              topProductsMap[prodName].sold += qty;
              topProductsMap[prodName].revenue += Number(item.unit_price || 0) * qty;
            });
          }
        }

        // Yesterday
        if (saleDate === yesterdayStr) {
          yesterdaySales += total;
        }
      });

      const todayProfit = Math.max(0, todaySales - todayTotalCost);

      let salesGrowthPercent = 0;
      if (yesterdaySales > 0) {
        salesGrowthPercent = Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100);
      } else if (todaySales > 0) {
        salesGrowthPercent = 100;
      }

      const topProducts = Object.values(topProductsMap)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

      const lowStockItems = [];
      let lowStockCount = 0;
      let outOfStockCount = 0;
      let totalInventoryValue = 0;

      (products || []).forEach((p) => {
        const stock = Number(p.stock || 0);
        const minStock = Number(p.minimum_stock || 5);
        const costPrice = Number(p.cost_price || p.selling_price || 0);
        totalInventoryValue += stock * costPrice;

        if (stock <= 0) {
          outOfStockCount++;
          lowStockItems.push({
            id: p.id,
            name: p.name,
            sku: p.sku || '-',
            stock: 0,
            minStock: minStock,
            unit: p.unit || 'PCS',
            category: p.category?.name || 'Material',
            status: 'OUT_OF_STOCK',
          });
        } else if (stock <= minStock) {
          lowStockCount++;
          lowStockItems.push({
            id: p.id,
            name: p.name,
            sku: p.sku || '-',
            stock: stock,
            minStock: minStock,
            unit: p.unit || 'PCS',
            category: p.category?.name || 'Material',
            status: 'LOW_STOCK',
          });
        }
      });

      lowStockItems.sort((a, b) => a.stock - b.stock);

      const totalPiutangPending = (piutang || [])
        .filter((p) => p.status !== 'PAID')
        .reduce((sum, it) => sum + Number(it.remaining_amount || 0), 0);

      const totalHutangPending = (hutang || [])
        .filter((h) => h.status !== 'PAID')
        .reduce((sum, it) => sum + Number(it.remaining_amount || 0), 0);

      const weeklyChartData = last7DaysList.map((key) => last7DaysMap[key]);

      return {
        data: {
          metrics: {
            todaySales,
            todayTxCount,
            todayProfit,
            todayProfitMargin: todaySales > 0 ? ((todayProfit / todaySales) * 100).toFixed(1) : '0',
            yesterdaySales,
            salesGrowthPercent,
            averageTicket: todayTxCount > 0 ? Math.round(todaySales / todayTxCount) : 0,
            totalProducts: (products || []).length,
            lowStockCount,
            outOfStockCount,
            totalInventoryValue,
            totalPiutangPending,
            totalHutangPending,
          },
          topProducts,
          lowStockItems: lowStockItems.slice(0, 6),
          recentTransactions,
          weeklyChartData,
          lastUpdated: new Date().toISOString(),
        },
        error: null,
      };
    } catch (err) {
      console.error('Error fetching realtime dashboard data:', err);
      return { data: null, error: err };
    }
  },
};
