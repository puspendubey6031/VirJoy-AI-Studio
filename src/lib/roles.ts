import type { UserRole } from '../types.js';

// OWNER_EMAIL environment variable or fallback default
export const getOwnerEmail = (): string => {
  if (typeof process !== 'undefined' && process.env && process.env.OWNER_EMAIL) {
    return process.env.OWNER_EMAIL.trim().toLowerCase();
  }
  return 'puspendubey6031@gmail.com';
};

export function isOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  const ownerEnv = getOwnerEmail();
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === ownerEnv) return true;
  if (cleanEmail === 'puspendubey6031@gmail.com' || cleanEmail === 'owner@virjoy.ai') return true;
  return false;
}

export function getUserRole(email?: string | null, plan?: string, explicitRole?: string): UserRole {
  if (isOwnerEmail(email)) {
    return 'Owner';
  }
  if (explicitRole === 'Owner' || explicitRole === 'Admin' || explicitRole === 'Moderator' || explicitRole === 'Premium User' || explicitRole === 'Free User') {
    return explicitRole as UserRole;
  }
  if (email && (email.toLowerCase().includes('admin@virjoy.ai') || email.toLowerCase().includes('admin@rishaan.com'))) {
    return 'Admin';
  }
  if (email && (email.toLowerCase().includes('mod@virjoy.ai') || email.toLowerCase().includes('moderator'))) {
    return 'Moderator';
  }
  if (plan && (plan === '₹199' || plan === '₹399' || plan === '₹799' || plan === 'Pro' || plan === 'Enterprise' || plan === 'Ultra')) {
    return 'Premium User';
  }
  return 'Free User';
}

export interface RolePermissions {
  unlimitedCredits: boolean;
  unlimitedAIUsage: boolean;
  unlimitedImageGen: boolean;
  unlimitedVideoGen: boolean;
  unlimitedPrompts: boolean;
  unlimitedExports: boolean;
  noWatermark: boolean;
  noPaymentRequired: boolean;
  ignoreSubscriptionChecks: boolean;
  ignoreCreditDeduction: boolean;
  developerModeAccess: boolean;
  adminDashboardAccess: boolean;
  userManagement: boolean;
  subscriptionManagement: boolean;
  creditManagement: boolean;
  marketplaceManagement: boolean;
  commissionManagement: boolean;
  paymentManagement: boolean;
  toolManagement: boolean;
  webAppManagement: boolean;
  analyticsAccess: boolean;
}

export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'Owner':
      return {
        unlimitedCredits: true,
        unlimitedAIUsage: true,
        unlimitedImageGen: true,
        unlimitedVideoGen: true,
        unlimitedPrompts: true,
        unlimitedExports: true,
        noWatermark: true,
        noPaymentRequired: true,
        ignoreSubscriptionChecks: true,
        ignoreCreditDeduction: true,
        developerModeAccess: true,
        adminDashboardAccess: true,
        userManagement: true,
        subscriptionManagement: true,
        creditManagement: true,
        marketplaceManagement: true,
        commissionManagement: true,
        paymentManagement: true,
        toolManagement: true,
        webAppManagement: true,
        analyticsAccess: true
      };
    case 'Admin':
      return {
        unlimitedCredits: false,
        unlimitedAIUsage: false,
        unlimitedImageGen: false,
        unlimitedVideoGen: false,
        unlimitedPrompts: false,
        unlimitedExports: false,
        noWatermark: true,
        noPaymentRequired: false,
        ignoreSubscriptionChecks: false,
        ignoreCreditDeduction: false,
        developerModeAccess: false,
        adminDashboardAccess: true,
        userManagement: true,
        subscriptionManagement: true,
        creditManagement: true,
        marketplaceManagement: true,
        commissionManagement: true,
        paymentManagement: true,
        toolManagement: true,
        webAppManagement: true,
        analyticsAccess: true
      };
    case 'Moderator':
      return {
        unlimitedCredits: false,
        unlimitedAIUsage: false,
        unlimitedImageGen: false,
        unlimitedVideoGen: false,
        unlimitedPrompts: false,
        unlimitedExports: false,
        noWatermark: false,
        noPaymentRequired: false,
        ignoreSubscriptionChecks: false,
        ignoreCreditDeduction: false,
        developerModeAccess: false,
        adminDashboardAccess: true,
        userManagement: true,
        subscriptionManagement: false,
        creditManagement: false,
        marketplaceManagement: true,
        commissionManagement: false,
        paymentManagement: false,
        toolManagement: false,
        webAppManagement: false,
        analyticsAccess: true
      };
    case 'Premium User':
      return {
        unlimitedCredits: false,
        unlimitedAIUsage: false,
        unlimitedImageGen: false,
        unlimitedVideoGen: false,
        unlimitedPrompts: false,
        unlimitedExports: false,
        noWatermark: true,
        noPaymentRequired: false,
        ignoreSubscriptionChecks: false,
        ignoreCreditDeduction: false,
        developerModeAccess: false,
        adminDashboardAccess: false,
        userManagement: false,
        subscriptionManagement: false,
        creditManagement: false,
        marketplaceManagement: false,
        commissionManagement: false,
        paymentManagement: false,
        toolManagement: false,
        webAppManagement: false,
        analyticsAccess: false
      };
    case 'Free User':
    default:
      return {
        unlimitedCredits: false,
        unlimitedAIUsage: false,
        unlimitedImageGen: false,
        unlimitedVideoGen: false,
        unlimitedPrompts: false,
        unlimitedExports: false,
        noWatermark: false,
        noPaymentRequired: false,
        ignoreSubscriptionChecks: false,
        ignoreCreditDeduction: false,
        developerModeAccess: false,
        adminDashboardAccess: false,
        userManagement: false,
        subscriptionManagement: false,
        creditManagement: false,
        marketplaceManagement: false,
        commissionManagement: false,
        paymentManagement: false,
        toolManagement: false,
        webAppManagement: false,
        analyticsAccess: false
      };
  }
}
