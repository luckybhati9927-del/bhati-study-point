
"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { SeatGrid } from "@/components/seats/SeatGrid";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Student } from "@/lib/types";
import { Users, UserPlus, AlertCircle, Sparkles, Clock } from "lucide-react";
import { aiMembershipStatusOverview } from "@/ai/flows/membership-status-categorization";
import { differenceInDays, parseISO, startOfDay } from "date-fns";

export default function AdminDashboard() {
  // Initialize with an empty array to ensure NO mock data exists
  const [students, setStudents] = useState<Student[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("Analyzing membership health...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[Dashboard] Connecting to Firestore 'students' collection...");
    const unsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
      // Create fresh array from snapshot docs ONLY
      const studentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      
      console.log("[Dashboard] Students loaded from Firestore count:", studentData.length);
      setStudents(studentData);
      setLoading(false);
      
      if (studentData.length > 0) {
        aiMembershipStatusOverview({ 
          students: studentData.map(s => ({
            id: s.id,
            name: s.name,
            membershipStartDate: s.membershipStartDate || s.joinDate || "",
            membershipExpiryDate: s.membershipExpiryDate || s.expiryDate || ""
          }))
        }).then(res => setAiSummary(res.summary));
      } else {
        setAiSummary("No students registered yet.");
      }
    }, (error) => {
      console.error("[Dashboard] Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const totalSeats = 70;
  // Calculate occupied seats directly from the Firestore-sourced students array
  const occupiedSeats = students.filter(s => s.seatNumber !== null && s.seatNumber !== undefined).length;
  const vacantSeats = totalSeats - occupiedSeats;
  
  const today = startOfDay(new Date());
  
  const expiringSoonCount = students.filter(s => {
    const expiryStr = s.membershipExpiryDate || s.expiryDate;
    if (!expiryStr) return false;
    try {
      const exp = startOfDay(parseISO(expiryStr));
      const days = differenceInDays(exp, today);
      return days >= 0 && days <= 7;
    } catch (e) {
      return false;
    }
  }).length;
  
  const expiredCount = students.filter(s => {
    const expiryStr = s.membershipExpiryDate || s.expiryDate;
    if (!expiryStr) return false;
    try {
      const exp = startOfDay(parseISO(expiryStr));
      return differenceInDays(exp, today) < 0;
    } catch (e) {
      return false;
    }
  }).length;

  const stats = [
    { label: "Total Students", value: students.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Expiring Soon", value: expiringSoonCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Vacant Seats", value: vacantSeats, icon: UserPlus, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Expired", value: expiredCount, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" />
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold font-headline tracking-tight">Admin Control Center</h1>
          <p className="text-muted-foreground">Real-time overview of library operations and occupancy.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold font-headline mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.bg} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-headline">Seat Visualizer</CardTitle>
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest">70 Seats Total</div>
            </CardHeader>
            <CardContent>
              <SeatGrid students={students} isAdmin={true} />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary/5">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Membership Pulse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                  <p className="text-sm leading-relaxed text-muted-foreground italic">
                    "{aiSummary}"
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent Activity</h4>
                  <div className="space-y-2">
                    {students.slice(-3).reverse().map(s => (
                      <div key={s.id} className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground text-[10px] ml-auto">
                          {(s.membershipStartDate || s.joinDate || "N/A")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
