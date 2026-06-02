
"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { SeatGrid } from "@/components/seats/SeatGrid";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
import { Student } from "@/lib/types";
import { Calendar, Clock, MapPin, User, ArrowRight, ShieldCheck } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

export default function StudentDashboard() {
  const [student, setStudent] = useState<Student | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentId = localStorage.getItem("studentId");
    if (studentId) {
      const fetchStudent = async () => {
        const docRef = doc(db, "students", studentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStudent({ id: docSnap.id, ...docSnap.data() } as Student);
        }
      };
      fetchStudent();
    }

    const unsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
      setAllStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading portal...</div>;

  const totalSeats = 70;
  const occupiedCount = allStudents.filter(s => s.seatNumber !== null).length;
  const vacantCount = totalSeats - occupiedCount;
  
  const remainingDays = student 
    ? differenceInDays(parseISO(student.membershipExpiryDate), new Date()) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="student" />
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold">
            <ShieldCheck className="h-5 w-5" />
            Personal Study Passport
          </div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Welcome, {student?.name}</h1>
          <p className="text-muted-foreground">Your focus-driven environment details.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-none shadow-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row justify-between gap-8 h-full">
                <div className="space-y-6 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-white/70 text-sm font-medium">Assigned Space</p>
                      <p className="text-3xl font-bold font-headline">Seat {student?.seatNumber || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-white/70 text-sm font-medium">Time Remaining</p>
                      <p className="text-3xl font-bold font-headline">{remainingDays > 0 ? `${remainingDays} Days` : "Expired"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col justify-end items-end space-y-4">
                  <div className="text-right">
                    <p className="text-white/70 text-sm">Valid Until</p>
                    <p className="text-xl font-bold">{student?.membershipExpiryDate}</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 w-full sm:w-auto">
                    <div className="flex justify-between items-center gap-4 text-xs font-bold uppercase tracking-widest">
                      <span>Status</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded",
                        remainingDays > 0 ? "bg-emerald-400 text-emerald-950" : "bg-rose-400 text-rose-950"
                      )}>
                        {remainingDays > 0 ? "Active" : "Expired"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-headline">Library Pulse</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center gap-6">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Occupancy</span>
                <span className="text-primary font-bold">{Math.round((occupiedCount / totalSeats) * 100)}% Full</span>
              </div>
              <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-1000" 
                  style={{ width: `${(occupiedCount / totalSeats) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Occupied</p>
                  <p className="text-2xl font-bold font-headline">{occupiedCount}</p>
                </div>
                <div className="bg-muted p-4 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Vacant</p>
                  <p className="text-2xl font-bold font-headline">{vacantCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Live Seat Map</CardTitle>
          </CardHeader>
          <CardContent>
            <SeatGrid students={allStudents} isAdmin={false} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
