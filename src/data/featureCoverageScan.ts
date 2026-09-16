/// <reference types="vite/client" />
import { classifyFeatureIds, FeatureCoverage } from './featureCoverage';

// Raw source of every screen and shared component, bundled at build time.
const SOURCES = import.meta.glob(['../views/**/*.tsx', '../components/**/*.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const FEATURE_COVERAGE: Map<string, FeatureCoverage> = classifyFeatureIds(Object.values(SOURCES));
