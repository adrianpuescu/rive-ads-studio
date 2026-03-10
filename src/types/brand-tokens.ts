/**
 * Brand Tokens: visual brand values used by AI in ad generation.
 * Brand name lives on the Brand entity; tokens are colors + font + voice.
 */

export interface BrandTokens {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  brandVoice: string;
}

export function getBrandTokensPromptBlock(brandName: string, tokens: BrandTokens): string {
  return `Brand tokens for this session:
Brand name: ${brandName}
Brand voice: ${tokens.brandVoice}
Primary color: ${tokens.primaryColor}
Secondary color: ${tokens.secondaryColor}
Background color: ${tokens.backgroundColor}
Font family: ${tokens.fontFamily}

Always use these exact colors and font in your ad spec unless the user explicitly requests different ones.`;
}
