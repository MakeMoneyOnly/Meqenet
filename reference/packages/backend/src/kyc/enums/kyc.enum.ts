/**
 * KYC document types
 */
export enum KycDocumentType {
  FAYDA_ID = 'FAYDA_ID',
  PASSPORT = 'PASSPORT',
  RESIDENCE_PERMIT = 'RESIDENCE_PERMIT',
}

/**
 * KYC verification status
 */
export enum KycStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
