
"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  orderBy
} from "firebase/firestore";
import { Student } from "@/lib/types";
import { Search, Plus, Edit, Trash2, ShieldCheck, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { differenceInDays, parseISO, startOfDay } from "date-fns";

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    seatNumber: "",
    membershipStartDate: new Date().toISOString().split('T')[0],
    membershipExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const studentsCollection = collection(db, "students");

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("[Students] Manual fetch from Firestore...");
      const q = query(studentsCollection, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const studentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      
      console.log("[Students] Fetched count:", studentData.length);
      // Replaces state with exactly what is in Firestore
      setStudents(studentData);
    } catch (error: any) {
      console.error("[Students] Fetch error:", error);
      toast({
        variant: "destructive",
        title: "Database Error",
        description: error.message || "Could not fetch student records.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const seatNum = formData.seatNumber ? parseInt(formData.seatNumber) : null;

    if (seatNum !== null) {
      const isOccupied = students.some(s => 
        s.seatNumber === seatNum && s.id !== editingStudent?.id
      );

      if (isOccupied) {
        toast({
          variant: "destructive",
          title: "Seat Busy",
          description: `Seat ${seatNum} is already taken by another student.`,
        });
        return;
      }
    }

    setIsSaving(true);
    console.log("[Students] Initiating save request...");

    const studentData = {
      name: formData.name,
      mobile: formData.mobile,
      seatNumber: seatNum,
      membershipStartDate: formData.membershipStartDate,
      membershipExpiryDate: formData.membershipExpiryDate,
      // Consistency fields
      joinDate: formData.membershipStartDate,
      expiryDate: formData.membershipExpiryDate,
      role: "student" as const,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingStudent) {
        console.log("[Students] Updating existing doc:", editingStudent.id);
        await updateDoc(doc(db, "students", editingStudent.id), studentData);
        toast({ title: "Updated", description: "Student record has been updated." });
      } else {
        console.log("[Students] Adding new doc...");
        const docRef = await addDoc(studentsCollection, {
          ...studentData,
          createdAt: new Date().toISOString(),
        });
        console.log("[Students] New doc added with ID:", docRef.id);
        toast({ title: "Registered", description: "New student added to database." });
      }

      setIsAddOpen(false);
      setEditingStudent(null);
      await loadStudents();
    } catch (error: any) {
      console.error("[Students] Save error:", error);
      toast({
        variant: "destructive",
        title: "Firestore Error",
        description: `Save failed: ${error.message || "Network or permission error."}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      console.log("[Students] Deleting doc:", studentToDelete);
      await deleteDoc(doc(db, "students", studentToDelete));
      toast({ title: "Deleted", description: "Record removed from database." });
      await loadStudents();
    } catch (error: any) {
      console.error("[Students] Delete error:", error);
      toast({ 
        variant: "destructive", 
        title: "Delete Failed", 
        description: error.message || "Failed to delete record." 
      });
    }
    setStudentToDelete(null);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.mobile.includes(search)
  );

  const getStatus = (student: Student) => {
    const today = startOfDay(new Date());
    const expiryStr = student.membershipExpiryDate || student.expiryDate;
    if (!expiryStr) return { label: "Unknown", color: "bg-muted text-muted-foreground", icon: AlertTriangle };
    
    try {
      const exp = startOfDay(parseISO(expiryStr));
      const days = differenceInDays(exp, today);

      if (days < 0) return { label: "Expired", color: "bg-destructive text-destructive-foreground", icon: AlertTriangle };
      if (days <= 7) return { label: "Expiring Soon", color: "bg-warning text-warning-foreground", icon: Clock };
      return { label: "Active", color: "bg-success text-success-foreground", icon: ShieldCheck };
    } catch (e) {
      return { label: "Invalid Date", color: "bg-muted text-muted-foreground", icon: AlertTriangle };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" />
      <main className="container mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline text-primary tracking-tight">Manage Students</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
              {isLoading ? "Fetching data..." : `Syncing ${students.length} records`}
            </p>
          </div>
          <Button onClick={() => { 
            setEditingStudent(null); 
            setFormData({
              name: "",
              mobile: "",
              seatNumber: "",
              membershipStartDate: new Date().toISOString().split('T')[0],
              membershipExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            });
            setIsAddOpen(true); 
          }}>
            <Plus className="mr-2 h-4 w-4" /> Add Student
          </Button>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or mobile..."
                className="pl-10 h-11 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead>Student</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Seat</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Syncing records...</TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No records found.</TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => {
                    const status = getStatus(student);
                    return (
                      <TableRow key={student.id} className="group">
                        <TableCell><div className="font-bold">{student.name}</div></TableCell>
                        <TableCell className="text-muted-foreground">{student.mobile}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            student.seatNumber ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {student.seatNumber ? `Seat ${student.seatNumber}` : "Unassigned"}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase", status.color)}>
                            <status.icon className="h-3 w-3" />
                            {status.label}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => {
                              setEditingStudent(student);
                              setFormData({
                                name: student.name,
                                mobile: student.mobile,
                                seatNumber: student.seatNumber?.toString() || "",
                                membershipStartDate: student.membershipStartDate || student.joinDate || "",
                                membershipExpiryDate: student.membershipExpiryDate || student.expiryDate || "",
                              });
                              setIsAddOpen(true);
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setStudentToDelete(student.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isAddOpen} onOpenChange={(open) => !isSaving && setIsAddOpen(open)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl text-primary">
                {editingStudent ? "Edit Student" : "Add Student"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input required disabled={isSaving} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input required disabled={isSaving} value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Seat (1-70)</Label>
                  <Input type="number" min="1" max="70" disabled={isSaving} value={formData.seatNumber} onChange={e => setFormData({...formData, seatNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" disabled={isSaving} value={formData.membershipStartDate} onChange={e => setFormData({...formData, membershipStartDate: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" required disabled={isSaving} value={formData.membershipExpiryDate} onChange={e => setFormData({...formData, membershipExpiryDate: e.target.value})} />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? "Syncing..." : (editingStudent ? "Update Record" : "Save to Firestore")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Record?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently remove the student from the database. This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
