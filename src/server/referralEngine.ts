import type {
  ReferralConfig,
  ReferralItem,
  CreditLogItem,
  TopReferrerItem,
  PlanKey,
  ActivityLogItem,
  NotificationItem
} from '../types.js';
import { configStore, userStatsStore } from './configStore.js';
import { supabaseServer } from './supabaseServer.js';

// In-Memory Referral and Credit Log Stores
export const referralsStore = new Map<string, ReferralItem>();
export const creditLogsStore = new Map<string, CreditLogItem[]>();

// User referral code lookup map: userId -> referralCode
export const userReferralCodesMap = new Map<string, string>();
// Code -> userId lookup map: referralCode -> userId / email
export const referralCodeToUserMap = new Map<string, { userId: string; email: string; name?: string }>();

// Initial Seed Data for Demo & Testing
const initSeedReferrals = () => {
  if (referralsStore.size > 0) return;

  // Pre-seed mock users with referral codes
  const mockUsers = [
    { userId: 'usr_admin', email: 'puspendubey6031@gmail.com', name: 'Puspendu Dubey', code: 'VIRJOY100' },
    { userId: 'usr_alex', email: 'alex.creator@gmail.com', name: 'Alex Rivera', code: 'ALEX2026' },
    { userId: 'usr_sarah', email: 'sarah.vlog@gmail.com', name: 'Sarah Connor', code: 'SARAH777' },
    { userId: 'usr_rahul', email: 'rahul.ai@gmail.com', name: 'Rahul Sharma', code: 'RAHUL999' }
  ];

  mockUsers.forEach(u => {
    userReferralCodesMap.set(u.userId, u.code);
    referralCodeToUserMap.set(u.code.toUpperCase(), { userId: u.userId, email: u.email, name: u.name });
  });

  const now = Date.now();
  const seedItems: ReferralItem[] = [
    {
      id: 'ref_1001',
      referrerUserId: 'usr_admin',
      referrerCode: 'VIRJOY100',
      referredUserId: 'usr_client_1',
      referredUserName: 'Rohan Mehta',
      referredUserEmail: 'rohan.m@gmail.com',
      status: 'Completed',
      planKey: '₹799',
      amountPaid: 799,
      referrerCreditsAwarded: 100,
      newUserCreditsAwarded: 40,
      paymentId: 'pay_vj_seed_001',
      createdAt: new Date(now - 7 * 86400 * 1000).toISOString(),
      completedAt: new Date(now - 6 * 86400 * 1000).toISOString()
    },
    {
      id: 'ref_1002',
      referrerUserId: 'usr_admin',
      referrerCode: 'VIRJOY100',
      referredUserId: 'usr_client_2',
      referredUserName: 'Priya Singh',
      referredUserEmail: 'priya.s@gmail.com',
      status: 'Completed',
      planKey: '₹399',
      amountPaid: 399,
      referrerCreditsAwarded: 40,
      newUserCreditsAwarded: 20,
      paymentId: 'pay_vj_seed_002',
      createdAt: new Date(now - 5 * 86400 * 1000).toISOString(),
      completedAt: new Date(now - 4 * 86400 * 1000).toISOString()
    },
    {
      id: 'ref_1003',
      referrerUserId: 'usr_admin',
      referrerCode: 'VIRJOY100',
      referredUserId: 'usr_client_3',
      referredUserName: 'Ankit Kumar',
      referredUserEmail: 'ankit.k@gmail.com',
      status: 'Pending',
      createdAt: new Date(now - 2 * 86400 * 1000).toISOString()
    },
    {
      id: 'ref_1004',
      referrerUserId: 'usr_alex',
      referrerCode: 'ALEX2026',
      referredUserId: 'usr_client_4',
      referredUserName: 'Deepak Verma',
      referredUserEmail: 'deepak.v@gmail.com',
      status: 'Completed',
      planKey: '₹199',
      amountPaid: 199,
      referrerCreditsAwarded: 20,
      newUserCreditsAwarded: 10,
      paymentId: 'pay_vj_seed_004',
      createdAt: new Date(now - 10 * 86400 * 1000).toISOString(),
      completedAt: new Date(now - 9 * 86400 * 1000).toISOString()
    }
  ];

  seedItems.forEach(item => referralsStore.set(item.id, item));
};

initSeedReferrals();

/**
 * Helper to generate or fetch unique referral code for user
 */
