// Mock hostel API. Swap for GET /students/:id/hostel later.
import { mockDelay } from '../lib/store';
import { HostelView, hostelFor } from '../data/hostel';

export const hostelService = {
  forStudent: (studentId: string): Promise<HostelView | null> => mockDelay(hostelFor(studentId)),
};
