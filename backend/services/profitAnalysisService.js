/**
 * Profit Leak & Dead Stock Detection Service
 * Analyzes stagnant inventory, days without sale, margin compression, excessive discounts, and overhead drag.
 * Clearly labeled as decision-support estimates.
 */

class ProfitAnalysisService {
  /**
   * Run dead stock and profit leak audit
   * @param {Array} products - Store products
   * @param {Array} sales - Sales records
   * @param {Array} purchases - Wholesale purchase records
   * @param {Array} expenses - Store overhead expenses
   * @param {Array} orders - Customer POS orders
   * @returns {Object} Dead stock items, profit leak categories, and financial estimates
   */
  analyze(products = [], sales = [], purchases = [], expenses = [], orders = []) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. DEAD STOCK ANALYSIS
    const deadStockItems = [];
    let deadStockCount = 0;
    let slowMovingCount = 0;
    let activeCount = 0;
    let totalTiedUpCapital = 0;

    for (const product of products) {
      const currentStock = Number(product.currentStock) || 0;
      const avgCost = Number(product.averageCost) || 0;
      const unit = product.unit || 'kg';
      const tiedUpCapital = Math.round(currentStock * avgCost * 100) / 100;

      const prodIdStr = String(product._id);
      const prodNameLower = (product.name || '').toLowerCase();

      // Find all sales for this product
      const productSales = sales.filter(s => {
        const sProdId = s.productId ? String(s.productId) : null;
        const sNameLower = (s.productName || '').toLowerCase();
        return (sProdId && sProdId === prodIdStr) || (sNameLower && sNameLower === prodNameLower);
      });

      // Filter to sales in last 30 days
      const recentSales = productSales.filter(s => new Date(s.date || s.createdAt || now) >= thirtyDaysAgo);
      const soldInLast30Days = recentSales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
      const salesVelocity = Math.round((soldInLast30Days / 30) * 100) / 100;

      // Find last sale date
      let lastSaleDate = null;
      let daysWithoutSale = 30; // default to 30 if no sales

      if (productSales.length > 0) {
        const dates = productSales.map(s => new Date(s.date || s.createdAt || now).getTime());
        const maxDate = Math.max(...dates);
        lastSaleDate = new Date(maxDate);
        daysWithoutSale = Math.max(0, Math.floor((now.getTime() - maxDate) / (1000 * 60 * 60 * 24)));
      } else if (product.createdAt) {
        daysWithoutSale = Math.max(0, Math.floor((now.getTime() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
      }

      // Classification
      let status = 'ACTIVE';
      let priority = 3;
      let recommendations = [];

      if (currentStock > 0 && (soldInLast30Days === 0 || daysWithoutSale >= 21)) {
        status = 'DEAD_STOCK';
        priority = 1;
        deadStockCount++;
        totalTiedUpCapital += tiedUpCapital;
        recommendations = [
          'Create a promotional combo bundle with a high-velocity product',
          'Offer an immediate 15% discount to liquidate locked capital',
          'Reposition inventory to eye-level shelves or front entrance counter',
          'Halt all future wholesale purchases until current stock clears'
        ];
      } else if (currentStock > 0 && (daysWithoutSale >= 10 || salesVelocity < 0.2)) {
        status = 'SLOW_MOVING';
        priority = 2;
        slowMovingCount++;
        totalTiedUpCapital += tiedUpCapital;
        recommendations = [
          'Monitor sales closely over the next 7 days',
          'Offer minor bundle incentive (e.g., buy 2 get 5% off)',
          'Lower reorder quantity threshold by 50%'
        ];
      } else {
        status = 'ACTIVE';
        priority = 3;
        activeCount++;
        recommendations = ['Healthy inventory turnover. Maintain regular reorder schedules.'];
      }

      deadStockItems.push({
        productId: product._id,
        productName: product.name,
        nameTamil: product.nameTamil,
        nameEnglish: product.nameEnglish,
        category: product.category,
        unit,
        currentStock,
        averageCost: avgCost,
        sellingPrice: Number(product.sellingPrice) || 0,
        soldInLast30Days,
        daysWithoutSale,
        lastSaleDate: lastSaleDate ? lastSaleDate.toISOString().slice(0, 10) : 'Never',
        salesVelocity,
        tiedUpCapital,
        status, // 'DEAD_STOCK' | 'SLOW_MOVING' | 'ACTIVE'
        priority,
        recommendations
      });
    }

    // Sort dead stock items: DEAD_STOCK first, then by tiedUpCapital descending
    deadStockItems.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.tiedUpCapital - a.tiedUpCapital;
    });

    // 2. PROFIT LEAK ANALYSIS
    const profitLeaks = [];

    // Leak 1: Stagnant Capital in Dead Stock
    if (totalTiedUpCapital > 0) {
      // Estimated opportunity cost (assuming 1% monthly cost of carrying stagnant inventory)
      const estimatedHoldingLoss = Math.round(totalTiedUpCapital * 0.05);
      profitLeaks.push({
        category: 'Dead Stock Capital Lock',
        severity: totalTiedUpCapital > 10000 ? 'HIGH' : 'MEDIUM',
        estimatedImpact: totalTiedUpCapital,
        holdingCostEstimate: estimatedHoldingLoss,
        description: `₹${totalTiedUpCapital.toLocaleString('en-IN')} in working capital is currently trapped in ${deadStockCount} dead stock and ${slowMovingCount} slow-moving products.`,
        actionableAdvice: 'Run a clearance sale or bundle dead items with everyday staples to recover cash for high-demand restocks.'
      });
    }

    // Leak 2: Excessive Discounting in Customer Orders
    const ordersWithDiscount = orders.filter(o => Number(o.discount) > 0);
    const totalDiscountGiven = Math.round(ordersWithDiscount.reduce((sum, o) => sum + Number(o.discount), 0));
    if (totalDiscountGiven > 0) {
      profitLeaks.push({
        category: 'Excessive Discounting',
        severity: totalDiscountGiven > 1000 ? 'HIGH' : 'LOW',
        estimatedImpact: totalDiscountGiven,
        description: `Total of ₹${totalDiscountGiven.toLocaleString('en-IN')} in discounts granted across ${ordersWithDiscount.length} customer orders, directly reducing net margin.`,
        actionableAdvice: 'Cap ad-hoc discounts to a maximum of 5% and require minimum cart value thresholds before applying promotional deductions.'
      });
    }

    // Leak 3: Purchase Price vs Selling Price Margin Squeeze
    const marginSqueezedProducts = [];
    for (const prod of products) {
      const avgCost = Number(prod.averageCost) || 0;
      const sellingPrice = Number(prod.sellingPrice) || 0;
      if (sellingPrice > 0 && avgCost > 0) {
        const marginPercent = ((sellingPrice - avgCost) / sellingPrice) * 100;
        if (marginPercent < 5) {
          marginSqueezedProducts.push({
            name: prod.name,
            cost: avgCost,
            price: sellingPrice,
            marginPercent: Math.round(marginPercent * 10) / 10
          });
        }
      }
    }

    if (marginSqueezedProducts.length > 0) {
      profitLeaks.push({
        category: 'Purchase Cost Margin Squeeze',
        severity: 'HIGH',
        estimatedImpact: marginSqueezedProducts.length * 200, // estimated profit leakage per week
        affectedProducts: marginSqueezedProducts,
        description: `${marginSqueezedProducts.length} items have razor-thin profit margins below 5% due to rising wholesale purchase prices without retail price adjustment.`,
        actionableAdvice: 'Review and adjust retail selling prices upward to restore the configured profit margin target.'
      });
    }

    // Leak 4: High Operating Expense Ratio
    const totalSalesRevenue = sales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const totalExpensesAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    if (totalSalesRevenue > 0 && totalExpensesAmount > 0) {
      const expenseRatio = Math.round((totalExpensesAmount / totalSalesRevenue) * 100);
      if (expenseRatio > 25) {
        profitLeaks.push({
          category: 'High Operating Overhead Ratio',
          severity: 'MEDIUM',
          estimatedImpact: totalExpensesAmount,
          description: `Operating expenses represent ${expenseRatio}% of total store sales revenue (industry standard for retail groceries is under 15-20%).`,
          actionableAdvice: 'Audit electricity consumption (refrigeration compressors), delivery fuel expenses, and packaging material overhead.'
        });
      }
    }

    return {
      deadStockItems,
      profitLeaks,
      summary: {
        totalProducts: products.length,
        deadStockCount,
        slowMovingCount,
        activeCount,
        totalTiedUpCapital: Math.round(totalTiedUpCapital * 100) / 100,
        totalIdentifiedLeakImpact: Math.round(profitLeaks.reduce((sum, l) => sum + l.estimatedImpact, 0) * 100) / 100,
        disclaimer: 'All profit leak figures and dead stock classifications are decision-support estimates based on historical transaction logs, not guaranteed accounting write-offs.'
      }
    };
  }
}

export const profitAnalysisService = new ProfitAnalysisService();
export default profitAnalysisService;
