"use client";

import { useState, useEffect, useMemo } from "react";
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
      const options = authService.addAuthHeader({
        method: "GET",
      });

      const response = await fetch(API_URL, options);

      if (response.status === 401) {
        authService.logout();
        return;
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      const normalizedData = data.map((domain: any) => ({
        id: domain.id || String(Math.random()),
        name: domain.name || domain.domain || "",
        expireDate: domain.renew || new Date().toISOString().split("T")[0],
        company: domain.company || "",
        registrar: domain.registrar || "Unknown",
      }));

      setDomains(normalizedData);
      setIsLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setIsLoading(false);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to fetch domains",
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
      const options = authService.addAuthHeader({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(domain),
      });

      const response = await fetch(API_URL, options);

      if (response.status === 401) {
        authService.logout();
        return;
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const newDomain = await response.json();
      setDomains([...domains, newDomain]);
      setIsFormOpen(false);
      toast({
        title: "Success",
        description: "Domain added successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to add domain",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDomain = async (updatedDomain: Domain) => {
    try {
      const options = authService.addAuthHeader({
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedDomain),
      });

      const response = await fetch(`${API_URL}/${updatedDomain.id}`, options);

      if (response.status === 401) {
        authService.logout();
        return;
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const updated = await response.json();
      setDomains(
        domains.map((domain) => (domain.id === updated.id ? updated : domain))
      );
      setEditingDomain(null);
      setIsFormOpen(false);
      toast({
        title: "Success",
        description: "Domain updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update domain",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDomain = async (id: string) => {
    try {
      const options = authService.addAuthHeader({
        method: "DELETE",
      });

      const response = await fetch(`${API_URL}/${id}`, options);

      if (response.status === 401) {
        authService.logout();
        return;
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      setDomains(domains.filter((domain) => domain.id !== id));
      toast({
        title: "Success",
        description: "Domain deleted successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to delete domain",
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
        <p className="text-lg">Loading domains...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 flex flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-semibold text-destructive">
          Error Loading Domains
        </h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchDomains}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Again
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
                Logged in as:{" "}
                <span className="font-medium ml-1">{user.username}</span>
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
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Wszystkie statusy</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expiring-soon">
                          Expiring Soon
                        </SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
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
                    <label className="text-sm font-medium">Registrar</label>
                    <Select
                      value={filters.registrar}
                      onValueChange={(value) =>
                        handleFilterChange("registrar", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select registrar" />
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

            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Domain
            </Button>

            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.status !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status:{" "}
                {filters.status.charAt(0).toUpperCase() +
                  filters.status.slice(1).replace("-", " ")}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => handleFilterChange("status", "all")}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove status filter</span>
                </Button>
              </Badge>
            )}

            {filters.company !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Company: {filters.company}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => handleFilterChange("company", "all")}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove company filter</span>
                </Button>
              </Badge>
            )}

            {filters.registrar !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Registrar: {filters.registrar}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => handleFilterChange("registrar", "all")}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove registrar filter</span>
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
