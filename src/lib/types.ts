
export type UserRole = 'admin' | 'student';

export interface Student {
  id: string;
  name: string;
  mobile: string;
  password?: string; // Added for student login
  seatNumber: number | null;
  membershipStartDate: string;
  membershipExpiryDate: string;
  // Firestore fallbacks
  joinDate?: string;
  expiryDate?: string;
  feeStatus?: string;
  role: UserRole;
  createdAt: string;
}

export interface LibraryStats {
  totalSeats: number;
  occupiedSeats: number;
  vacantSeats: number;
  totalStudents: number;
  expiringSoon: number;
}
