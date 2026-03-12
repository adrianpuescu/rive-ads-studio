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
  return `IMPORTANT — Brand tokens override all other color rules below.
You MUST use exactly these colors, even if they seem bold or unusual:
- backgroundColor MUST be exactly: ${tokens.backgroundColor}
- primaryColor MUST be exactly: ${tokens.primaryColor}
- secondaryColor MUST be exactly: ${tokens.secondaryColor}
You may adjust headlineColor, subheadlineColor, ctaColor to ensure readability against the brand backgroundColor,
but all other colors are fixed and non-negotiable.

Brand name: ${brandName}
Brand voice: ${tokens.brandVoice}
Font family: ${tokens.fontFamily}`;
}

export function getBrandTokensRefinementBlock(brandName: string, tokens: BrandTokens): string {
  return `Brand tokens are guidelines for this ad.
If the user explicitly requests a color change, honor their request even if it differs from brand tokens.
Brand tokens are suggestions, not hard constraints during refinement.
- backgroundColor suggestion: ${tokens.backgroundColor}
- primaryColor suggestion: ${tokens.primaryColor}
- secondaryColor suggestion: ${tokens.secondaryColor}

Brand name: ${brandName}
Brand voice: ${tokens.brandVoice}
Font family: ${tokens.fontFamily}`;
}
