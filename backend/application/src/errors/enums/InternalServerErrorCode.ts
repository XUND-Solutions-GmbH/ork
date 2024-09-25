/**
 * Use Errorcode when an issue is caused by a backend issue
 * e.g: Invalid db object found in database --> backend issue
 */
// eslint-disable-next-line no-shadow
export enum InternalServerErrorCode {
  AnyInternalConnectionError = 'XAUT001',

  /**
   * Error for cases where the reason is not known
   */
  UnknownError = 'XAUT002',

  TooLongRequestedSSHAccessError = 'XAUT003',
  K8sSetupError = 'XAUT004',
  K8sAuthError = 'XAUT005',
}
