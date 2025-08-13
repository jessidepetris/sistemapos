export class PrintPackVariantsDto {
  variants: Array<{ variantId: string; copies: number }>
  forceFakeIfMissing?: boolean
}
