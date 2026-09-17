// Transport (LMN-SMS-FEAT-001 §24, TRN-001 … TRN-010) and the parent app transport view (APP-010).
// Routes, vehicles and crew are seed data; a student's route comes from the Student 360 record.
import { INITIAL_ROSTER } from './students';

export interface Vehicle {
  id: string;
  registration: string;
  type: string;
  capacity: number;
  onBoard: number;
  gps: boolean;
  fitnessValidTill: string;
  insuranceValidTill: string;
}

export interface CrewMember {
  id: string;
  name: string;
  role: 'Driver' | 'Attendant';
  phone: string;
  /** Driving licence for drivers, police verification for attendants. */
  credential: string;
  experienceYears: number;
}

export interface Stop {
  id: string;
  name: string;
  landmark: string;
  /** Morning pickup and afternoon drop times (24 h). */
  pickup: string;
  drop: string;
  /** Position on the route diagram, 0–100. */
  x: number;
  y: number;
}

export interface Route {
  id: string;
  number: string;
  name: string;
  vehicleId: string;
  driverId: string;
  attendantId: string;
  /** Stops in morning order; the last one is the school. */
  stops: Stop[];
}

export const SCHOOL_STOP_NAME = 'School Main Gate';

export const VEHICLES: Vehicle[] = [
  { id: 'V-03', registration: 'TN 09 BX 4521', type: 'School bus · 40 seats', capacity: 40, onBoard: 31, gps: true, fitnessValidTill: '2025-03-31', insuranceValidTill: '2025-01-14' },
  { id: 'V-04', registration: 'TN 22 CK 1187', type: 'School bus · 32 seats', capacity: 32, onBoard: 24, gps: true, fitnessValidTill: '2025-06-30', insuranceValidTill: '2025-04-02' },
  { id: 'V-05', registration: 'TN 07 AZ 9034', type: 'Mini bus · 24 seats', capacity: 24, onBoard: 19, gps: true, fitnessValidTill: '2024-12-31', insuranceValidTill: '2025-02-20' },
  { id: 'V-06', registration: 'TN 14 DE 3310', type: 'School bus · 40 seats', capacity: 40, onBoard: 36, gps: false, fitnessValidTill: '2025-05-15', insuranceValidTill: '2025-05-15' },
  { id: 'V-14', registration: 'TN 09 BY 7702', type: 'School bus · 48 seats', capacity: 48, onBoard: 42, gps: true, fitnessValidTill: '2025-08-31', insuranceValidTill: '2025-07-10' },
];

export const CREW: CrewMember[] = [
  { id: 'D-11', name: 'Mr. M. Selvaraj', role: 'Driver', phone: '+91 94440 71103', credential: 'Licence TN09 2008 0041123 · valid to 2028', experienceYears: 16 },
  { id: 'A-11', name: 'Mrs. K. Jayanthi', role: 'Attendant', phone: '+91 94440 71104', credential: 'Police verification 2024-04', experienceYears: 7 },
  { id: 'D-12', name: 'Mr. P. Ravi', role: 'Driver', phone: '+91 94440 71203', credential: 'Licence TN22 2011 0098812 · valid to 2027', experienceYears: 12 },
  { id: 'A-12', name: 'Ms. S. Latha', role: 'Attendant', phone: '+91 94440 71204', credential: 'Police verification 2024-05', experienceYears: 4 },
  { id: 'D-13', name: 'Mr. A. Karim', role: 'Driver', phone: '+91 94440 71303', credential: 'Licence TN07 2006 0012290 · valid to 2026', experienceYears: 18 },
  { id: 'A-13', name: 'Mrs. R. Devi', role: 'Attendant', phone: '+91 94440 71304', credential: 'Police verification 2024-03', experienceYears: 9 },
  { id: 'D-14', name: 'Mr. V. Murugan', role: 'Driver', phone: '+91 94440 71403', credential: 'Licence TN14 2010 0055671 · valid to 2029', experienceYears: 13 },
  { id: 'A-14', name: 'Mrs. G. Mary', role: 'Attendant', phone: '+91 94440 71404', credential: 'Police verification 2024-06', experienceYears: 6 },
  { id: 'D-15', name: 'Mr. S. Kannan', role: 'Driver', phone: '+91 94440 71503', credential: 'Licence TN09 2005 0033018 · valid to 2027', experienceYears: 19 },
  { id: 'A-15', name: 'Ms. P. Anitha', role: 'Attendant', phone: '+91 94440 71504', credential: 'Police verification 2024-04', experienceYears: 5 },
];

