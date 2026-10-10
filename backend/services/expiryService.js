/**
 * Expiry & Batch Intelligence Service
 * Implements FEFO (First Expire, First Out) inventory management and expiry categorization.
 * Categories: SAFE (>30d), EXPIRING SOON (8-30d), URGENT (0-7d), EXPIRED (<0d).
 */

const CATEGORY_DEFAULT_SHELF_LIFE_DAYS = {
  'DAIRY / பால் பொருட்கள்': 7,
  'VEGETABLES / காய்கறிகள்': 5,
  'FRUITS / பழங்கள்': 7,
  'FLOURS / மாவு வகைகள்': 60,
  'SNACKS / தின்பண்டங்கள்': 45,
  'DAL / பருப்பு வகைகள்': 120,
  'RICE / அரிசி வகைகள்': 180,
  'MILLETS / சிறுதானியங்கள்': 120,
  'SPICES / மசாலா பொருட்கள்': 180,
  'SPICE POWDERS / மசாலா பொடிகள்': 120,
  'OIL / எண்ணெய் வகைகள்': 180,
  'SUGAR & SWEETENERS / சர்க்கரை வகைகள்': 365,
  'SALT / உப்பு': 730,
  'TEA & COFFEE / தேயிலை & காபி': 180,
  'HOUSEHOLD / வீட்டு உபயோகப் பொருட்கள்': 365
};

class ExpiryService {
  /**
   * Evaluates all product batches for expiry risk and FEFO ordering
   * @param {Array} products - Store products
   * @param {Array} purchases - Wholesale purchases
   * @returns {Object} Batch alerts, FEFO queue, and summary
   */
  getExpiryAlerts(products = [], purchases = []) {
    const now = new Date();
    const batches = [];

    let expiredCount = 0;
    let urgentCount = 0;
    let expiringSoonCount = 0;
    let safeCount = 0;

    // 1. Process explicit wholesale purchase batches
    for (const pur of purchases) {
      const prod = products.find(p =>
        (pur.productId && String(p._id) === String(pur.productId)) ||
        (p.name && p.name.toLowerCase() === (pur.productName || '').toLowerCase())
      );

      const batchNum = pur.batchNumber || pur.billNumber || `PUR-${String(pur._id).slice(-4)}`;
      const purchaseDate = pur.date ? new Date(pur.date) : (pur.createdAt ? new Date(pur.createdAt) : now);
      
      // Determine expiry date
      let expDate = null;
      if (pur.expiryDate) {
        expDate = new Date(pur.expiryDate);
      } else if (prod && prod.expiryDate) {
        expDate = new Date(prod.expiryDate);
      } else {
        const shelfDays = CATEGORY_DEFAULT_SHELF_LIFE_DAYS[prod?.category] || prod?.shelfLifeDays || 90;
        expDate = new Date(purchaseDate.getTime() + shelfDays * 24 * 60 * 60 * 1000);
      }

      const diffTime = expDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const remainingQty = pur.batchQuantity !== undefined && pur.batchQuantity !== null ? Number(pur.batchQuantity) : (prod ? Number(prod.currentStock) : Number(pur.quantity));

      const batchData = this._classifyBatch({
        batchId: pur._id,
        batchNumber: batchNum,
        productId: prod ? prod._id : pur.productId,
        productName: prod ? prod.name : pur.productName,
        nameTamil: prod ? prod.nameTamil : '',
        nameEnglish: prod ? prod.nameEnglish : pur.productName,
        category: prod ? prod.category : 'General',
        unit: pur.unit || (prod ? prod.unit : 'kg'),
        quantity: remainingQty,
        costPrice: Number(pur.purchasePricePerUnit) || (prod ? Number(prod.averageCost) : 0),
        purchaseDate,
        expiryDate: expDate,
        daysRemaining
      });

      if (batchData.status === 'EXPIRED') expiredCount++;
      else if (batchData.status === 'URGENT') urgentCount++;
      else if (batchData.status === 'EXPIRING_SOON') expiringSoonCount++;
      else safeCount++;

      batches.push(batchData);
    }

    // 2. Also ensure every active product has batch tracking (even if no purchase record exists yet)
    for (const prod of products) {
      const alreadyHasBatch = batches.some(b => String(b.productId) === String(prod._id));
      if (!alreadyHasBatch && Number(prod.currentStock) > 0) {
        const purchaseDate = prod.createdAt ? new Date(prod.createdAt) : now;
        let expDate = null;
        if (prod.expiryDate) {
          expDate = new Date(prod.expiryDate);
        } else {
          const shelfDays = CATEGORY_DEFAULT_SHELF_LIFE_DAYS[prod.category] || prod.shelfLifeDays || 90;
          expDate = new Date(purchaseDate.getTime() + shelfDays * 24 * 60 * 60 * 1000);
        }

        const diffTime = expDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const batchData = this._classifyBatch({
          batchId: `prod_batch_${prod._id}`,
          batchNumber: prod.batchNumber || `B-${String(prod._id).slice(-4)}`,
          productId: prod._id,
          productName: prod.name,
          nameTamil: prod.nameTamil,
          nameEnglish: prod.nameEnglish,
          category: prod.category,
          unit: prod.unit || 'kg',
          quantity: Number(prod.currentStock) || 0,
          costPrice: Number(prod.averageCost) || 0,
          purchaseDate,
          expiryDate: expDate,
          daysRemaining
        });

        if (batchData.status === 'EXPIRED') expiredCount++;
        else if (batchData.status === 'URGENT') urgentCount++;
        else if (batchData.status === 'EXPIRING_SOON') expiringSoonCount++;
        else safeCount++;

        batches.push(batchData);
      }
    }

    // 3. FEFO Ordering: First Expire, First Out (Earliest expiry date first)
    batches.sort((a, b) => {
      // Priority 1: Expired and Urgent items first
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.daysRemaining - b.daysRemaining;
    });

    return {
      batches,
      fefoQueue: batches.filter(b => b.status !== 'EXPIRED' && b.quantity > 0),
      summary: {
        totalBatches: batches.length,
        expiredCount,
        urgentCount,
        expiringSoonCount,
        safeCount,
        requiresActionCount: expiredCount + urgentCount + expiringSoonCount
      }
    };
  }

