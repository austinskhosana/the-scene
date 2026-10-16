export const MARKETING_CONSENT_POLICY_VERSION = '2026-10-16';
export const MARKETING_CONSENT_SOURCE = 'the_scene_email_sign_up';

export type MarketingConsentMetadata = {
  granted: boolean;
  recordedAt: string;
  source: typeof MARKETING_CONSENT_SOURCE;
  policyVersion: typeof MARKETING_CONSENT_POLICY_VERSION;
};

export function createMarketingConsentMetadata(granted: boolean): MarketingConsentMetadata {
  return {
    granted,
    recordedAt: new Date().toISOString(),
    source: MARKETING_CONSENT_SOURCE,
    policyVersion: MARKETING_CONSENT_POLICY_VERSION,
  };
}

export function readMarketingConsentMetadata(metadata: unknown): MarketingConsentMetadata | null {
  if (!metadata || typeof metadata !== 'object') return null;

  const consent = (metadata as Record<string, unknown>).marketingConsent;
  if (!consent || typeof consent !== 'object') return null;

  const candidate = consent as Record<string, unknown>;
  if (
    typeof candidate.granted !== 'boolean' ||
    typeof candidate.recordedAt !== 'string' ||
    candidate.source !== MARKETING_CONSENT_SOURCE ||
    candidate.policyVersion !== MARKETING_CONSENT_POLICY_VERSION
  ) {
    return null;
  }

  return candidate as MarketingConsentMetadata;
}