const stop = (id: string, name: string, landmark: string, pickup: string, drop: string, x: number, y: number): Stop => ({ id, name, landmark, pickup, drop, x, y });
const school = (routeId: string, pickup: string, drop: string): Stop => stop(`${routeId}-SCH`, SCHOOL_STOP_NAME, 'Lumen Academy, Guindy', pickup, drop, 92, 50);

export const ROUTES: Route[] = [
  {
    id: 'R-03',
    number: 'Route 3',
    name: 'Adyar – Guindy',
    vehicleId: 'V-03',
    driverId: 'D-11',
    attendantId: 'A-11',
    stops: [
      stop('R-03-1', 'Besant Nagar Depot', 'Near Elliot’s Beach bus stand', '07:05', '16:25', 6, 70),
      stop('R-03-2', 'Adyar Signal', 'Opposite Adyar Ananda Bhavan', '07:15', '16:15', 26, 58),
      stop('R-03-3', 'Kotturpuram MRTS', 'Station entrance, west side', '07:24', '16:06', 44, 40),
      stop('R-03-4', 'Saidapet Bridge', 'Bus bay after the bridge', '07:35', '15:55', 64, 30),
      school('R-03', '07:50', '15:40'),
    ],
  },
  {
    id: 'R-04',
    number: 'Route 4',
    name: 'Velachery – Guindy',
    vehicleId: 'V-04',
    driverId: 'D-12',
    attendantId: 'A-12',
    stops: [
      stop('R-04-1', 'Velachery Lake', 'Phoenix Mall side gate', '07:10', '16:20', 8, 30),
      stop('R-04-2', 'Vijayanagar Bus Stand', 'Platform 2', '07:22', '16:08', 38, 45),
      stop('R-04-3', 'Kathipara Junction', 'Metro exit B', '07:38', '15:52', 66, 62),
      school('R-04', '07:50', '15:40'),
    ],
  },
  {
    id: 'R-05',
    number: 'Route 5',
    name: 'T. Nagar – Guindy',
    vehicleId: 'V-05',
    driverId: 'D-13',
    attendantId: 'A-13',
    stops: [
      stop('R-05-1', 'Pondy Bazaar', 'Near Panagal Park', '07:12', '16:22', 10, 20),
      stop('R-05-2', 'Mambalam Station', 'East entrance', '07:24', '16:10', 36, 34),
      stop('R-05-3', 'Ashok Pillar', 'Bus stop, south side', '07:36', '15:56', 62, 44),
      school('R-05', '07:50', '15:40'),
    ],
  },
  {
    id: 'R-06',
    number: 'Route 6',
    name: 'Tambaram – Guindy',
    vehicleId: 'V-06',
    driverId: 'D-14',
    attendantId: 'A-14',
    stops: [
      stop('R-06-1', 'Tambaram East', 'Railway station forecourt', '06:50', '16:40', 6, 80),
      stop('R-06-2', 'Chromepet', 'MIT gate', '07:05', '16:25', 28, 68),
      stop('R-06-3', 'Pallavaram', 'Bus stand', '07:18', '16:12', 50, 56),
      stop('R-06-4', 'Meenambakkam', 'Metro exit A', '07:32', '15:58', 72, 50),
      school('R-06', '07:50', '15:40'),
    ],
  },
  {
    id: 'R-14',
    number: 'Route 14',
    name: 'Medavakkam – Guindy',
    vehicleId: 'V-14',
    driverId: 'D-15',
    attendantId: 'A-15',
    stops: [
      stop('R-14-1', 'Medavakkam Junction', 'Near the temple arch', '07:00', '16:30', 6, 55),
      stop('R-14-2', 'Kovilambakkam Bus Bay', 'Opposite the bank', '07:12', '16:18', 24, 40),
      stop('R-14-3', 'Madipakkam Lake View', 'Lake road corner', '07:24', '16:08', 44, 60),
      stop('R-14-4', 'Velachery Bypass', 'Petrol bunk stop', '07:36', '15:56', 66, 42),
      school('R-14', '07:52', '15:40'),
    ],
  },
];

