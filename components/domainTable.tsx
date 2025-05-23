"use client";

import { useState, useCallback, useMemo } from "react";
import { authService } from "@/services/auth-service";
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
  RefreshCcw,
  MoreHorizontal,
  Trash2,
  ArrowUpDown,
  AlertTriangle,
  Clock,
  CircleDollarSign,
  Archive,
  XCircle,
  Undo,
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
  onUpdate: (domain: Domain, extendYear: number) => void;
  onDelete: (id: string) => void;
}

type SortField =
  | "id"
  | "name"
  | "expireDate"
  | "company"
  | "registrar"
  | "status";
type SortDirection = "asc" | "desc";

export function DomainTable({
  domains,
  onEdit,
  onUpdate,
  onDelete,
}: DomainTableProps) {
  const [sortField, setSortField] = useState<SortField>("expireDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [extendYear, setExtendYear] = useState(1);

  const handleIncrease = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExtendYear((prev) => Math.min(10, prev + 1));
  }, []);

  const handleDecrease = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExtendYear((prev) => Math.max(1, prev - 1));
  }, []);

  const user = authService.getUser();
  const hasDomainPermission =
    user?.group?.permissions?.includes("domains") || false;

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

  const getExpiryStatus = (domain: Domain) => {
    if (domain.archived) {
      return {
        status: "archived",
        className: "bg-gray-100 dark:bg-gray-900/30",
        sortValue: 0,
      };
    }

    if (domain.resignation) {
      return {
        status: "resigned",
        className: "bg-purple-100 dark:bg-purple-900/30",
        sortValue: 1,
      };
    }

    if (!domain.expireDate) {
      return {
        status: "requested",
        className: "bg-blue-100 dark:bg-blue-900/30",
        sortValue: 2,
      };
    }

    const daysUntilExpiry = getDaysUntilExpiry(domain.expireDate);

    if (daysUntilExpiry < 0) {
      return {
        status: "expired",
        className: "bg-red-100 dark:bg-red-900/30",
        sortValue: 5,
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: "expiring-soon",
        className: "bg-amber-100 dark:bg-amber-900/30",
        sortValue: 4,
      };
    }

    return {
      status: "active",
      className: "",
      sortValue: 3,
    };
  };

  const sortedDomains = useMemo(() => {
    return [...domains].sort((a, b) => {
      if (sortField === "status") {
        const aStatus = getExpiryStatus(a).sortValue;
        const bStatus = getExpiryStatus(b).sortValue;

        return sortDirection === "asc" ? aStatus - bStatus : bStatus - aStatus;
      } else if (sortField === "id") {
        const aId = String(a.id);
        const bId = String(b.id);
        return sortDirection === "asc"
          ? aId.localeCompare(bId)
          : bId.localeCompare(aId);
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
  }, [domains, sortField, sortDirection]);

  const domainIdMap = useMemo(() => {
    const sortedById = [...domains].sort((a, b) =>
      String(a.id).localeCompare(String(b.id))
    );
    const idMap = new Map<string, number>();
    sortedById.forEach((domain, index) => {
      idMap.set(domain.id, index + 1);
    });
    return idMap;
  }, [domains]);

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
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Spis domen</CardTitle>
          <CardTitle className="text-sm font-medium">
            Ilość domen: {domains.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] ">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("id")}
                      className="flex items-center gap-1 font-semibold"
                    >
                      ID
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
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
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nie znaleziono domen
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedDomains.map((domain, index) => {
                    const { status, className } = getExpiryStatus(domain);
                    const daysUntilExpiry = domain.expireDate
                      ? getDaysUntilExpiry(domain.expireDate)
                      : null;

                    return (
                      <TableRow key={domain.id} className={className}>
                        <TableCell className="font-medium">
                          {domainIdMap.get(domain.id)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {domain.name}
                        </TableCell>
                        <TableCell>{formatDate(domain.expireDate)}</TableCell>
                        <TableCell>{domain.company}</TableCell>
                        <TableCell>{domain.registrar || "Nieznany"}</TableCell>
                        <TableCell>
                          {status === "archived" ? (
                            <Badge
                              variant="outline"
                              className="bg-gray-200 text-gray-800 dark:bg-gray-900 dark:text-gray-100 gap-1"
                            >
                              <Archive className="h-3 w-3" />
                              Zarchiwizowana
                            </Badge>
                          ) : status === "resigned" ? (
                            <Badge
                              variant="outline"
                              className="bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-100 gap-1"
                            >
                              <XCircle className="h-3 w-3" />
                              Rezygnacja
                            </Badge>
                          ) : status === "expired" ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Wygasła
                            </Badge>
                          ) : status === "expiring-soon" ? (
                            <Badge
                              variant="outline"
                              className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 gap-1"
                            >
                              <Clock className="h-3 w-3" />
                              {daysUntilExpiry} dni
                            </Badge>
                          ) : status === "requested" ? (
                            <Badge
                              variant="outline"
                              className="bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-100 gap-1"
                            >
                              <CircleDollarSign className="h-3 w-3" />
                              Zlecenie
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            >
                              Aktywna
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Otwórz menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={!hasDomainPermission}
                                onClick={() => onEdit(domain)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edytuj
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={
                                  !hasDomainPermission ||
                                  !domain.expireDate ||
                                  domain.archived
                                }
                                onClick={() => onUpdate(domain, extendYear)}
                                className="flex items-center justify-between w-full"
                              >
                                <div className="flex items-center gap-2">
                                  <RefreshCcw className="mr-2 h-4 w-4 " />
                                  <span>Przedłuż o</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center bg-muted rounded-full px-1 py-0.5 border border-border">
                                    <button
                                      disabled={extendYear === 1}
                                      onClick={handleDecrease}
                                      className="h-6 w-6 flex items-center justify-center rounded-full bg-background hover:bg-accent transition-colors text-foreground"
                                    >
                                      <span
                                        className={`text-sm font-semibold ${
                                          extendYear === 1
                                            ? "text-gray-300"
                                            : ""
                                        }`}
                                      >
                                        -
                                      </span>
                                    </button>
                                    <span className="min-w-[2rem] text-center text-sm font-semibold text-foreground">
                                      {extendYear}
                                    </span>
                                    <button
                                      disabled={extendYear >= 9}
                                      onClick={handleIncrease}
                                      className="h-6 w-6 flex items-center justify-center rounded-full bg-background hover:bg-accent transition-colors text-foreground"
                                    >
                                      <span
                                        className={`text-sm font-semibold ${
                                          extendYear >= 9 ? "text-gray-300" : ""
                                        }`}
                                      >
                                        +
                                      </span>
                                    </button>
                                  </div>
                                  {extendYear > 1 ? "lata" : "rok"}
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!hasDomainPermission}
                                onClick={() =>
                                  onUpdate(
                                    { ...domain, archived: !domain.archived },
                                    0
                                  )
                                }
                              >
                                {domain.archived ? (
                                  <Undo className="mr-2 h-4 w-4" />
                                ) : (
                                  <Archive className="mr-2 h-4 w-4" />
                                )}
                                {domain.archived ? "Przywróć" : "Zarchiwizuj"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!hasDomainPermission}
                                className="text-destructive focus:text-destructive"
                                onClick={() => confirmDelete(domain.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Usuń
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
            <AlertDialogTitle>Czy na pewno chcesz to zrobić?</AlertDialogTitle>
            <AlertDialogDescription>
              Tej operacji nie można cofnąć. Domena zostanie trwale usunięta z
              bazy danych.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
