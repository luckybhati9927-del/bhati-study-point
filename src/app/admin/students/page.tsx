"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Student } from "@/lib/types";
import { Search, Plus, Edit, Trash2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    seatNumber: "",
    membershipStartDate: new Date().toISOString().split('T')[0],
    membershipExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[]);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        seatNumber: formData.seatNumber ? parseInt(formData.seatNumber) : null,
        role: "student" as const,
        createdAt: new Date().toISOString(),
      };

      if (editingStudent) {
        await updateDoc(doc(db, "students", editingStudent.id), data);
        toast({ title: "Updated", description: "Student updated successfully." });
      } else {
        await addDoc(collection(db, "students"), data);
        toast({ title: "Created", description: "New student added successfully." });
      }
      setIsAddOpen(false);
      setEditingStudent(null);
      setFormData({ name: "", mobile: "", seatNumber: "", membershipStartDate: new Date().toISOString().split('T')[0], membershipExpiryDate: "" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Operation failed." });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      await deleteDoc(doc(db, "students", id));
      toast({ title: "Deleted", description: "Student record removed." });
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.mobile.includes(search)
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" />
      <main className="container mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold font-headline">Manage Students</h1>
          <Button onClick={() => { setEditingStudent(null); setIsAddOpen(true); }} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Student
          </Button>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or mobile..."
                className="pl-10 h-11"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Student</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Seat</TableHead>
                    <TableHead className="hidden md:table-cell">Membership</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const isExpired = new Date(student.membershipExpiryDate) < new Date();
                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="font-medium">{student.name}</div>
                        </TableCell>
                        <TableCell>{student.mobile}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-1 rounded-md text-xs font-bold",
                            student.seatNumber ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {student.seatNumber ? `Seat ${student.seatNumber}` : "Unassigned"}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-xs space-y-0.5">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" /> Ends {student.membershipExpiryDate}
                            </div>
                            {isExpired && <div className="text-destructive font-bold">Expired</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => {
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
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-headline">{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Seat Number (1-70)</Label>
                  <Input type="number" min="1" max="70" value={formData.seatNumber} onChange={e => setFormData({...formData, seatNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.membershipStartDate} onChange={e => setFormData({...formData, membershipStartDate: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" required value={formData.membershipExpiryDate} onChange={e => setFormData({...formData, membershipExpiryDate: e.target.value})} />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