  _classifyBatch(batch) {
    const { daysRemaining, quantity, costPrice, unit, nameEnglish, nameTamil, productName } = batch;
    const displayName = nameEnglish || productName;
    const tiedUpValue = Math.round(quantity * costPrice * 100) / 100;

    let status = 'SAFE';
    let priority = 4;
    let recommendation = 'Stock is within safe shelf life. Continue regular sales rotation.';
    let actionType = 'MONITOR';
    let suggestedDiscountPercent = 0;

    if (daysRemaining < 0) {
      status = 'EXPIRED';
      priority = 1;
      actionType = 'REMOVE_OR_AUDIT';
      recommendation = `EXPIRED ${Math.abs(daysRemaining)} days ago: Immediately quarantine ${quantity} ${unit} from active shelves to protect customer trust. Review loss write-off of ₹${tiedUpValue}.`;
    } else if (daysRemaining <= 7) {
      status = 'URGENT';
      priority = 2;
      actionType = 'URGENT_CLEARANCE';
      suggestedDiscountPercent = 20;
      recommendation = `Expires in ${daysRemaining} days! URGENT: Place ${displayName} at checkout counter. Offer recommended 20% discount (saves ₹${tiedUpValue} capital) or bundle in daily combo. Avoid new wholesale orders.`;
    } else if (daysRemaining <= 30) {
      status = 'EXPIRING_SOON';
      priority = 3;
      actionType = 'PRIORITIZE_SELLING';
      suggestedDiscountPercent = 10;
      recommendation = `Expires in ${daysRemaining} days: Prioritize selling under FEFO rule. Suggest 10% promotional discount or front-facing display to liquidate before freshness window closes.`;
    } else {
      status = 'SAFE';
      priority = 4;
      actionType = 'MAINTAIN';
      recommendation = `Fresh: ${daysRemaining} days of shelf life remaining. Safe under standard inventory holding.`;
    }

    return {
      ...batch,
      expiryDateFormatted: batch.expiryDate.toISOString().slice(0, 10),
      purchaseDateFormatted: batch.purchaseDate.toISOString().slice(0, 10),
      tiedUpValue,
      status, // 'EXPIRED' | 'URGENT' | 'EXPIRING_SOON' | 'SAFE'
      priority,
      actionType,
      suggestedDiscountPercent,
      recommendation
    };
  }
}

export const expiryService = new ExpiryService();
export default expiryService;
