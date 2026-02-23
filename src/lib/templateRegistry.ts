/**
 * Template Registry
 * 
 * Maps template IDs to their .riv file paths in the public directory.
 * All .riv files should be placed in public/templates/
 */

export const TEMPLATE_REGISTRY: Record<string, string> = {
  'test-template': '/templates/test-template.riv',
  // future templates added here
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
