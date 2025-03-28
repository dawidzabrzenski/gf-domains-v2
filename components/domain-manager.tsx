"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { DomainTable } from "./domain-table";
import { DomainForm } from "./domain-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  PlusCircle,
  Search,
  Filter,
  X,
  RefreshCcw,
  LogOut,
  Lock,
} from "lucide-react";
import type { Domain } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { authService } from "@/services/auth-service";

type StatusFilter = "all" | "active" | "expiring-soon" | "expired";

interface Filters {
  status: StatusFilter;
  company: string;
  registrar: string;
}

const API_URL = "http://localhost:5000/api/domains";

export function DomainManager() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [filteredDomains, setFilteredDomains] = useState<Domain[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    company: "all",
    registrar: "all",
  });

  const { toast } = useToast();
  const user = authService.getUser();
  const hasDomainPermission =
    user?.group?.permissions?.includes("domains") || false;

  const uniqueCompanies = useMemo(() => {
    return Array.from(new Set(domains.map((domain) => domain.company)));
  }, [domains]);

  const uniqueRegistrars = useMemo(() => {
    return Array.from(new Set(domains.map((domain) => domain.registrar)));
  }, [domains]);

  const fetchDomains = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(API_URL, {
        headers: authService.getAuthHeader(),
      });

      console.log("Raw backend response:", response.data);

      const data = response.data;

      const normalizedData = data.map((domain: any) => {
        const renewDate = domain.renew
          ? new Date(domain.renew).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
        return {
          id: domain._id || String(Math.random()),
          name: domain.domain || "",
          expireDate: renewDate,
          company: domain.company || "",
          registrar: domain.registrar || "Nieznany",
        };
      });

      console.log("Normalized domains:", normalizedData);
      setDomains(normalizedData);
      setIsLoading(false);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        authService.logout();
        return;
      }
      setError(err instanceof Error ? err.message : "Wystąpił nieznany błąd");
      setIsLoading(false);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać domen",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const getDomainStatus = (
    expireDate: string
  ): "active" | "expiring-soon" | "expired" => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(expireDate);
    expiryDate.setHours(0, 0, 0, 0);

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "expired";
    } else if (diffDays <= 30) {
      return "expiring-soon";
    }
    return "active";
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "all") count++;
    if (filters.company !== "all") count++;
    if (filters.registrar !== "all") count++;
    return count;
  }, [filters]);

  useEffect(() => {
    let filtered = domains;

    if (filters.status !== "all") {
      filtered = filtered.filter(
        (domain) => getDomainStatus(domain.expireDate) === filters.status
      );
    }

    if (filters.company !== "all") {
      filtered = filtered.filter(
        (domain) => domain.company === filters.company
      );
    }

    if (filters.registrar !== "all") {
      filtered = filtered.filter(
        (domain) => domain.registrar === filters.registrar
      );
    }

    if (searchQuery.trim() !== "") {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (domain) =>
          domain.name.toLowerCase().includes(lowercasedQuery) ||
          domain.company.toLowerCase().includes(lowercasedQuery) ||
          domain.registrar.toLowerCase().includes(lowercasedQuery)
      );
    }

    setFilteredDomains(filtered);
  }, [searchQuery, domains, filters]);

  const handleAddDomain = async (domain: Omit<Domain, "id">) => {
    try {
      const apiData = {
        domain: domain.name,
        renew: domain.expireDate,
        company: domain.company,
        registrar: domain.registrar,
      };

      const response = await axios.post(API_URL, apiData, {
        headers: authService.getAuthHeader(),
      });

      const newDomain = {
        id: response.data._id,
        name: response.data.domain,
        expireDate: response.data.renew,
        company: response.data.company,
        registrar: response.data.registrar,
      };

      setDomains([...domains, newDomain]);
      setIsFormOpen(false);
      toast({
        title: "Sukces",
        description: "Domena została dodana pomyślnie",
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        authService.logout();
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się dodać domeny",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDomain = async (updatedDomain: Domain) => {
    try {
      const apiData = {
        domain: updatedDomain.name,
        renew: updatedDomain.expireDate,
        company: updatedDomain.company,
        registrar: updatedDomain.registrar,
      };

      const response = await axios.put(
        `${API_URL}/${updatedDomain.id}`,
        apiData,
        {
          headers: authService.getAuthHeader(),
        }
      );

      const updated = {
        id: response.data._id,
        name: response.data.domain,
        expireDate: response.data.renew,
        company: response.data.company,
        registrar: response.data.registrar,
      };

      setDomains(
        domains.map((domain) => (domain.id === updated.id ? updated : domain))
      );
      setEditingDomain(null);
      setIsFormOpen(false);
      toast({
        title: "Sukces",
        description: "Domena została zaktualizowana pomyślnie",
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        authService.logout();
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować domeny",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDomain = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: authService.getAuthHeader(),
      });

      setDomains(domains.filter((domain) => domain.id !== id));
      toast({
        title: "Sukces",
        description: "Domena została usunięta pomyślnie",
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        authService.logout();
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć domeny",
        variant: "destructive",
      });
    }
  };

  const handleEditDomain = (domain: Domain) => {
    setEditingDomain(domain);
    setIsFormOpen(true);
  };

  const handleFilterChange = (filterType: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: "all",
      company: "all",
      registrar: "all",
    });
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-lg">Ładowanie domen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 flex flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-semibold text-destructive">
          Błąd podczas ładowania domen
        </h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchDomains}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Spróbuj ponownie
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Znajdź domenę..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {user && (
              <div className="hidden sm:flex items-center mr-2 text-sm text-muted-foreground">
                Zalogowany jako:{" "}
                <span className="font-medium ml-1">
                  {user.firstName + " " + user.lastName}
                </span>
              </div>
            )}

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtry
                  {activeFilterCount > 0 && (
                    <Badge className="ml-2 bg-primary text-primary-foreground">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtry</h4>
                    {activeFilterCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="h-8 px-2"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) =>
                        handleFilterChange("status", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Wszystkie statusy</SelectItem>
                        <SelectItem value="active">Aktywna</SelectItem>
                        <SelectItem value="expiring-soon">
                          Niedługo wygasa
                        </SelectItem>
                        <SelectItem value="expired">Wygasła</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Spółka</label>
                    <Select
                      value={filters.company}
                      onValueChange={(value) =>
                        handleFilterChange("company", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz spółkę" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Wszystkie spółki</SelectItem>
                        {uniqueCompanies.map((company) => (
                          <SelectItem key={company} value={company}>
                            {company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rejestrator</label>
                    <Select
                      value={filters.registrar}
                      onValueChange={(value) =>
                        handleFilterChange("registrar", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz rejestratora" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          Wszyscy rejestratorzy
                        </SelectItem>
                        {uniqueRegistrars.map((registrar) => (
                          <SelectItem key={registrar} value={registrar}>
                            {registrar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              disabled={!hasDomainPermission}
              onClick={() => setIsFormOpen(true)}
            >
              {hasDomainPermission ? (
                <PlusCircle className="mr-2 h-4 w-4" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              Dodaj Domenę
            </Button>

            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Wyloguj
            </Button>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.status !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status:{" "}
                {filters.status === "active"
                  ? "Aktywna"
                  : filters.status === "expiring-soon"
                  ? "Niedługo wygasa"
                  : "Wygasła"}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => handleFilterChange("status", "all")}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Usuń filtr statusu</span>
                </Button>
              </Badge>
            )}

            {filters.company !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Spółka: {filters.company}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => handleFilterChange("company", "all")}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Usuń filtr spółki</span>
                </Button>
              </Badge>
            )}

            {filters.registrar !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Rejestrator: {filters.registrar}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => handleFilterChange("registrar", "all")}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Usuń filtr rejestratora</span>
                </Button>
              </Badge>
            )}
          </div>
        )}
      </div>

      <DomainTable
        domains={filteredDomains}
        onEdit={handleEditDomain}
        onDelete={handleDeleteDomain}
      />

      {isFormOpen && (
        <DomainForm
          onSubmit={editingDomain ? handleUpdateDomain : handleAddDomain}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingDomain(null);
          }}
          initialData={editingDomain}
        />
      )}
    </div>
  );
}
