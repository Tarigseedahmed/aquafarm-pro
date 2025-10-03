import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// Stripe is optional; wrap dynamic require to avoid build failure if package absent
// Optional Stripe import (avoids build failure if dependency absent)
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unused-vars
let StripeLib: any = null;
try {
  StripeLib = eval('require')('stripe');
} catch {
  StripeLib = null;
}
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { Payment } from './entities/payment.entity';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: any;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (StripeLib && stripeSecretKey) {
      this.stripe = new StripeLib(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });
    } else {
      this.logger.warn('Stripe library or secret key not available; StripeService is disabled');
      this.stripe = null;
    }
  }

  /**
   * Create a Stripe customer
   */
  async createCustomer(tenantId: string, email: string, name?: string): Promise<string> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          tenantId,
        },
      });

      this.logger.log(`Created Stripe customer ${customer.id} for tenant ${tenantId}`);
      return customer.id;
    } catch (error) {
      this.logger.error(`Error creating Stripe customer: ${error.message}`);
      throw new BadRequestException('Failed to create customer');
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(
    tenantId: string,
    customerId: string,
    priceId: string,
    trialDays?: number,
  ): Promise<Subscription> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }
    try {
          const subscriptionData: any = {
        customer: customerId,
        items: [{ price: priceId }],
        metadata: {
          tenantId,
        },
        expand: ['latest_invoice.payment_intent'],
      };

      if (trialDays && trialDays > 0) {
        subscriptionData.trial_period_days = trialDays;
      }

      const stripeSubscription = await this.stripe.subscriptions.create(subscriptionData);

      // Create subscription record in database
      const subscription = this.subscriptionRepository.create({
        tenantId,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: customerId,
        status: stripeSubscription.status as any,
        planId: this.getPlanIdFromPriceId(priceId),
        amount: stripeSubscription.items.data[0].price.unit_amount || 0,
        currency: stripeSubscription.currency,
        interval: stripeSubscription.items.data[0].price.recurring?.interval || 'month',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialStart: stripeSubscription.trial_start
          ? new Date(stripeSubscription.trial_start * 1000)
          : undefined,
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : undefined,
        metadata: this.getPlanMetadata(priceId),
      });

      const savedSubscription = await this.subscriptionRepository.save(subscription);

      this.logger.log(`Created subscription ${savedSubscription.id} for tenant ${tenantId}`);
      return savedSubscription;
    } catch (error) {
      this.logger.error(`Error creating subscription: ${error.message}`);
      throw new BadRequestException('Failed to create subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, immediately = false): Promise<Subscription> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }
    try {
      const subscription = await this.subscriptionRepository.findOne({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        throw new BadRequestException('Subscription not found');
      }

      if (immediately) {
        await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      } else {
        await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      subscription.status = immediately ? 'canceled' : subscription.status;
      subscription.canceledAt = new Date();

      return await this.subscriptionRepository.save(subscription);
    } catch (error) {
      this.logger.error(`Error canceling subscription: ${error.message}`);
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  /**
   * Create a payment intent for one-time payments
   */
  async createPaymentIntent(
    tenantId: string,
    amount: number,
    currency: string,
    description?: string,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        description,
        metadata: {
          tenantId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create payment record
      const payment = this.paymentRepository.create({
        tenantId,
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending',
        amount,
        currency: currency.toUpperCase(),
        description,
      });

      await this.paymentRepository.save(payment);

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      this.logger.error(`Error creating payment intent: ${error.message}`);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(event: any): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionEvent(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error handling webhook: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get subscription by tenant ID
   */
  async getSubscriptionByTenant(tenantId: string): Promise<Subscription | null> {
    return await this.subscriptionRepository.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get payment history for tenant
   */
  async getPaymentHistory(tenantId: string, limit = 10): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Create a refund
   */
  async createRefund(
    paymentId: string,
    amount?: number,
    reason?: string,
  ): Promise<{ refundId: string }> {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new BadRequestException('Payment not found');
      }

          const refundData: any = {
        payment_intent: payment.stripePaymentIntentId,
        reason: reason as any,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundData);

      // Update payment record
      payment.refundInfo = {
        amount: refund.amount / 100,
        reason: refund.reason,
        refundedAt: new Date(),
        stripeRefundId: refund.id,
      };

      await this.paymentRepository.save(payment);

      return { refundId: refund.id };
    } catch (error) {
      this.logger.error(`Error creating refund: ${error.message}`);
      throw new BadRequestException('Failed to create refund');
    }
  }

  // Private helper methods
  private async handleSubscriptionEvent(subscription: any): Promise<void> {
    const dbSubscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (dbSubscription) {
      dbSubscription.status = subscription.status as any;
      dbSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
      dbSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);

      if (subscription.canceled_at) {
        dbSubscription.canceledAt = new Date(subscription.canceled_at * 1000);
      }

      await this.subscriptionRepository.save(dbSubscription);
    }
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const dbSubscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (dbSubscription) {
      dbSubscription.status = 'canceled';
      dbSubscription.endedAt = new Date();
      await this.subscriptionRepository.save(dbSubscription);
    }
  }

  private async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (payment) {
      payment.status = 'succeeded';
      payment.paidAt = new Date();
      await this.paymentRepository.save(payment);
    }
  }

  private async handlePaymentFailed(paymentIntent: any): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (payment) {
      payment.status = 'failed';
      payment.failedAt = new Date();
      payment.failureReason = paymentIntent.last_payment_error?.message;
      await this.paymentRepository.save(payment);
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    // Handle successful invoice payment
    this.logger.log(`Invoice payment succeeded: ${invoice.id}`);
  }

  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    // Handle failed invoice payment
    this.logger.log(`Invoice payment failed: ${invoice.id}`);
  }

  private getPlanIdFromPriceId(priceId: string): string {
    // Map Stripe price IDs to plan IDs
    const priceToPlanMap: Record<string, string> = {
      price_basic_monthly: 'basic',
      price_basic_yearly: 'basic',
      price_professional_monthly: 'professional',
      price_professional_yearly: 'professional',
      price_enterprise_monthly: 'enterprise',
      price_enterprise_yearly: 'enterprise',
    };

    return priceToPlanMap[priceId] || 'basic';
  }

  private getPlanMetadata(priceId: string): any {
    const planMetadata: Record<string, any> = {
      basic: {
        features: ['basic_analytics', 'email_support'],
        limits: {
          users: 5,
          ponds: 10,
          farms: 3,
          storage: 1,
        },
      },
      professional: {
        features: ['advanced_analytics', 'priority_support', 'api_access'],
        limits: {
          users: 25,
          ponds: 50,
          farms: 10,
          storage: 10,
        },
      },
      enterprise: {
        features: ['enterprise_analytics', 'dedicated_support', 'custom_integrations'],
        limits: {
          users: -1, // unlimited
          ponds: -1,
          farms: -1,
          storage: 100,
        },
      },
    };

    const planId = this.getPlanIdFromPriceId(priceId);
    return planMetadata[planId] || planMetadata.basic;
  }
}