export function getOrCreateUserReferralCode(userId: string, email?: string, fullName?: string): string {
  if (userReferralCodesMap.has(userId)) {
    return userReferralCodesMap.get(userId)!;
  }

  // Check if config usersList has a code
  const config = configStore.get();
  const existingAdminUser = (config.usersList || []).find(u => u.id === userId || u.email === email);
  if (existingAdminUser?.referralCode) {
    const code = existingAdminUser.referralCode.toUpperCase();
    userReferralCodesMap.set(userId, code);
    referralCodeToUserMap.set(code, { userId, email: email || existingAdminUser.email, name: fullName || existingAdminUser.name });
    return code;
  }

  // Generate clean alphanumeric code: e.g. VJ_AB123
  const prefix = (fullName || email?.split('@')[0] || 'VIRJOY').replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const code = `${prefix || 'VJ'}${randNum}`;

  userReferralCodesMap.set(userId, code);
  referralCodeToUserMap.set(code, { userId, email: email || 'user@virjoy.ai', name: fullName || 'VirJoy Creator' });
  return code;
}

/**
 * REGISTER REFERRAL AT SIGNUP
 * Prevents self-referral, duplicate referral, and invalid referral codes.
 */
export async function registerReferral(params: {
  referrerCode: string;
  referredUserId: string;
  referredUserName?: string;
  referredUserEmail?: string;
}): Promise<{ success: boolean; referral?: ReferralItem; message?: string }> {
  initSeedReferrals();

  const cleanCode = (params.referrerCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, message: 'Referral code is required.' };
  }

  // 1. Look up referrer user by code
  let referrer = referralCodeToUserMap.get(cleanCode);
  if (!referrer) {
    // Check config usersList
    const config = configStore.get();
    const foundUser = (config.usersList || []).find(u => (u.referralCode || '').toUpperCase() === cleanCode);
    if (foundUser) {
      referrer = { userId: foundUser.id, email: foundUser.email, name: foundUser.name };
      referralCodeToUserMap.set(cleanCode, referrer);
    }
  }

  if (!referrer) {
    return { success: false, message: `Invalid referral code "${cleanCode}".` };
  }

  // SECURITY CHECK 1: Prevent Self-Referral
  if (
    referrer.userId === params.referredUserId ||
    (referrer.email && params.referredUserEmail && referrer.email.toLowerCase() === params.referredUserEmail.toLowerCase())
  ) {
    return { success: false, message: 'Self-referral is strictly prohibited.' };
  }

  // SECURITY CHECK 2: Prevent Duplicate Referrals for same user
  const existingList = Array.from(referralsStore.values());
  const isAlreadyReferred = existingList.some(
    r =>
      r.referredUserId === params.referredUserId ||
      (r.referredUserEmail && params.referredUserEmail && r.referredUserEmail.toLowerCase() === params.referredUserEmail.toLowerCase())
  );

  if (isAlreadyReferred) {
    return { success: false, message: 'You have already used a referral code during signup.' };
  }

  // 3. Create Pending Referral Record
  const newRefId = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newReferral: ReferralItem = {
    id: newRefId,
    referrerUserId: referrer.userId,
    referrerCode: cleanCode,
    referredUserId: params.referredUserId,
    referredUserName: params.referredUserName || 'New Creator',
    referredUserEmail: params.referredUserEmail || '',
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  referralsStore.set(newRefId, newReferral);

  // Sync to Supabase if available
  if (supabaseServer) {
    Promise.resolve(
      supabaseServer.from('referrals').insert({
        id: newRefId,
        referrer_user_id: referrer.userId,
        referrer_code: cleanCode,
        referred_user_id: params.referredUserId,
        referred_user_name: params.referredUserName || 'New Creator',
        referred_user_email: params.referredUserEmail || null,
        status: 'Pending',
        created_at: newReferral.createdAt
      })
    ).catch(err => console.warn('Supabase referral register note:', err?.message));
  }

  return {
    success: true,
    referral: newReferral,
    message: `Referral code "${cleanCode}" successfully linked! Reward will be issued when you subscribe to a paid plan.`
  };
}

/**
 * PROCESS REWARD UPON SUCCESSFUL PAID SUBSCRIPTION
 * Server is single source of truth. Dynamic reward calculations based on Admin config.
 */
