export const getPaymentHeader = (payment) => {
  return `vhash:${payment.vhash},vsig:${payment.vsig}`;
}
