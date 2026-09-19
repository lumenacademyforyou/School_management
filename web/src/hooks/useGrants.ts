import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Grant, Verb, can, grantFor } from '../data/permissions';

/** The signed-in staff member's feature grants. */
export const useGrants = () => {
  const { currentUser } = useApp();
  const role = currentUser.staffRole;
  return useMemo(
    () => ({
      role,
      can: (featureId: string, verb: Verb) => can(role, featureId, verb),
      grant: (featureId: string): Grant | undefined => grantFor(role, featureId),
      /** Tooltip explaining why an action is unavailable. */
      why: (featureId: string, verb: Verb) => {
        const g = grantFor(role, featureId);
        return g?.verbs.includes(verb) ? undefined : `${featureId}: your role holds ${g?.verbs.join(', ') || 'no access'}${g?.condition ? ` — ${g.condition}` : ''}`;
      },
    }),
    [role]
  );
};