export async function processSubscriptionReward(params: {
  userId: string;
  userEmail?: string;
  planKey: PlanKey | string;
  paymentId: string;
  amountPaid: number;
}): Promise<{ success: boolean; rewarded: boolean; referrerCredits?: number; newUserBonus?: number; message?: string }> {
  initSeedReferrals();

  const config = configStore.get();
  const refConfig: ReferralConfig = config.referralConfig || {
    campaignStatus: 'Active',
    planRewards: {
      '₹199': { referrerCredits: 20, newUserBonusCredits: 10, enabled: true },
      '₹399': { referrerCredits: 40, newUserBonusCredits: 20, enabled: true },
      '₹799': { referrerCredits: 100, newUserBonusCredits: 40, enabled: true }
    },
    notifications: {
      referrerMessage: 'You earned {credits} Credits because {referred_user} subscribed to {plan}!',
      newUserMessage: 'You received {credits} Bonus Credits for subscribing with referral code {ref_code}!',
      refundReversalMessage: 'Referral bonus of {credits} Credits was reversed due to subscription refund.'
    },
    referralBonusCredits: 50,
    inviterRewardCredits: 20,
    inviteeRewardCredits: 10,
    analytics: { totalReferrals: 0, pendingReferrals: 0, completedReferrals: 0, expiredReferrals: 0, cancelledReferrals: 0, totalRewardsPaid: 0 }
  };

  // 1. Check if Referral Campaign is Active
  if (refConfig.campaignStatus !== 'Active') {
    return { success: true, rewarded: false, message: 'Referral campaign is currently paused by Admin.' };
  }

  // 2. Security Check: Payment ID duplication
  const allReferrals = Array.from(referralsStore.values());
  const isPaymentAlreadyRewarded = allReferrals.some(r => r.paymentId === params.paymentId && r.status === 'Completed');
  if (isPaymentAlreadyRewarded) {
    return { success: true, rewarded: false, message: 'Referral reward already processed for this transaction.' };
  }

  // 3. Find Pending Referral for this user
  const pendingReferral = allReferrals.find(
    r =>
      r.status === 'Pending' &&
      (r.referredUserId === params.userId ||
        (r.referredUserEmail && params.userEmail && r.referredUserEmail.toLowerCase() === params.userEmail.toLowerCase()))
  );

  if (!pendingReferral) {
    return { success: true, rewarded: false, message: 'No pending referral associated with this user.' };
  }

  // 4. Determine Dynamic Reward Rules from Backend Config (Never trust client!)
  const planRewardRule = refConfig.planRewards?.[params.planKey] || {
    referrerCredits: params.planKey.includes('799') ? 100 : params.planKey.includes('399') ? 40 : 20,
    newUserBonusCredits: params.planKey.includes('799') ? 40 : params.planKey.includes('399') ? 20 : 10,
    enabled: true
  };

  if (planRewardRule.enabled === false) {
    return { success: true, rewarded: false, message: `Referral rewards disabled for ${params.planKey} plan.` };
  }

  const referrerAward = planRewardRule.referrerCredits;
  const newUserAward = planRewardRule.newUserBonusCredits;

  if (referrerAward <= 0 && newUserAward <= 0) {
    return { success: true, rewarded: false, message: 'Reward allocation is 0 credits for this plan.' };
  }

  // 5. Update Referral Status to Completed
  const completedAt = new Date().toISOString();
  pendingReferral.status = 'Completed';
  pendingReferral.planKey = params.planKey as PlanKey;
  pendingReferral.amountPaid = params.amountPaid;
  pendingReferral.referrerCreditsAwarded = referrerAward;
  pendingReferral.newUserCreditsAwarded = newUserAward;
  pendingReferral.paymentId = params.paymentId;
  pendingReferral.completedAt = completedAt;

  referralsStore.set(pendingReferral.id, pendingReferral);

  // 6. Award Credits Server-Side
  // Referrer credits boost
  if (pendingReferral.referrerUserId === userStatsStore.userId) {
    userStatsStore.usedCredits = Math.max(0, userStatsStore.usedCredits - referrerAward);
  }

  // Insert Credit Logs
  const referrerLog: CreditLogItem = {
    id: `cl_${Date.now()}_ref`,
    userId: pendingReferral.referrerUserId,
    type: 'Referral_Earned',
    amount: referrerAward,
    description: `+${referrerAward} Credits earned from successful referral subscription of ${pendingReferral.referredUserName || pendingReferral.referredUserEmail || 'referred user'} (${params.planKey})`,
    referralId: pendingReferral.id,
    createdAt: completedAt
  };

  const newUserLog: CreditLogItem = {
    id: `cl_${Date.now()}_new`,
    userId: pendingReferral.referredUserId,
    userEmail: pendingReferral.referredUserEmail,
    type: 'Referral_Bonus',
    amount: newUserAward,
    description: `+${newUserAward} Bonus Credits granted for subscribing with referral code ${pendingReferral.referrerCode}`,
    referralId: pendingReferral.id,
    createdAt: completedAt
  };

  const currentLogs = creditLogsStore.get(pendingReferral.referrerUserId) || [];
  creditLogsStore.set(pendingReferral.referrerUserId, [referrerLog, ...currentLogs]);

  // 7. Generate Server Notifications
  const refMessage = (refConfig.notifications.referrerMessage || 'You earned {credits} Credits!')
    .replace('{credits}', String(referrerAward))
    .replace('{referred_user}', pendingReferral.referredUserName || pendingReferral.referredUserEmail || 'a friend')
    .replace('{plan}', String(params.planKey));

  const newMsg = (refConfig.notifications.newUserMessage || 'You received {credits} Bonus Credits!')
    .replace('{credits}', String(newUserAward))
    .replace('{ref_code}', pendingReferral.referrerCode)
    .replace('{plan}', String(params.planKey));

  const notification1: NotificationItem = {
    id: `notif_${Date.now()}_1`,
    title: '🎁 Referral Reward Received!',
    message: refMessage,
    type: 'Popup',
    targetAudience: 'Selected Users',
    targetUserEmails: [pendingReferral.referrerUserId],
    enabled: true,
    createdAt: completedAt
  };

  const notification2: NotificationItem = {
    id: `notif_${Date.now()}_2`,
    title: '🎉 Referral Bonus Added!',
    message: newMsg,
    type: 'Popup',
    targetAudience: 'Selected Users',
    targetUserEmails: [params.userEmail || pendingReferral.referredUserId],
    enabled: true,
    createdAt: completedAt
  };

  if (!config.notificationsList) config.notificationsList = [];
  config.notificationsList.unshift(notification1, notification2);

  // 8. Log Admin Activity Log
  const activityLog: ActivityLogItem = {
    id: `log_ref_${Date.now()}`,
    actionType: 'Credit Change',
    details: `Issued referral rewards: ${referrerAward} credits to Referrer (${pendingReferral.referrerUserId}) and ${newUserAward} credits to New User (${params.userId}) for ${params.planKey} plan payment ${params.paymentId}`,
    adminUser: 'System Automation',
    timestamp: new Date().toISOString()
  };
  if (!config.activityLogs) config.activityLogs = [];
  config.activityLogs.unshift(activityLog);

  // Update referral analytics in config
  if (refConfig.analytics) {
    refConfig.analytics.completedReferrals = (refConfig.analytics.completedReferrals || 0) + 1;
    refConfig.analytics.pendingReferrals = Math.max(0, (refConfig.analytics.pendingReferrals || 1) - 1);
    refConfig.analytics.totalRewardsPaid = (refConfig.analytics.totalRewardsPaid || 0) + referrerAward + newUserAward;
  }

  // Save to Supabase
  if (supabaseServer) {
    Promise.resolve(
      supabaseServer.from('referrals').update({
        status: 'Completed',
        plan_key: params.planKey,
        amount_paid: params.amountPaid,
        referrer_credits_awarded: referrerAward,
        new_user_credits_awarded: newUserAward,
        payment_id: params.paymentId,
        completed_at: completedAt
      }).eq('id', pendingReferral.id)
    ).catch(err => console.warn('Supabase referral update note:', err?.message));
  }

  return {
    success: true,
    rewarded: true,
    referrerCredits: referrerAward,
    newUserBonus: newUserAward,
    message: `Successfully issued ${referrerAward} credits to Referrer and ${newUserAward} credits to New User.`
  };
}

