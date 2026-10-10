/**
 * Unified Intelligence Orchestrator Service
 * Connects store data with all 5 intelligence modules and aggregates executive KPI cards.
 */

import store from './storeService.js';
import reorderService from './reorderService.js';
import expiryService from './expiryService.js';
import profitAnalysisService from './profitAnalysisService.js';
import simulationService from './simulationService.js';

class IntelligenceService {
  /**
   * Retrieves high-level intelligence summary cards for the Dashboard
   */
  async getSummary() {
    const products = await store.getProducts();
    const sales = await store.getSales();
    const purchases = await store.getPurchases();
    const expenses = await store.getExpenses();
    const orders = await store.getOrders();

    const reorderData = reorderService.getRecommendations(products, sales, orders);
    const expiryData = expiryService.getExpiryAlerts(products, purchases);
    const profitData = profitAnalysisService.analyze(products, sales, purchases, expenses, orders);

    // Top reorder-now items
    const reorderNowItems = reorderData.recommendations
      .filter(r => r.status === 'REORDER_NOW')
      .slice(0, 5);

    // Urgent expiring batches
    const urgentExpiringBatches = expiryData.batches
      .filter(b => b.status === 'EXPIRED' || b.status === 'URGENT')
      .slice(0, 5);

    // Top dead stock items
    const deadStockTop = profitData.deadStockItems
      .filter(d => d.status === 'DEAD_STOCK')
      .slice(0, 5);

    return {
      cards: {
        reorderNeeded: {
          title: 'Products to Reorder',
          icon: 'ShoppingBag',
          count: reorderData.summary.reorderNowCount,
          badgeText: `${reorderData.summary.reorderNowCount} Urgent`,
          color: '#ea580c',
          bgColor: '#fff7ed',
          description: 'Items below safety stock or lead-time threshold requiring wholesale purchase'
        },
        expiringSoon: {
          title: 'Expiring Soon / Urgent',
          icon: 'Clock',
          count: expiryData.summary.urgentCount + expiryData.summary.expiredCount,
          badgeText: `${expiryData.summary.urgentCount} Urgent, ${expiryData.summary.expiredCount} Expired`,
          color: '#dc2626',
          bgColor: '#fef2f2',
          description: 'Batches requiring immediate FEFO selling priority, clearance, or audit'
        },
        deadStock: {
          title: 'Dead Stock Items',
          icon: 'TrendingDown',
          count: profitData.summary.deadStockCount,
          badgeText: `₹${profitData.summary.totalTiedUpCapital.toLocaleString('en-IN')} Capital`,
          color: '#7c3aed',
          bgColor: '#f5f3ff',
          description: 'Stagnant products with zero recent sales locking operating cashflow'
        },
        profitOpportunity: {
          title: 'Profit Leak Opportunities',
          icon: 'DollarSign',
          count: profitData.profitLeaks.length,
          badgeText: `₹${profitData.summary.totalIdentifiedLeakImpact.toLocaleString('en-IN')} Est. Leak`,
          color: '#16a34a',
          bgColor: '#f0fdf4',
          description: 'Recoverable margins via combo bundles, overhead controls, and discount caps'
        }
      },
      preview: {
        reorderNowItems,
        urgentExpiringBatches,
        deadStockTop,
        totalIdentifiedLeakImpact: profitData.summary.totalIdentifiedLeakImpact
      }
    };
  }

  async getReorderRecommendations() {
    const products = await store.getProducts();
    const sales = await store.getSales();
    const orders = await store.getOrders();
    return reorderService.getRecommendations(products, sales, orders);
  }

  async getExpiryAlerts() {
    const products = await store.getProducts();
    const purchases = await store.getPurchases();
    return expiryService.getExpiryAlerts(products, purchases);
  }

  async getDeadStock() {
    const products = await store.getProducts();
    const sales = await store.getSales();
    const purchases = await store.getPurchases();
    const expenses = await store.getExpenses();
    const orders = await store.getOrders();
    const result = profitAnalysisService.analyze(products, sales, purchases, expenses, orders);
    return {
      deadStockItems: result.deadStockItems,
      summary: result.summary
    };
  }

  async getProfitAnalysis() {
    const products = await store.getProducts();
    const sales = await store.getSales();
    const purchases = await store.getPurchases();
    const expenses = await store.getExpenses();
    const orders = await store.getOrders();
    return profitAnalysisService.analyze(products, sales, purchases, expenses, orders);
  }

  async simulateWhatIf(scenario) {
    const products = await store.getProducts();
    const sales = await store.getSales();
    return simulationService.simulate(scenario, products, sales);
  }
}

export const intelligenceService = new IntelligenceService();
export default intelligenceService;
