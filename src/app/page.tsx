
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LogIn, BookOpen, ShieldCheck, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, getDocs } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Clear any stale sessions on the login page
    localStorage.removeItem("userRole");
    localStorage.removeItem("userMobile");
    localStorage.removeItem("studentId");
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("userEmail", email);
      toast({ title: "Welcome, Admin", description: "Authenticated successfully." });
      router.push("/admin/dashboard");
    } catch (error: any) {
      console.error("Admin Login Error:", error);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "Invalid admin credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || !password) return;

    setIsLoading(true);
    try {
      const q = query(collection(db, "students"), where("mobile", "==", mobile));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        const studentData = studentDoc.data();
        
        if (studentData.password === password) {
          localStorage.setItem("userRole", "student");
          localStorage.setItem("userMobile", mobile);
          localStorage.setItem("studentId", studentDoc.id);
          toast({ title: "Login Successful", description: `Welcome back, ${studentData.name}.` });
          router.push("/student/dashboard");
        } else {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Incorrect password for this mobile number.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Account Not Found",
          description: "Mobile number not registered. Please contact admin.",
        });
      }
    } catch (error: any) {
      console.error("Student Login Error:", error);
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
          <h1 className="text-4xl font-bold font-headline text-primary tracking-tight uppercase">Bhati Study Point</h1>
          <p className="text-muted-foreground font-medium">Secure Library Access Portal</p>
        </div>

        <Card className="border-none shadow-xl bg-card/80 backdrop-blur-md">
          <CardContent className="pt-6">
            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Student
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="student">
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="10 digit number"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s-password">Password</Label>
                    <Input
                      id="s-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={isLoading}>
                    {isLoading ? "Authenticating..." : "Enter Library"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Admin Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="a-password">Admin Password</Label>
                    <Input
                      id="a-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Administrator Login"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="bg-muted/50 p-4 rounded-lg text-center space-y-1">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Demo Credentials</p>
          <div className="text-xs text-muted-foreground/80 space-y-1">
            <p>Admin: admin@bhati.com / admin123</p>
            <p>Students: Use their mobile + registered password</p>
          </div>
        </div>
      </div>
    </div>
  );
}
