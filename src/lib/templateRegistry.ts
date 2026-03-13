/**
 * Template Registry
 * 
 * Maps template IDs to their .riv file paths in the public directory.
 * All .riv files should be placed in public/templates/
 */

export const TEMPLATE_REGISTRY: Record<string, string> = {
  'leaderboard': '/templates/banner-728x90.riv',
  'medium-rectangle': '/templates/banner-300x250.riv',
  'half-page': '/templates/banner-300x600.riv',
  'billboard': '/templates/banner-970x250.riv',
  'mobile-banner': '/templates/banner-320x50.riv',
};

/**
 * Resolves a template ID to its .riv file path
 * @throws Error if template ID is not registered
 */
export function getTemplatePath(templateId: string): string {
  const path = TEMPLATE_REGISTRY[templateId];
  if (!path) throw new Error(`Unknown template ID: "${templateId}"`);
  return path;
}
