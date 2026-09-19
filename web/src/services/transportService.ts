// Mock transport API. Swap for GET /students/:id/transport and a live-location feed later.
import { mockDelay } from '../lib/store';
import { Allocation, TripState, allocationFor, tripState } from '../data/transport';

export const transportService = {
  allocation: (studentId: string): Promise<Allocation | null> => mockDelay(allocationFor(studentId)),
  /** Simulated position; a real client would subscribe to the vehicle's GPS feed (TRN-008). */
  trip: (allocation: Allocation, now: string): TripState => tripState(allocation.route, now, allocation.pickup),
};
