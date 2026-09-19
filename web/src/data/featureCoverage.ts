export type FeatureCoverage = 'On screen' | 'Deferred';

const FEATURE_ID = /\b[A-Z]{2,4}-\d{3}\b/g;
const PHASE_NOTICE = /<PhaseNotice\b[^>]*?ids=\{\[([^\]]*)\]\}/g;

/**
 * Classifies catalogue feature IDs cited in screen source code.
 * IDs that appear only inside a <PhaseNotice> are deferred; any other citation counts as on screen.
 */
export const classifyFeatureIds = (sources: string[]): Map<string, FeatureCoverage> => {
  const deferred = new Set<string>();
  const onScreen = new Set<string>();
  sources.forEach(src => {
    const noticeIds = new Set<string>();
    for (const m of src.matchAll(PHASE_NOTICE)) {
      for (const id of m[1].match(FEATURE_ID) ?? []) noticeIds.add(id);
    }
    const withoutNotices = src.replace(PHASE_NOTICE, '');
    for (const id of withoutNotices.match(FEATURE_ID) ?? []) onScreen.add(id);
    noticeIds.forEach(id => deferred.add(id));
  });
  const result = new Map<string, FeatureCoverage>();
  deferred.forEach(id => result.set(id, 'Deferred'));
  onScreen.forEach(id => result.set(id, 'On screen'));
  return result;
};
