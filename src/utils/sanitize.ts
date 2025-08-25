export function sanitizeBranchName(branch: string): string {
  // Replace common special characters with hyphens
  return branch
    .replace(/[\\/:\s*?"<>|]/g, '-') // Replace special chars with hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-{2,}/g, '-') // Replace multiple hyphens with single
    .toLowerCase() // Convert to lowercase for consistency
}

export function createWorktreeName(branch: string, prefix: string): string {
  const sanitized = sanitizeBranchName(branch)
  return `${prefix}${sanitized}`
}