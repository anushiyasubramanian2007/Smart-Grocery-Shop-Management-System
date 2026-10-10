/**
 * Smart Reorder Recommendation Service
 * Decision-support replenishment logic based on current stock, historical velocity, safety stock, and supplier lead time.
 * Calculates: Recommended Order Quantity = max(0, Target Run Demand + Safety Stock - Current Stock)
 */

class ReorderService {
  /**
   * Generates reorder recommendations for all products
   * @param {Array} products - Store products
   * @param {Array} sales - Historical sales records
   * @param {Array} orders - Historical orders
   * @returns {Object} Reorder recommendations and summary
   */
  getRecommendations(products = [], sales = [], orders = []) {
    const recommendations = [];
    let reorderNowCount = 0;
    let reorderSoonCount = 0;
    let noReorderCount = 0;

    for (const product of products) {
      const prodIdStr = String(product._id);
      const currentStock = Number(product.currentStock) || 0;
      const avgCost = Number(product.averageCost) || 0;
      const unit = product.unit || 'kg';
      const supplier = product.supplier || 'Local Wholesale Mandi';

      // Check product sales across recent records
      const prodSales = sales.filter(s => {
        const sProdId = s.productId ? String(s.productId) : null;
        const sNameLower = (s.productName || '').toLowerCase();
        return (sProdId && sProdId === prodIdStr) || (sNameLower && sNameLower === (product.name || '').toLowerCase());
      });

      const totalSold = prodSales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
      let dailyRate = 0;
      let targetDemand = 0;
      const hasSalesData = prodSales.length >= 2 && totalSold > 0;

      if (hasSalesData) {
        dailyRate = Math.round((totalSold / 30) * 100) / 100;
        targetDemand = Math.round(dailyRate * 7 * 10) / 10;
      } else {
        // Safe operational fallback based on configured minimum stock
        const minStock = Number(product.minimumStock) || 5;
        dailyRate = Math.max(0.5, Math.round((minStock / 7) * 10) / 10);
        targetDemand = Math.round(dailyRate * 7 * 10) / 10;
      }

      // Safety stock: product.minimumStock (default 5) or 2 days buffer
      const safetyStock = Math.max(Number(product.minimumStock) || 5, Math.round(dailyRate * 2 * 10) / 10);

      // Supplier lead time (days required for delivery, default 2 days)
      const leadTimeDays = 2;
      const leadTimeDemand = Math.round(dailyRate * leadTimeDays * 10) / 10;

      // FORMULA: Recommended Order Quantity = max(0, Target Demand + Safety Stock - Current Stock)
      const rawReorderQty = targetDemand + safetyStock - currentStock;
      const recommendedOrderQuantity = Math.max(0, Math.round(rawReorderQty * 10) / 10);

      // Reorder Status Determination
      let status = 'NO_REORDER_REQUIRED';
      let priority = 3;
      let reason = '';

      if (currentStock <= safetyStock || currentStock <= leadTimeDemand) {
        status = 'REORDER_NOW';
        priority = 1;
        reorderNowCount++;
        reason = `Critical stock level: Available stock (${currentStock} ${unit}) is below safety threshold (${safetyStock} ${unit}). Lead time demand is ${leadTimeDemand} ${unit}. Recommended order: ${recommendedOrderQuantity} ${unit}.`;
      } else if (recommendedOrderQuantity > 0 && currentStock < (targetDemand + safetyStock) * 0.85) {
        status = 'REORDER_SOON';
        priority = 2;
        reorderSoonCount++;
        reason = `Approaching replenishment: Stock (${currentStock} ${unit}) will not comfortably sustain run demand (${targetDemand} ${unit}) plus safety reserve (${safetyStock} ${unit}).`;
      } else {
        status = 'NO_REORDER_REQUIRED';
        priority = 3;
        noReorderCount++;
        reason = `Sufficient stock: Current inventory of ${currentStock} ${unit} comfortably covers run demand (${targetDemand} ${unit}) and safety stock (${safetyStock} ${unit}).`;
      }

      // Estimated purchase capital needed
      const estimatedPurchaseCost = Math.round(recommendedOrderQuantity * avgCost * 100) / 100;

      recommendations.push({
        productId: product._id,
        productName: product.name,
        nameTamil: product.nameTamil,
        nameEnglish: product.nameEnglish,
        category: product.category,
        unit,
        currentStock,
        predictedDemand: targetDemand,
        safetyStock,
        averageDailySales: dailyRate,
        supplierLeadTimeDays: leadTimeDays,
        recommendedOrderQuantity,
        estimatedUnitCost: avgCost,
        estimatedPurchaseCost,
        supplier,
        status, // 'REORDER_NOW' | 'REORDER_SOON' | 'NO_REORDER_REQUIRED'
        priority,
        reason,
        hasSufficientData: hasSalesData
      });
    }

    // Sort: REORDER_NOW first, then REORDER_SOON, then recommended quantity descending
    recommendations.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.recommendedOrderQuantity - a.recommendedOrderQuantity;
    });

    return {
      recommendations,
      summary: {
        totalProducts: products.length,
        reorderNowCount,
        reorderSoonCount,
        noReorderCount,
        estimatedTotalReorderCost: Math.round(recommendations.reduce((sum, r) => sum + r.estimatedPurchaseCost, 0) * 100) / 100
      }
    };
  }
}

export const reorderService = new ReorderService();
export default reorderService;
