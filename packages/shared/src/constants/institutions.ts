export const INSTITUTION_TYPES = ['bank', 'fintech', 'cooperative', 'other'] as const;

export type InstitutionType = (typeof INSTITUTION_TYPES)[number];

export type Institution = {
  readonly id: string;
  readonly name: string;
  readonly type: InstitutionType;
};

export const INSTITUTIONS = [
  // Banks
  { id: 'bancolombia', name: 'Bancolombia', type: 'bank' },
  { id: 'davivienda', name: 'Davivienda', type: 'bank' },
  { id: 'bbva', name: 'BBVA Colombia', type: 'bank' },
  { id: 'banco-bogota', name: 'Banco de Bogota', type: 'bank' },
  { id: 'banco-occidente', name: 'Banco de Occidente', type: 'bank' },
  { id: 'scotiabank', name: 'Scotiabank Colpatria', type: 'bank' },
  { id: 'banco-popular', name: 'Banco Popular', type: 'bank' },
  { id: 'banco-agrario', name: 'Banco Agrario', type: 'bank' },
  { id: 'itau', name: 'Itau Colombia', type: 'bank' },
  { id: 'banco-falabella', name: 'Banco Falabella', type: 'bank' },
  { id: 'banco-pichincha', name: 'Banco Pichincha', type: 'bank' },
  { id: 'citibank', name: 'Citibank Colombia', type: 'bank' },
  { id: 'gnb-sudameris', name: 'GNB Sudameris', type: 'bank' },
  { id: 'banco-caja-social', name: 'Banco Caja Social', type: 'bank' },
  { id: 'av-villas', name: 'Banco AV Villas', type: 'bank' },
  // Fintechs
  { id: 'nu', name: 'Nu Colombia', type: 'fintech' },
  { id: 'nequi', name: 'Nequi', type: 'fintech' },
  { id: 'daviplata', name: 'DaviPlata', type: 'fintech' },
  { id: 'rappipay', name: 'RappiPay', type: 'fintech' },
  { id: 'movii', name: 'MOVii', type: 'fintech' },
  { id: 'bold', name: 'Bold', type: 'fintech' },
  { id: 'uala', name: 'Uala', type: 'fintech' },
  { id: 'addi', name: 'Addi', type: 'fintech' },
  // Cooperatives
  { id: 'confiar', name: 'Confiar', type: 'cooperative' },
  { id: 'cfa', name: 'CFA Cooperativa', type: 'cooperative' },
  { id: 'cotrafa', name: 'Cotrafa', type: 'cooperative' },
  // Other / Brokers
  { id: 'tyba', name: 'tyba', type: 'other' },
  { id: 'trii', name: 'trii', type: 'other' },
  { id: 'a2censo', name: 'a2censo', type: 'other' },
  { id: 'other', name: 'Other', type: 'other' },
] as const satisfies readonly Institution[];
