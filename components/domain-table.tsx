"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  MoreHorizontal,
  Trash2,
  ArrowUpDown,
  AlertTriangle,
  Clock,
} from "lucide-react";
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
import type { Domain } from "@/types/domain";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface DomainTableProps {
  domains: Domain[];
  onEdit: (domain: Domain) => void;
  onDelete: (id: string) => void;
}

type SortField = "name" | "expireDate" | "company" | "registrar" | "status";
type SortDirection = "asc" | "desc";

export function DomainTable({ domains, onEdit, onDelete }: DomainTableProps) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getDaysUntilExpiry = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(dateString);
    expiryDate.setHours(0, 0, 0, 0);

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const getExpiryStatus = (dateString: string) => {
    const daysUntilExpiry = getDaysUntilExpiry(dateString);

    if (daysUntilExpiry < 0) {
      return {
        status: "expired",
        className: "bg-red-100 dark:bg-red-900/30",
        sortValue: 3,
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: "expiring-soon",
        className: "bg-amber-100 dark:bg-amber-900/30",
        sortValue: 2,
      };
    }

    return { status: "active", className: "", sortValue: 1 };
  };

  const sortedDomains = [...domains].sort((a, b) => {
    if (sortField === "status") {
      const aStatus = getExpiryStatus(a.expireDate).sortValue;
      const bStatus = getExpiryStatus(b.expireDate).sortValue;

      return sortDirection === "asc" ? aStatus - bStatus : bStatus - aStatus;
    } else {
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";

      const aString = String(aValue);
      const bString = String(bValue);

      if (sortDirection === "asc") {
        return aString.localeCompare(bString);
      } else {
        return bString.localeCompare(aString);
      }
    }
  });

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Spis domen</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 font-semibold"
                    >
                      Domena
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("expireDate")}
                      className="flex items-center gap-1 font-semibold"
                    >
                      Data wygaśnięcia
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("company")}
                      className="flex items-center gap-1 font-semibold"
                    >
                      Spółka
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("registrar")}
                      className="flex items-center gap-1 font-semibold"
                    >
                      Rejestrator
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-1 font-semibold"
                    >
                      Status
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[80px]">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDomains.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No domains found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedDomains.map((domain) => {
                    const { status, className } = getExpiryStatus(
                      domain.expireDate
                    );
                    const daysUntilExpiry = getDaysUntilExpiry(
                      domain.expireDate
                    );

                    return (
                      <TableRow key={domain.id} className={className}>
                        <TableCell className="font-medium">
                          {domain.name}
                        </TableCell>
                        <TableCell>{formatDate(domain.expireDate)}</TableCell>
                        <TableCell>{domain.company}</TableCell>
                        <TableCell>{domain.registrar || "Unknown"}</TableCell>
                        <TableCell>
                          {status === "expired" ? (
                            <Badge
                              variant="destructive"
                              className="flex items-center gap-1"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Expired
                            </Badge>
                          ) : status === "expiring-soon" ? (
                            <Badge
                              variant="outline"
                              className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 flex items-center gap-1"
                            >
                              <Clock className="h-3 w-3" />
                              {daysUntilExpiry} days
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            >
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEdit(domain)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => confirmDelete(domain.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              domain from your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
