/**
 * What-If Business Simulator Service
 * Simulates commercial pricing and purchasing decisions without modifying any database records.
 * Uses price elasticity of demand modeling to estimate sales quantity, revenue, gross profit, and margin delta.
 */

// Price elasticity of demand by grocery department
const CATEGORY_ELASTICITY = {
  'DAL / பருப்பு வகைகள்': -0.75, // Inelastic staple
  'RICE / அரிசி வகைகள்': -0.65, // Highly inelastic daily necessity
  'MILLETS / சிறுதானியங்கள்': -0.95,
  'FLOURS / மாவு வகைகள்': -0.80,
  'SPICES / மசாலா பொருட்கள்': -0.70,
  'SPICE POWDERS / மசாலா பொடிகள்': -0.85,
  'OIL / எண்ணெய் வகைகள்': -0.80,
  'SUGAR & SWEETENERS / சர்க்கரை வகைகள்': -0.70,
  'SALT / உப்பு': -0.30, // Extremely inelastic
  'VEGETABLES / காய்கறிகள்': -1.10,
  'FRUITS / பழங்கள்': -1.25, // Elastic
  'TEA & COFFEE / தேயிலை & காபி': -0.90,
  'SNACKS / தின்பண்டங்கள்': -1.40, // Highly elastic discretionary purchase
  'DAIRY / பால் பொருட்கள்': -0.85,
  'HOUSEHOLD / வீட்டு உபயோகப் பொருட்கள்': -1.05
};

