/** The id of a section's heading, which the section names itself after (`aria-labelledby`). */
export function titleIdFromSectionId(sectionId: string): string {
  return `${sectionId}-title`;
}
