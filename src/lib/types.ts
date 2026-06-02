
export type UserRole = 'admin' | 'student';

export interface Student {
  id: string;
  name: string;
  mobile: string;
  seatNumber: number | null;
  membershipStartDate: string;
  membershipExpiryDate: string;
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