/**
 * AUTOMATIC REFUND REVERSAL
 * Automatically reverses referral rewards if subscription is refunded.
 */
export async function processRefundReversal(params: {
  paymentId: string;
  userEmail?: string;
  reason?: string;
}): Promise<{ success: boolean; reversed: boolean; message: string }> {
  initSeedReferrals();

  const allReferrals = Array.from(referralsStore.values());
  const completedRef = allReferrals.find(
    r => r.status === 'Completed' && (r.paymentId === params.paymentId || (params.userEmail && r.referredUserEmail === params.userEmail))
  );

  if (!completedRef) {
    return { success: true, reversed: false, message: 'No active referral reward found for this refunded subscription.' };
  }

  const refundedAt = new Date().toISOString();
  const referrerDeduct = completedRef.referrerCreditsAwarded || 0;
  const newUserDeduct = completedRef.newUserCreditsAwarded || 0;

  // 1. Mark status as Refunded
  completedRef.status = 'Refunded';
  completedRef.refundedAt = refundedAt;
  referralsStore.set(completedRef.id, completedRef);

  // 2. Reverse credits
  if (completedRef.referrerUserId === userStatsStore.userId) {
    userStatsStore.usedCredits = userStatsStore.usedCredits + referrerDeduct;
  }

  // 3. Create reversal credit logs
  const revLog1: CreditLogItem = {
    id: `cl_rev_${Date.now()}_1`,
    userId: completedRef.referrerUserId,
    type: 'Referral_Reversed',
    amount: -referrerDeduct,
    description: `-${referrerDeduct} Credits reversed due to subscription refund of referred user (${params.reason || 'Refund Processed'})`,
    referralId: completedRef.id,
    createdAt: refundedAt
  };

  const revLog2: CreditLogItem = {
    id: `cl_rev_${Date.now()}_2`,
    userId: completedRef.referredUserId,
    userEmail: completedRef.referredUserEmail,
    type: 'Referral_Reversed',
    amount: -newUserDeduct,
    description: `-${newUserDeduct} Credits reversed due to subscription refund (${params.reason || 'Refund Processed'})`,
    referralId: completedRef.id,
    createdAt: refundedAt
  };

  const currentLogs = creditLogsStore.get(completedRef.referrerUserId) || [];
  creditLogsStore.set(completedRef.referrerUserId, [revLog1, ...currentLogs]);

  // 4. Send Notifications
  const config = configStore.get();
  const refConfig = config.referralConfig;
  const revTemplate = refConfig?.notifications?.refundReversalMessage || 'Referral bonus of {credits} Credits was reversed due to subscription refund.';

  const notifMsg1 = revTemplate.replace('{credits}', String(referrerDeduct));
  const notifMsg2 = revTemplate.replace('{credits}', String(newUserDeduct));

  const n1: NotificationItem = {
    id: `notif_rev_${Date.now()}_1`,
    title: '⚠️ Referral Bonus Reversed',
    message: notifMsg1,
    type: 'Popup',
    targetAudience: 'Selected Users',
    targetUserEmails: [completedRef.referrerUserId],
    enabled: true,
    createdAt: refundedAt
  };

  const n2: NotificationItem = {
    id: `notif_rev_${Date.now()}_2`,
    title: '⚠️ Bonus Credits Reversed',
    message: notifMsg2,
    type: 'Popup',
    targetAudience: 'Selected Users',
    targetUserEmails: [completedRef.referredUserEmail || completedRef.referredUserId],
    enabled: true,
    createdAt: refundedAt
  };

  if (!config.notificationsList) config.notificationsList = [];
  config.notificationsList.unshift(n1, n2);

  // 5. Admin Activity Log
  const activityLog: ActivityLogItem = {
    id: `log_rev_${Date.now()}`,
    actionType: 'Credit Change',
    details: `AUTOMATIC REFUND REVERSAL: Deducted ${referrerDeduct} credits from Referrer (${completedRef.referrerUserId}) and ${newUserDeduct} credits from Referred User (${completedRef.referredUserId}) for refunded payment ${params.paymentId}`,
    adminUser: 'System Automation',
    timestamp: refundedAt
  };
  if (!config.activityLogs) config.activityLogs = [];
  config.activityLogs.unshift(activityLog);

  // Sync with Supabase
  if (supabaseServer) {
    Promise.resolve(
      supabaseServer.from('referrals').update({
        status: 'Refunded',
        refunded_at: refundedAt
      }).eq('id', completedRef.id)
    ).catch(err => console.warn('Supabase referral refund update note:', err?.message));
  }

  return {
    success: true,
    reversed: true,
    message: `Successfully reversed referral rewards: -${referrerDeduct} credits from referrer and -${newUserDeduct} from user.`
  };
}