/** Where each transport student boards. Anyone not listed boards at the first stop. */
const PICKUP_STOP: Record<string, string> = {
  'ros-01': 'R-14-4',
  'ros-07': 'R-03-2',
  'ros-08': 'R-03-2',
};

export interface Allocation {
  studentId: string;
  route: Route;
  vehicle: Vehicle;
  driver: CrewMember;
  attendant: CrewMember;
  pickup: Stop;
  drop: Stop;
}

const byNumber = (label: string) => ROUTES.find(r => r.number === label);

/** A student's transport, or null for own transport (TRN-005). */
export const allocationFor = (studentId: string): Allocation | null => {
  const s = INITIAL_ROSTER.find(x => x.id === studentId);
  const route = s?.transportRoute ? byNumber(s.transportRoute) : undefined;
  if (!route) return null;
  const pickup = route.stops.find(x => x.id === PICKUP_STOP[studentId]) ?? route.stops[0];
  return {
    studentId,
    route,
    vehicle: VEHICLES.find(v => v.id === route.vehicleId)!,
    driver: CREW.find(c => c.id === route.driverId)!,
    attendant: CREW.find(c => c.id === route.attendantId)!,
    pickup,
    drop: route.stops[route.stops.length - 1],
  };
};

// ---------------------------------------------------------------------------
// Simulated trip (TRN-008, TRN-009). Nothing here talks to a GPS device.
// ---------------------------------------------------------------------------

export type TripPhase = 'Not started' | 'On route' | 'Reached school' | 'Drop trip on route' | 'All dropped';

export interface TripState {
  phase: TripPhase;
  /** Where the bus is on the diagram. */
  x: number;
  y: number;
  /** The last stop passed and the next one, in trip order. */
  lastStop?: Stop;
  nextStop?: Stop;
  updatedAt: string;
  /** Minutes until the bus reaches this student's stop, when it is on its way there. */
  etaMinutes?: number;
}

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const clock = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

export const tripState = (route: Route, now: string, myStop?: Stop): TripState => {
  const t = minutes(now);
  const morning = route.stops.map(s => ({ s, at: minutes(s.pickup) }));
  const evening = [...route.stops].reverse().map(s => ({ s, at: minutes(s.drop) }));
  const along = (legs: { s: Stop; at: number }[], phase: TripPhase, target?: Stop): TripState => {
    const i = legs.findIndex(l => l.at > t);
    const prev = legs[i - 1];
    const next = legs[i];
    const f = (t - prev.at) / (next.at - prev.at);
    const mine = target ? legs.find(l => l.s.id === target.id) : undefined;
    return {
      phase,
      x: prev.s.x + (next.s.x - prev.s.x) * f,
      y: prev.s.y + (next.s.y - prev.s.y) * f,
      lastStop: prev.s,
      nextStop: next.s,
      updatedAt: clock(t - (t % 2)),
      etaMinutes: mine && mine.at >= t ? mine.at - t : undefined,
    };
  };
  const first = morning[0];
  const arrive = morning[morning.length - 1];
  const leave = evening[0];
  const last = evening[evening.length - 1];
  if (t < first.at) return { phase: 'Not started', x: first.s.x, y: first.s.y, nextStop: first.s, updatedAt: clock(t), etaMinutes: myStop ? minutes(myStop.pickup) - t : undefined };
  if (t < arrive.at) return along(morning, 'On route', myStop);
  if (t < leave.at) return { phase: 'Reached school', x: arrive.s.x, y: arrive.s.y, lastStop: arrive.s, updatedAt: arrive.s.pickup };
  if (t < last.at) return along(evening, 'Drop trip on route', myStop);
  return { phase: 'All dropped', x: last.s.x, y: last.s.y, lastStop: last.s, updatedAt: last.s.drop };
};
