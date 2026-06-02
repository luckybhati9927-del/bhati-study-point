
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Student } from "@/lib/types";
import { Users, Info } from "lucide-react";

interface SeatGridProps {
  students: Student[];
  onSeatClick?: (seatNumber: number) => void;
  isAdmin?: boolean;
}

export function SeatGrid({ students, onSeatClick, isAdmin }: SeatGridProps) {
  const TOTAL_SEATS = 70;
  const seats = Array.from({ length: TOTAL_SEATS }, (_, i) => i + 1);

  const getStudentForSeat = (seatNum: number) => {
    return students.find(s => s.seatNumber === seatNum);
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-center sm:justify-start">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted border"></div>
          <span className="text-sm font-medium">Vacant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary"></div>
          <span className="text-sm font-medium">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-destructive"></div>
          <span className="text-sm font-medium">Expired</span>
        </div>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 lg:grid-cols-14 gap-2">
        <TooltipProvider>
          {seats.map((seatNum) => {
            const student = getStudentForSeat(seatNum);
            const isOccupied = !!student;
            const isExpired = isOccupied && new Date(student.membershipExpiryDate) < new Date();

            return (
              <Tooltip key={seatNum}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSeatClick?.(seatNum)}
                    className={cn(
                      "aspect-square rounded-md border text-xs font-bold transition-all duration-200 flex items-center justify-center relative overflow-hidden group",
                      !isOccupied && "bg-muted hover:bg-secondary border-border text-muted-foreground",
                      isOccupied && !isExpired && "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20",
                      isExpired && "bg-destructive border-destructive text-destructive-foreground shadow-sm shadow-destructive/20",
                      isAdmin && "hover:ring-2 hover:ring-offset-2 hover:ring-primary/50 cursor-pointer"
                    )}
                  >
                    {seatNum}
                    {isOccupied && (
                      <div className="absolute -right-1 -bottom-1 opacity-20 group-hover:opacity-40 transition-opacity">
                        <Users className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-bold">Seat {seatNum}</p>
                    {student ? (
                      <>
                        <p className="text-xs">{student.name}</p>
                        <p className="text-[10px] text-muted-foreground">Exp: {student.membershipExpiryDate}</p>
                      </>
                    ) : (
                      <p className="text-xs">Available</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}
