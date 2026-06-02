
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LogIn, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
  const [mobile, setMobile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile) return;

    setIsLoading(true);
    try {
      // For Admin demo purposes, let's say "9999999999" is admin
      if (mobile === "9999999999") {
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("userMobile", mobile);
        router.push("/admin/dashboard");
        return;
      }

      // Check Firestore for student
      const q = query(collection(db, "students"), where("mobile", "==", mobile));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const studentData = querySnapshot.docs[0].data();
        localStorage.setItem("userRole", "student");
        localStorage.setItem("userMobile", mobile);
        localStorage.setItem("studentId", querySnapshot.docs[0].id);
        router.push("/student/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Mobile number not found. Please contact the administrator.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="bg-primary p-4 rounded-2xl shadow-lg shadow-primary/20">
              <BookOpen className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold font-headline text-primary tracking-tight">BHATI STUDY POINT</h1>
          <p className="text-muted-foreground font-medium">Premier Library Management System</p>
        </div>

        <Card className="border-none shadow-xl bg-card/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Welcome Back</CardTitle>
            <CardDescription>Login with your registered mobile number</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter 10 digit number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="h-12 text-lg"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-medium" disabled={isLoading}>
                {isLoading ? (
                  "Verifying..."
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Enter Library
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Demo Admin: 9999999999
        </p>
      </div>
    </div>
  );
}