class SimulationService {
  /**
   * Run what-if scenario simulation
   * @param {Object} scenario - Simulation parameters
   * @param {Array} products - Store products
   * @param {Array} sales - Historical sales records
   * @returns {Object} Simulation comparison and financial impact
   */
  simulate(scenario = {}, products = [], sales = []) {
    const productId = scenario.productId;
    const productName = scenario.productName;
    const newSellingPrice = scenario.newSellingPrice !== undefined ? scenario.newSellingPrice : scenario.newPrice;
    const discountPercentage = scenario.discountPercentage !== undefined ? scenario.discountPercentage : (scenario.newDiscountPercent || 0);
    const purchaseQuantity = scenario.purchaseQuantity !== undefined ? scenario.purchaseQuantity : scenario.newPurchaseQuantity;
    const newPurchaseCost = scenario.newPurchaseCost !== undefined ? scenario.newPurchaseCost : scenario.newCostPrice;

    if (!productId && !productName) {
      throw new Error('Please select a product or enter product name to simulate');
    }

    const product = products.find(p => 
      (productId && String(p._id) === String(productId)) ||
      (productName && (
        (p.name && p.name.toLowerCase().includes(productName.toLowerCase())) ||
        (p.nameEnglish && p.nameEnglish.toLowerCase().includes(productName.toLowerCase())) ||
        (p.nameTamil && p.nameTamil.toLowerCase().includes(productName.toLowerCase()))
      ))
    );
    if (!product) {
      throw new Error('Selected product not found in inventory');
    }

    const prodIdStr = String(product._id);
    const prodNameLower = (product.name || '').toLowerCase();

    // 1. Gather historical sales for baseline
    const productSales = sales.filter(s => {
      const sProdId = s.productId ? String(s.productId) : null;
      const sNameLower = (s.productName || '').toLowerCase();
      return (sProdId && sProdId === prodIdStr) || (sNameLower && sNameLower === prodNameLower);
    });

    // Check sufficiency of historical data
    // Rule: Requires at least 2 sales records to establish a reliable baseline
    if (productSales.length < 2) {
      return {
        hasSufficientData: false,
        product: {
          _id: product._id,
          name: product.name,
          currentStock: product.currentStock,
          unit: product.unit || 'kg',
          currentPrice: product.sellingPrice,
          currentCost: product.averageCost
        },
        message: 'Insufficient historical data for accurate simulation.',
        explanation: `This product has only ${productSales.length} recorded sale(s). A minimum of 2 historical sales transactions is required to calculate price elasticity and baseline demand.`
      };
    }

    // 2. Compute Baseline Metrics (per 30-day period or actual span)
    const baseUnitCost = Number(product.averageCost) || 0;
    const baseSellingPrice = Number(product.sellingPrice) || 0;

    const totalSoldQty = productSales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    const totalRevenue = productSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const totalCogs = productSales.reduce((sum, s) => sum + (Number(s.costOfGoodsSold) || (Number(s.quantity) * baseUnitCost)), 0);
    const totalProfit = Math.max(0, totalRevenue - totalCogs);

    // Approximate 30-day baseline sales volume
    const baselineMonthlyQty = Math.max(1, Math.round((totalSoldQty / Math.max(1, productSales.length)) * 10 * 10) / 10);
    const baselineRevenue = Math.round(baselineMonthlyQty * baseSellingPrice * 100) / 100;
    const baselineCost = Math.round(baselineMonthlyQty * baseUnitCost * 100) / 100;
    const baselineGrossProfit = Math.round((baselineRevenue - baselineCost) * 100) / 100;
    const baselineMargin = baselineRevenue > 0 ? Math.round((baselineGrossProfit / baselineRevenue) * 1000) / 10 : 0;

    // 3. New Scenario Parameters
    const simPrice = newSellingPrice !== undefined && newSellingPrice !== null && !isNaN(newSellingPrice)
      ? Number(newSellingPrice)
      : baseSellingPrice;

    const simDiscount = Math.min(100, Math.max(0, Number(discountPercentage) || 0));

    const simUnitCost = newPurchaseCost !== undefined && newPurchaseCost !== null && !isNaN(newPurchaseCost)
      ? Number(newPurchaseCost)
      : baseUnitCost;

    // 4. Elasticity Modeling
    // Elasticity: % Change in Quantity = Elasticity * % Change in Effective Price
    const elasticity = CATEGORY_ELASTICITY[product.category] || -0.9;

    // Effective price after proposed discount
    const effectiveNewPrice = Math.max(0.1, simPrice * (1 - simDiscount / 100));

    // Price change percentage compared to baseline
    const priceChangeRatio = baseSellingPrice > 0 ? (effectiveNewPrice - baseSellingPrice) / baseSellingPrice : 0;

    // Estimated new quantity demanded based on elasticity
    const expectedQtyChangeFactor = 1 + (elasticity * priceChangeRatio);
    const estimatedNewQty = Math.max(0.1, Math.round(baselineMonthlyQty * Math.max(0.2, Math.min(3.0, expectedQtyChangeFactor)) * 10) / 10);

    // 5. Simulated Financial Outputs
    const simulatedRevenue = Math.round(estimatedNewQty * effectiveNewPrice * 100) / 100;
    const simulatedCost = Math.round(estimatedNewQty * simUnitCost * 100) / 100;
    const simulatedGrossProfit = Math.round((simulatedRevenue - simulatedCost) * 100) / 100;
    const simulatedMargin = simulatedRevenue > 0 ? Math.round((simulatedGrossProfit / simulatedRevenue) * 1000) / 10 : 0;

    // 6. Impact Comparison Deltas
    const profitImpact = Math.round((simulatedGrossProfit - baselineGrossProfit) * 100) / 100;
    const revenueImpact = Math.round((simulatedRevenue - baselineRevenue) * 100) / 100;
    const marginImpact = Math.round((simulatedMargin - baselineMargin) * 10) / 10;
    const qtyChange = Math.round((estimatedNewQty - baselineMonthlyQty) * 10) / 10;

    let verdict = 'NEUTRAL';
    let summaryText = '';

    if (profitImpact > 0) {
      verdict = 'POSITIVE';
      summaryText = `Favorable Decision: The proposed scenario is estimated to increase gross profit by +₹${profitImpact.toLocaleString('en-IN')} (${profitImpact > 0 && baselineGrossProfit > 0 ? '+' + Math.round((profitImpact / baselineGrossProfit) * 100) + '%' : 'profit expansion'}).`;
    } else if (profitImpact < 0) {
      verdict = 'NEGATIVE';
      summaryText = `Margin Warning: The proposed scenario is estimated to decrease gross profit by -₹${Math.abs(profitImpact).toLocaleString('en-IN')}. Price elasticity or discount is too aggressive for current cost structure.`;
    } else {
      verdict = 'NEUTRAL';
      summaryText = 'Neutral Impact: Projected profit outcome remains identical to the baseline.';
    }

    return {
      hasSufficientData: true,
      product: {
        _id: product._id,
        name: product.name,
        nameTamil: product.nameTamil,
        nameEnglish: product.nameEnglish,
        category: product.category,
        unit: product.unit || 'kg',
        currentStock: Number(product.currentStock) || 0
      },
      baseline: {
        sellingPrice: baseSellingPrice,
        unitCost: baseUnitCost,
        estimatedMonthlySales: baselineMonthlyQty,
        revenue: baselineRevenue,
        cost: baselineCost,
        grossProfit: baselineGrossProfit,
        profitMargin: baselineMargin
      },
      simulation: {
        newSellingPrice: simPrice,
        discountPercentage: simDiscount,
        effectivePrice: Math.round(effectiveNewPrice * 100) / 100,
        newUnitCost: simUnitCost,
        estimatedSalesQty: estimatedNewQty,
        revenue: simulatedRevenue,
        cost: simulatedCost,
        grossProfit: simulatedGrossProfit,
        profitMargin: simulatedMargin,
        purchaseQuantityProposed: purchaseQuantity !== null ? Number(purchaseQuantity) : null
      },
      impact: {
        profitDelta: profitImpact,
        revenueDelta: revenueImpact,
        marginDelta: marginImpact,
        quantityDelta: qtyChange,
        verdict,
        summaryText
      },
      modelAssumptions: {
        elasticityApplied: elasticity,
        category: product.category,
        disclaimer: 'This is a simulation model grounded in microeconomic price elasticity. Real-world sales, product prices, stock, and accounting ledgers have NOT been modified.'
      }
    };
  }
}

export const simulationService = new SimulationService();
export default simulationService;