/**
 * GET ADMIN REFERRAL DASHBOARD DATA
 */
export function getAdminReferralDashboardData(filters?: {
  status?: string;
  search?: string;
  planKey?: string;
}) {
  initSeedReferrals();

  const allItems = Array.from(referralsStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  let filtered = [...allItems];

  if (filters?.status && filters.status !== 'All') {
    filtered = filtered.filter(i => i.status.toLowerCase() === filters.status!.toLowerCase());
  }

  if (filters?.planKey && filters.planKey !== 'All') {
    filtered = filtered.filter(i => i.planKey === filters.planKey);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      i =>
        i.referrerCode.toLowerCase().includes(q) ||
        i.referrerUserId.toLowerCase().includes(q) ||
        (i.referredUserEmail && i.referredUserEmail.toLowerCase().includes(q)) ||
        (i.referredUserName && i.referredUserName.toLowerCase().includes(q)) ||
        i.id.toLowerCase().includes(q)
    );
  }

  // Summary Metrics
  const totalReferrals = allItems.length;
  const pendingReferrals = allItems.filter(i => i.status === 'Pending').length;
  const completedReferrals = allItems.filter(i => i.status === 'Completed').length;
  const expiredReferrals = allItems.filter(i => i.status === 'Expired').length;
  const cancelledReferrals = allItems.filter(i => i.status === 'Cancelled' || i.status === 'Refunded').length;
  const totalCreditsDistributed = allItems.reduce(
    (sum, i) => sum + (i.status === 'Completed' ? (i.referrerCreditsAwarded || 0) + (i.newUserCreditsAwarded || 0) : 0),
    0
  );

  // Compute Top Referrers
  const referrerMap = new Map<string, TopReferrerItem>();
  allItems.forEach(i => {
    const refKey = i.referrerUserId;
    if (!referrerMap.has(refKey)) {
      referrerMap.set(refKey, {
        userId: refKey,
        userName: i.referrerUserId === 'usr_admin' ? 'Puspendu Dubey (Admin)' : 'Creator User',
        userEmail: i.referrerUserId === 'usr_admin' ? 'puspendubey6031@gmail.com' : `${refKey}@virjoy.ai`,
        referralCode: i.referrerCode,
        totalReferrals: 0,
        completedReferrals: 0,
        totalCreditsEarned: 0
      });
    }
    const item = referrerMap.get(refKey)!;
    item.totalReferrals += 1;
    if (i.status === 'Completed') {
      item.completedReferrals += 1;
      item.totalCreditsEarned += i.referrerCreditsAwarded || 0;
    }
  });

  const topReferrers = Array.from(referrerMap.values()).sort((a, b) => b.totalCreditsEarned - a.totalCreditsEarned);

  return {
    metrics: {
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      expiredReferrals,
      cancelledReferrals,
      totalCreditsDistributed
    },
    referrals: filtered,
    topReferrers
  };
}

