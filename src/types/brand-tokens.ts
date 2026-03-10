/**
 * Brand Tokens: visual brand values used by AI in ad generation.
 */

export interface BrandTokens {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  brandName: string;
  brandVoice: string;
}

export function getBrandTokensPromptBlock(tokens: BrandTokens): string {
  return `Brand tokens for this session:
Brand name: ${tokens.brandName}
Brand voice: ${tokens.brandVoice}
Primary color: ${tokens.primaryColor}
Secondary color: ${tokens.secondaryColor}
Background color: ${tokens.backgroundColor}
Font family: ${tokens.fontFamily}

Always use these exact colors and font in your ad spec unless the user explicitly requests different ones.`;
}
