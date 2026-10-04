/** Element ids of the form fields, so a rejected submit can focus the first invalid field. */
export const expenseFieldIds = (prefix: string) => ({
  category: `${prefix}-category`,
  date: `${prefix}-date`,
  description: `${prefix}-description`,
  acknowledgedSeparate: `${prefix}-ack`,
})

export const outstandingFieldIds = (prefix: string) => ({
  category: `${prefix}-timing`,
  evidenceId: `${prefix}-evidence`,
  explanation: `${prefix}-explanation`,
})