/**
 * GET USER REFERRAL DASHBOARD DATA
 */
export function getUserReferralDashboardData(userId: string, email?: string, hostOrigin?: string) {
  initSeedReferrals();

  const userCode = getOrCreateUserReferralCode(userId, email);
  const origin = hostOrigin || 'https://virjoy.ai';
  const referralLink = `${origin}/signup?ref=${userCode}`;

  const allItems = Array.from(referralsStore.values());
  const userReferrals = allItems
    .filter(i => i.referrerUserId === userId || i.referrerCode.toUpperCase() === userCode.toUpperCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingCount = userReferrals.filter(i => i.status === 'Pending').length;
  const completedCount = userReferrals.filter(i => i.status === 'Completed').length;
  const totalCreditsEarned = userReferrals.reduce(
    (sum, i) => sum + (i.status === 'Completed' ? i.referrerCreditsAwarded || 0 : 0),
    0
  );

  // Mask email for user privacy
  const history = userReferrals.map(r => {
    let maskedEmail = 'a***@gmail.com';
    if (r.referredUserEmail) {
      const parts = r.referredUserEmail.split('@');
      maskedEmail = `${parts[0].substring(0, 2)}***@${parts[1] || 'gmail.com'}`;
    }
    return {
      id: r.id,
      referredUserName: r.referredUserName || 'Referred Friend',
      referredUserEmailMasked: maskedEmail,
      status: r.status,
      planKey: r.planKey || 'Pending Subscription',
      creditsEarned: r.status === 'Completed' ? r.referrerCreditsAwarded || 0 : 0,
      createdAt: r.createdAt,
      completedAt: r.completedAt
    };
  });

  return {
    referralCode: userCode,
    referralLink,
    pendingCount,
    completedCount,
    totalCreditsEarned,
    history
  };
}
