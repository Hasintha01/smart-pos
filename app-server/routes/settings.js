import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const prisma = new PrismaClient();

async function settingsRoutes(app) {
  // Get settings (accessible by all authenticated users)
  app.get('/api/settings', { preHandler: authenticate }, async (request, reply) => {
    try {
      let settings = await prisma.settings.findFirst();
      
      // If no settings exist, create default settings
      if (!settings) {
        settings = await prisma.settings.create({
          data: {
            shopName: 'Smart POS',
            taxEnabled: false,
            taxPercentage: 0,
            taxLabel: 'VAT',
            currency: 'LKR',
            currencySymbol: 'Rs.',
            receiptFooter: 'Thank you for your business!',
            showLogo: true,
            lowStockThreshold: 10
          }
        });
      }
      
      reply.send({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Get settings error:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to fetch settings'
      });
    }
  });

  // Update settings (admin only)
  app.put('/api/settings', { 
    preHandler: [authenticate, authorize('ADMIN')] 
  }, async (request, reply) => {
    try {
      const {
        shopName,
        shopAddress,
        shopPhone,
        shopEmail,
        shopLogo,
        taxEnabled,
        taxPercentage,
        taxLabel,
        currency,
        currencySymbol,
        receiptHeader,
        receiptFooter,
        showLogo,
        lowStockThreshold
      } = request.body;

      // Validation
      if (taxEnabled && taxPercentage !== undefined && (taxPercentage < 0 || taxPercentage > 100)) {
        return reply.code(400).send({
          success: false,
          message: 'Tax percentage must be between 0 and 100'
        });
      }

      if (lowStockThreshold !== undefined && lowStockThreshold !== null && lowStockThreshold < 0) {
        return reply.code(400).send({
          success: false,
          message: 'Low stock threshold must be a positive number'
        });
      }

      // Find existing settings
      let settings = await prisma.settings.findFirst();
      
      // Prepare update data (only include fields that are provided)
      const updateData = {};
      if (shopName !== undefined) updateData.shopName = shopName;
      if (shopAddress !== undefined) updateData.shopAddress = shopAddress;
      if (shopPhone !== undefined) updateData.shopPhone = shopPhone;
      if (shopEmail !== undefined) updateData.shopEmail = shopEmail;
      if (shopLogo !== undefined) updateData.shopLogo = shopLogo;
      if (taxEnabled !== undefined) updateData.taxEnabled = taxEnabled;
      if (taxPercentage !== undefined) updateData.taxPercentage = taxPercentage;
      if (taxLabel !== undefined) updateData.taxLabel = taxLabel;
      if (currency !== undefined) updateData.currency = currency;
      if (currencySymbol !== undefined) updateData.currencySymbol = currencySymbol;
      if (receiptHeader !== undefined) updateData.receiptHeader = receiptHeader;
      if (receiptFooter !== undefined) updateData.receiptFooter = receiptFooter;
      if (showLogo !== undefined) updateData.showLogo = showLogo;
      if (lowStockThreshold !== undefined) updateData.lowStockThreshold = lowStockThreshold;

      if (settings) {
        // Update existing settings
        settings = await prisma.settings.update({
          where: { id: settings.id },
          data: updateData
        });
      } else {
        // Create new settings if none exist
        settings = await prisma.settings.create({
          data: {
            shopName: shopName || 'Smart POS',
            shopAddress,
            shopPhone,
            shopEmail,
            shopLogo,
            taxEnabled: taxEnabled || false,
            taxPercentage: taxPercentage || 0,
            taxLabel: taxLabel || 'VAT',
            currency: currency || 'LKR',
            currencySymbol: currencySymbol || 'Rs.',
            receiptHeader,
            receiptFooter: receiptFooter || 'Thank you for your business!',
            showLogo: showLogo !== undefined ? showLogo : true,
            lowStockThreshold: lowStockThreshold || 10
          }
        });
      }

      reply.send({
        success: true,
        message: 'Settings updated successfully',
        data: settings
      });
    } catch (error) {
      console.error('Update settings error:', error);
      console.error('Error details:', error.message, error.stack);
      reply.code(500).send({
        success: false,
        message: 'Failed to update settings',
        error: error.message
      });
    }
  });

  // Reset settings to default (admin only)
  app.post('/api/settings/reset', { 
    preHandler: [authenticate, authorize('ADMIN')] 
  }, async (request, reply) => {
    try {
      // Find existing settings
      const settings = await prisma.settings.findFirst();
      
      if (settings) {
        // Update to default values
        const resetSettings = await prisma.settings.update({
          where: { id: settings.id },
          data: {
            shopName: 'Smart POS',
            shopAddress: null,
            shopPhone: null,
            shopEmail: null,
            shopLogo: null,
            taxEnabled: false,
            taxPercentage: 0,
            taxLabel: 'VAT',
            currency: 'LKR',
            currencySymbol: 'Rs.',
            receiptHeader: null,
            receiptFooter: 'Thank you for your business!',
            showLogo: true,
            lowStockThreshold: 10
          }
        });

        reply.send({
          success: true,
          message: 'Settings reset to default',
          data: resetSettings
        });
      } else {
        reply.code(404).send({
          success: false,
          message: 'No settings found to reset'
        });
      }
    } catch (error) {
      console.error('Reset settings error:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to reset settings'
      });
    }
  });
}

export default settingsRoutes;
