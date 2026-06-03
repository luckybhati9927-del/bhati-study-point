
"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { SeatGrid } from "@/components/seats/SeatGrid";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Student } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AdminSeats() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [targetStudentId, setTargetStudentId] = useState<string>("none");
  const { toast } = useToast();

  useEffect(() => {
    console.log("[Seats] Listening to Firestore students...");
    const unsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
      const studentData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Student[];
      
      console.log("[Seats] Total documents from Firestore:", studentData.length);
      // Replaces the entire list to avoid duplicates
      setStudents(studentData);
    });
    return () => unsubscribe();
  }, []);

  const handleSeatClick = (seatNum: number) => {
    setSelectedSeat(seatNum);
    const occupant = students.find(s => s.seatNumber === seatNum);
    setTargetStudentId(occupant?.id || "none");
  };

  const handleAssign = () => {
    if (selectedSeat === null) return;

    // 1. Remove previous occupant of this seat if any
    const previousOccupant = students.find(s => s.seatNumber === selectedSeat);
    if (previousOccupant && previousOccupant.id !== targetStudentId) {
      updateDoc(doc(db, "students", previousOccupant.id), { seatNumber: null })
        .catch((e) => {
          console.error("Vacate error:", e);
          toast({ variant: "destructive", title: "Error", description: "Failed to vacate old occupant." });
        });
    }

    // 2. Assign to new student if not "none"
    if (targetStudentId !== "none") {
      const studentToAssign = students.find(s => s.id === targetStudentId);
      updateDoc(doc(db, "students", targetStudentId), { seatNumber: selectedSeat })
        .then(() => {
          toast({ title: "Seat Assigned", description: `Seat ${selectedSeat} assigned to ${studentToAssign?.name}.` });
        })
        .catch((e) => {
          console.error("Assign error:", e);
          toast({ variant: "destructive", title: "Error", description: "Failed to update seat assignment." });
        });
    } else if (previousOccupant) {
      toast({ title: "Seat Vacated", description: `Seat ${selectedSeat} is now vacant.` });
    }

    setSelectedSeat(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" />
      <main className="container mx-auto p-4 sm:p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-bold font-headline">Interactive Seat Map</h1>
          <p className="text-muted-foreground">Click on any seat to manage its assignment.</p>
        </header>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-headline">Library Layout (70 Seats)</CardTitle>
              <div className="bg-secondary px-3 py-1 rounded-full text-xs font-bold text-secondary-foreground">
                {students.filter(s => s.seatNumber !== null).length} / 70 Occupied
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SeatGrid students={students} onSeatClick={handleSeatClick} isAdmin={true} />
          </CardContent>
        </Card>

        <Dialog open={selectedSeat !== null} onOpenChange={() => setSelectedSeat(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-headline">Manage Seat {selectedSeat}</DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <Label>Occupant</Label>
                <Select value={targetStudentId} onValueChange={setTargetStudentId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Vacant (No Occupant)</SelectItem>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.seatNumber ? `(Currently Seat ${s.seatNumber})` : "(Unassigned)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Assigning a student who already has a seat will move them to this seat.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleAssign} className="w-full">Update Assignment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
