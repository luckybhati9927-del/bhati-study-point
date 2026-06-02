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
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Student } from "@/lib/types";
import { Search, Plus, Edit, Trash2, Calendar, ShieldCheck, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { differenceInDays, parseISO, startOfDay } from "date-fns";

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "students"));
      const studentData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      setStudents(studentData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to load students from Firestore.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const seatNum = formData.seatNumber ? parseInt(formData.seatNumber) : null;

    if (seatNum !== null) {
      const isOccupied = students.some(s => 
        s.seatNumber === seatNum && s.id !== editingStudent?.id
      );

      if (isOccupied) {
        toast({
          variant: "destructive",
          title: "Seat Assignment Error",
          description: "Seat already occupied. Please select another seat.",
        });
        return;
      }
    }

    const data = {
      name: formData.name,
      mobile: formData.mobile,
      seatNumber: seatNum,
      membershipStartDate: formData.membershipStartDate,
      membershipExpiryDate: formData.membershipExpiryDate,
      role: "student" as const,
      updatedAt: new Date().toISOString(),
    };

    if (editingStudent) {
      updateDoc(doc(db, "students", editingStudent.id), data)
        .then(() => {
          toast({ title: "Updated", description: "Student updated successfully." });
          fetchStudents(); // Refresh list
        })
        .catch(() => {
          toast({ variant: "destructive", title: "Error", description: "Failed to update student." });
        });
    } else {
      addDoc(collection(db, "students"), {
        ...data,
        createdAt: new Date().toISOString(),
      })
        .then(() => {
          toast({ title: "Created", description: "New student added successfully." });
          fetchStudents(); // Refresh list
        })
        .catch(() => {
          toast({ variant: "destructive", title: "Error", description: "Failed to add student." });
        });
    }
    
    setIsAddOpen(false);
    setEditingStudent(null);
    setFormData({ 
      name: "", 
      mobile: "", 
      seatNumber: "", 
      membershipStartDate: new Date().toISOString().split('T')[0], 
      membershipExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
    });
  };

  const confirmDelete = () => {
    if (!studentToDelete) return;

    deleteDoc(doc(db, "students", studentToDelete))
      .then(() => {
        toast({ title: "Success", description: "Student deleted successfully." });
        fetchStudents(); // Refresh list
      })
      .catch(() => {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete student record." });
      });

    setStudentToDelete(null);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.mobile.includes(search)
  );

  const getStatus = (expiryDate: string) => {
    const today = startOfDay(new Date());
    const exp = startOfDay(parseISO(expiryDate));
    const days = differenceInDays(exp, today);

    if (days < 0) return { label: "Expired", color: "bg-destructive text-destructive-foreground", icon: AlertTriangle };
    if (days <= 7) return { label: "Expiring Soon", color: "bg-warning text-warning-foreground", icon: Clock };
    return { label: "Active", color: "bg-success text-success-foreground", icon: ShieldCheck };
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
              {isLoading ? "Syncing with Firestore..." : "Connected to Database"}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <Button variant="outline" size="icon" onClick={fetchStudents} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
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
            }} className="flex-1 sm:flex-initial shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Student
            </Button>
          </div>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/10">
                    <TableHead className="font-semibold">Student</TableHead>
                    <TableHead className="font-semibold">Mobile</TableHead>
                    <TableHead className="font-semibold">Seat</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        Loading student records...
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No students found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => {
                      const status = getStatus(student.membershipExpiryDate);
                      return (
                        <TableRow key={student.id} className="group transition-colors">
                          <TableCell>
                            <div className="font-bold text-foreground">{student.name}</div>
                          </TableCell>
                          <TableCell className="text-muted-foreground font-medium">{student.mobile}</TableCell>
                          <TableCell>
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              student.seatNumber 
                                ? "bg-primary/10 text-primary border border-primary/20" 
                                : "bg-muted text-muted-foreground border border-muted-foreground/10"
                            )}>
                              {student.seatNumber ? `Seat ${student.seatNumber}` : "Unassigned"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", status.color)}>
                              <status.icon className="h-3 w-3" />
                              {status.label}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1 ml-1 flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" />
                              {student.membershipExpiryDate}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => {
                                setEditingStudent(student);
                                setFormData({
                                  name: student.name,
                                  mobile: student.mobile,
                                  seatNumber: student.seatNumber?.toString() || "",
                                  membershipStartDate: student.membershipStartDate,
                                  membershipExpiryDate: student.membershipExpiryDate,
                                });
                                setIsAddOpen(true);
                              }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
                                onClick={() => setStudentToDelete(student.id)}
                              >
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
            </div>
          </CardContent>
        </Card>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-md border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl text-primary">{editingStudent ? "Edit Student Details" : "Add New Student"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-11 shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mobile Number</Label>
                <Input required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="h-11 shadow-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Seat (1-70)</Label>
                  <Input type="number" min="1" max="70" value={formData.seatNumber} onChange={e => setFormData({...formData, seatNumber: e.target.value})} className="h-11 shadow-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Start Date</Label>
                  <Input type="date" value={formData.membershipStartDate} onChange={e => setFormData({...formData, membershipStartDate: e.target.value})} className="h-11 shadow-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Expiry Date</Label>
                <Input type="date" required value={formData.membershipExpiryDate} onChange={e => setFormData({...formData, membershipExpiryDate: e.target.value})} className="h-11 shadow-sm border-primary/20" />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20">
                  {editingStudent ? "Update Records" : "Register Student"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this student?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove the student's records from Firestore and vacate their assigned seat.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Record
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
